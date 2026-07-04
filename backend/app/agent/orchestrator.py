import json
import logging
import time
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List, Tuple
from app.db.session import get_db
from app.agent.vultr_client import VultrClient
from app.agent.memory import AgentMemory
from app.agent.planner import AgentPlanner
from app.agent.tools.patient_tool import PatientRecordTool
from app.agent.tools.trial_tool import TrialEligibilityTool
from app.agent.tools.drug_tool import DrugInteractionTool
from app.agent.tools.freshness_tool import FreshnessTool
from app.agent.tools.report_tool import ReportTool

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
        if isinstance(cit, dict):
            col = cit.get("collection")
            cid = cit.get("id")
            if col and cid and (col, str(cid)) in valid_pairs:
                valid_citations.append(cit)
            else:
                removed_citations.append(cit)
        elif isinstance(cit, str):
            found = False
            for col_name, str_id in valid_pairs:
                if str_id == cit:
                    valid_citations.append({"collection": col_name, "id": cit})
                    found = True
                    break
            if not found:
                removed_citations.append({"collection": "unknown", "id": cit})
    return valid_citations, removed_citations

def clean_tool_res_for_llm(tool_name: str, tool_res: dict) -> dict:
    if tool_name != "TrialEligibilityTool.get_criteria":
        return tool_res
        
    cleaned = dict(tool_res)
    data = cleaned.get("data")
    if not isinstance(data, list):
        return cleaned
        
    seen_descriptions = set()
    deduped_data = []
    for item in data:
        desc = item.get("description", "").strip()
        desc_key = desc.lower()
        if desc_key not in seen_descriptions:
            seen_descriptions.add(desc_key)
            item_copy = dict(item)
            if len(desc) > 200:
                item_copy["description"] = desc[:197] + "..."
            deduped_data.append(item_copy)
            
    if len(deduped_data) > 20:
        grouped = {}
        for item in deduped_data:
            field = item.get("field", "general")
            grouped.setdefault(field, []).append(item)
        cleaned["data"] = grouped
    else:
        cleaned["data"] = deduped_data
        
    return cleaned

def extract_first_json_object(text: str) -> dict:
    if not isinstance(text, str):
        raise ValueError("Received invalid non-string response from LLM")
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    start_idx = text.find('{')
    if start_idx == -1:
        raise ValueError("No JSON object structure '{' found in response")
    try:
        obj, _ = json.JSONDecoder().raw_decode(text[start_idx:])
        return obj
    except Exception as e:
        raise ValueError(f"Tolerant JSON extraction failed: {e}")

async def run_agent(run_id: str, patient_id: str, trial_id: str):
    logger.info("Starting agent run: %s", run_id)
    start_run_time = time.time()
    db = await get_db()
    
    # Initial state document was already inserted in trigger_run
    logger.info("Agent run database record initialized: %s", run_id)
    
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
                    parsed_json = extract_first_json_object(response_text)
                    break
                except Exception as e:
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
                    messages.append({"role": "assistant", "content": str(response_text)})
                    messages.append({"role": "user", "content": f"Error: Invalid response. {e}. You MUST respond with a single, valid JSON object matching the ReAct contract."})
            
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
            actions_list = []
            if isinstance(action, list):
                actions_list = action
            elif isinstance(action, dict):
                actions_list = [action]

            if actions_list:
                tasks = []
                for act in actions_list:
                    tool_name = act.get("tool")
                    tool_input = act.get("input", {})
                    logger.info("Scheduling action: %s with args: %s", tool_name, tool_input)
                    
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
                        async def dummy_cached_wrapper(o_step, o_content, c_res):
                            return o_step, o_content, c_res
                        tasks.append(dummy_cached_wrapper(obs_step, obs_content, cached_result))
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
                            async def dummy_err_wrapper(o_step, o_content, e_obs):
                                return o_step, o_content, e_obs
                            tasks.append(dummy_err_wrapper(obs_step, f"Error: Tool {tool_name} not found", err_obs))
                        else:
                            async def run_tool_wrapper(t_name, t_input, f):
                                t_start = time.time()
                                try:
                                    tool_res = await f(**t_input)
                                except Exception as err:
                                    tool_res = {"success": False, "error": str(err), "tool_call_id": str(uuid.uuid4())}
                                t_duration = round((time.time() - t_start) * 1000, 2)
                                
                                memory.cache_result(t_name, t_input, tool_res)
                                
                                obs_content = f"Completed execution of {t_name}"
                                obs_step = {
                                    "type": "observation",
                                    "content": obs_content,
                                    "tool_called": t_name,
                                    "tool_input": t_input,
                                    "tool_output": tool_res,
                                    "tool_output_ref": tool_res.get("tool_call_id", "unknown"),
                                    "duration_ms": int(t_duration),
                                    "timestamp": datetime.now().isoformat()
                                }
                                return obs_step, obs_content, tool_res
                                
                            tasks.append(run_tool_wrapper(tool_name, tool_input, func))
                            
                results = await asyncio.gather(*tasks)
                obs_msgs = []
                for obs_step, obs_content, tool_res in results:
                    await db["agent_runs"].update_one({"id": run_id}, {"$push": {"steps": obs_step}})
                    cleaned_tool_res = clean_tool_res_for_llm(obs_step.get("tool_called"), tool_res)
                    obs_msgs.append({"observation": obs_content, "data": cleaned_tool_res})
                    
                messages.append({"role": "user", "content": json.dumps(obs_msgs)})
                        
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

