import logging
import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db

logger = logging.getLogger(__name__)

class TrialEligibilityTool:
    @staticmethod
    async def get_trial(trial_id: str) -> Dict[str, Any]:
        logger.info("Entering TrialEligibilityTool.get_trial for trial_id: %s", trial_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            trial = await db["trials"].find_one({"id": trial_id})
            if not trial:
                return {
                    "success": False,
                    "error": f"Trial {trial_id} not found",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
            if "_id" in trial:
                trial["_id"] = str(trial["_id"])
            
            # Fetch associated interventions
            cursor = db["trial_interventions"].find({"trial_id": trial_id})
            interventions = await cursor.to_list(length=100)
            for item in interventions:
                if "_id" in item:
                    item["_id"] = str(item["_id"])
            
            trial["interventions"] = interventions
            logger.info("Exiting TrialEligibilityTool.get_trial successfully")
            return {
                "success": True,
                "data": trial,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in TrialEligibilityTool.get_trial: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }

    @staticmethod
    async def get_criteria(trial_id: str) -> Dict[str, Any]:
        logger.info("Entering TrialEligibilityTool.get_criteria for trial_id: %s", trial_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["trial_eligibility"].find({"trial_id": trial_id})
            criteria = await cursor.to_list(length=100)
            for item in criteria:
                if "_id" in item:
                    item["_id"] = str(item["_id"])
            logger.info("Exiting TrialEligibilityTool.get_criteria successfully")
            return {
                "success": True,
                "data": criteria,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in TrialEligibilityTool.get_criteria: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
