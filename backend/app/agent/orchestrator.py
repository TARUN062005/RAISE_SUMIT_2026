import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple
from backend.app.db.session import get_db
from backend.app.agent.vultr_client import VultrClient
from backend.app.agent.memory import AgentMemory
from backend.app.agent.planner import AgentPlanner
from backend.app.agent.tools.patient_tool import PatientRecordTool
from backend.app.agent.tools.trial_tool import TrialEligibilityTool
from backend.app.agent.tools.drug_tool import DrugInteractionTool
from backend.app.agent.tools.freshness_tool import FreshnessTool
from backend.app.agent.tools.report_tool import ReportTool

logger = logging.getLogger(__name__)

TOOL_MAPPING = {
    "PatientRecordTool.get_record": PatientRecordTool.get_record,
    "PatientRecordTool.get_conditions": PatientRecordTool.get_conditions,
    "PatientRecordTool.get_medications": PatientRecordTool.get_medications,
    "PatientRecordTool.get_observations": PatientRecordTool.get_observations,
    "PatientRecordTool.get_allergies": PatientRecordTool.get_allergies,
    "TrialEligibilityTool.get_trial": TrialEligibilityTool.get_trial,
    "TrialEligibilityTool.get_criteria": TrialEligibilityTool.get_criteria,
    "DrugInteractionTool.check_exclusions": DrugInteractionTool.check_exclusions,
    "FreshnessTool.check": FreshnessTool.check
}

def validate_citations(citations: list, scratchpad: dict) -> Tuple[list, list]:
    valid_pairs = set()
    for col_name, data in scratchpad.items():
        if isinstance(data, list):
            for doc in data:
                doc_id = doc.get("id") or doc.get("_id")
                if doc_id:
                    valid_pairs.add((col_name, str(doc_id)))
        elif isinstance(data, dict):
            doc_id = data.get("id") or data.get("_id")
            if doc_id:
                valid_pairs.add((col_name, str(doc_id)))
                
    valid_citations = []
    removed_citations = []
    for cit in citations:
        col = cit.get("collection")
        cid = cit.get("id")
        if col and cid and (col, str(cid)) in valid_pairs:
            valid_citations.append(cit)
        else:
            removed_citations.append(cit)
    return valid_citations, removed_citations

