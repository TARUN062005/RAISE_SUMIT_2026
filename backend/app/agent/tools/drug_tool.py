import logging
import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.agent.tools.patient_tool import PatientRecordTool
from backend.app.agent.tools.trial_tool import TrialEligibilityTool

logger = logging.getLogger(__name__)

class DrugInteractionTool:
    @staticmethod
    async def check_exclusions(patient_id: str, trial_id: str) -> Dict[str, Any]:
        logger.info("Entering DrugInteractionTool.check_exclusions for patient: %s, trial: %s", patient_id, trial_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        
        try:
            # 1. Fetch patient medications
            meds_result = await PatientRecordTool.get_medications(patient_id)
            if not meds_result.get("success"):
                return {
                    "success": False,
                    "error": meds_result.get("error"),
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
            
            meds = meds_result.get("data", [])
            active_meds = []
            now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            for m in meds:
                stop = m.get("stop_date")
                if not stop or stop >= now_str:
                    active_meds.append(m)
            
            # 2. Fetch trial details
            trial_result = await TrialEligibilityTool.get_trial(trial_id)
            if not trial_result.get("success"):
                return {
                    "success": False,
                    "error": trial_result.get("error"),
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
                
            trial_data = trial_result.get("data", {})
            interventions = trial_data.get("interventions", [])
            excluded_categories = set()
            for inter in interventions:
                for cat in inter.get("excluded_medications", []):
                    excluded_categories.add(cat.lower())
                    
            # 3. Fetch drug rules
            db = await get_db()
            cursor = db["drug_rules"].find({})
            drug_rules = await cursor.to_list(length=1000)
            
            # 4. Cross reference
            excluded = False
            matched_rules = []
            
            for am in active_meds:
                desc_lower = am.get("description", "").lower()
                for rule in drug_rules:
                    drug_name = rule.get("drug", "").lower()
                    if drug_name and drug_name in desc_lower:
                        category = rule.get("category", "")
                        if category.lower() in excluded_categories:
                            excluded = True
                            matched_rules.append({
                                "medication": am.get("description"),
                                "category": category,
                                "severity": rule.get("severity"),
                                "description": rule.get("description") or rule.get("reason")
                            })
                            
            logger.info("Exiting DrugInteractionTool.check_exclusions successfully")
            return {
                "success": True,
                "data": {
                    "excluded": excluded,
                    "matched_rules": matched_rules,
                    "patient_medications": active_meds
                },
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in DrugInteractionTool.check_exclusions: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