async def run_agent(run_id: str, patient_id: str, trial_id: str):
    logger.info("Starting agent run: %s", run_id)
    start_run_time = time.time()
    db = await get_db()
    
    # Save initial running state
    await db["agent_runs"].insert_one({
        "id": run_id,
        "patient_id": patient_id,
        "trial_id": trial_id,
        "status": "running",
        "steps": [],
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
        "total_duration_ms": None
    })
    
    try:
        vultr = VultrClient()
        memory = AgentMemory()
        
        messages = [
            {"role": "system", "content": AgentPlanner.get_system_prompt()},
            {"role": "user", "content": f"Evaluate patient '{patient_id}' for trial '{trial_id}'."}
        ]
        
        step_count = 0
        max_steps = 10
        final_ans = None
        citation_error_flag = False
        
        while step_count < max_steps:
            step_count += 1
            logger.info("Executing ReAct step %d for run %s", step_count, run_id)
            
            response_text = ""
            retry_count = 0
            parsed_json = None
            
            while retry_count < 2:
                try:
                    response_text = await vultr.chat_completion(messages)
                    parsed_json = json.loads(response_text)
                    break
                except (json.JSONDecodeError, ValueError) as e:
                    retry_count += 1
                    if retry_count == 2:
                        error_step = {
                            "type": "thought",
                            "content": f"Aborted due to LLM JSON parsing error: {e}",
                            "timestamp": datetime.now().isoformat()
                        }
                        await db["agent_runs"].update_one(
                            {"id": run_id},
                            {"$push": {"steps": error_step}, "$set": {"status": "failed", "completed_at": datetime.now().isoformat()}}
                        )
                        return
                    messages.append({"role": "assistant", "content": response_text})
                    messages.append({"role": "user", "content": "Error: Invalid JSON response. You MUST respond with a single, valid JSON object matching the ReAct contract."})
            
            thought = parsed_json.get("thought", "")
            action = parsed_json.get("action")
            final_answer = parsed_json.get("final_answer")
            
            # 1. Thought Step
            thought_step = {
                "type": "thought",
                "content": thought,
                "timestamp": datetime.now().isoformat()
            }
            await db["agent_runs"].update_one({"id": run_id}, {"$push": {"steps": thought_step}})
            messages.append({"role": "assistant", "content": json.dumps(parsed_json)})
            
            # 2. Handle Action
            if action:
                tool_name = action.get("tool")
                tool_input = action.get("input", {})
                logger.info("Executing action: %s with args: %s", tool_name, tool_input)
                
                cached_result = memory.get_cached_result(tool_name, tool_input)
                
                if cached_result:
                    obs_content = f"Cached observation of {tool_name}"
                    obs_step = {
                        "type": "observation",
                        "content": obs_content,
                        "tool_called": tool_name,
                        "tool_input": tool_input,
                        "tool_output": cached_result,
                        "tool_output_ref": f"cached::{tool_name}",
                        "duration_ms": 0,
                        "timestamp": datetime.now().isoformat()
                    }
                    await db["agent_runs"].update_one({"id": run_id}, {"$push": {"steps": obs_step}})
                    messages.append({"role": "user", "content": json.dumps({"observation": obs_content, "data": cached_result})})
                else:
                    func = TOOL_MAPPING.get(tool_name)
                    if not func:
                        err_obs = {"success": False, "error": f"Tool {tool_name} is not registered."}
                        obs_step = {
                            "type": "observation",
                            "content": f"Error: Tool {tool_name} not found",
                            "tool_called": tool_name,
                            "tool_input": tool_input,
                            "tool_output": err_obs,
                            "tool_output_ref": "error",
                            "duration_ms": 0,
                            "timestamp": datetime.now().isoformat()
                        }
                        await db["agent_runs"].update_one({"id": run_id}, {"$push": {"steps": obs_step}})
                        messages.append({"role": "user", "content": json.dumps({"observation": f"Error: Tool {tool_name} not found"})})
                    else:
                        t_start = time.time()
                        tool_res = await func(**tool_input)
                        t_duration = round((time.time() - t_start) * 1000, 2)
                        
                        memory.cache_result(tool_name, tool_input, tool_res)
                        
                        obs_content = f"Completed execution of {tool_name}"
                        obs_step = {
                            "type": "observation",
                            "content": obs_content,
                            "tool_called": tool_name,
                            "tool_input": tool_input,
                            "tool_output": tool_res,
                            "tool_output_ref": tool_res.get("tool_call_id", "unknown"),
                            "duration_ms": int(t_duration),
                            "timestamp": datetime.now().isoformat()
                        }
                        await db["agent_runs"].update_one({"id": run_id}, {"$push": {"steps": obs_step}})
                        messages.append({"role": "user", "content": json.dumps({"observation": obs_content, "data": tool_res})})
                        
            # 3. Handle Final Answer
            elif final_answer:
                citations = final_answer.get("citations", [])
                valid_cits, removed_cits = validate_citations(citations, memory.scratchpad)
                
                if removed_cits and not citation_error_flag:
                    citation_error_flag = True
                    valid_ids_str = ", ".join(f"{col}:{cid}" for col, cid in {(c.get("collection"), c.get("id")) for c in citations if c.get("collection")})
                    messages.append({
                        "role": "user",
                        "content": f"Error: Citations validation failed. You cited records not retrieved in this run. You may only cite from retrieved records: {valid_ids_str}. Please provide a corrected final_answer."
                    })
                    continue
                    
                if removed_cits:
                    final_answer["citations"] = valid_cits
                    final_answer["unverified_claim_removed"] = [str(c) for c in removed_cits]
                    
                final_ans = final_answer
                break
                
            else:
                err_step = {
                    "type": "thought",
                    "content": "No action or final_answer received from model.",
                    "timestamp": datetime.now().isoformat()
                }
                await db["agent_runs"].update_one(
                    {"id": run_id},
                    {"$push": {"steps": err_step}, "$set": {"status": "failed", "completed_at": datetime.now().isoformat()}}
                )
                return
                
        # Compile the final report
        if final_ans:
            await ReportTool.compile_report(run_id)
        else:
            await db["agent_runs"].update_one(
                {"id": run_id},
                {"$set": {"status": "incomplete", "completed_at": datetime.now().isoformat()}}
            )
            await ReportTool.compile_report(run_id)
            
        duration = round((time.time() - start_run_time) * 1000)
        await db["agent_runs"].update_one(
            {"id": run_id},
            {"$set": {"total_duration_ms": duration}}
        )
        logger.info("Agent run completed in %d ms: %s", duration, run_id)

    except Exception as e:
        logger.error(f"Error executing agent run: {e}", exc_info=True)
        error_step = {
            "type": "thought",
            "content": f"Agent loop aborted: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await db["agent_runs"].update_one(
            {"id": run_id},
            {
                "$push": {"steps": error_step},
                "$set": {
                    "status": "failed",
                    "completed_at": datetime.now().isoformat(),
                    "total_duration_ms": int((time.time() - start_run_time) * 1000)
                }
            }
        )
        # compile report as fallback
        await ReportTool.compile_report(run_id)

