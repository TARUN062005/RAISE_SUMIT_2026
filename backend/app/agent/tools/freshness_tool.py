import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db

logger = logging.getLogger(__name__)

class FreshnessTool:
    @staticmethod
    async def check(record_type: str, record_date: str, policy_name: Optional[str] = None) -> Dict[str, Any]:
        logger.info("Entering FreshnessTool.check: type=%s, date=%s, policy=%s", record_type, record_date, policy_name)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        
        try:
            db = await get_db()
            policy = None
            if policy_name:
                policy = await db["hospital_policies"].find_one({"name": policy_name})
            if not policy:
                policy = await db["hospital_policies"].find_one({"applies_to": record_type})
                
            if not policy:
                return {
                    "success": False,
                    "error": f"No policy found matching type '{record_type}' or name '{policy_name}'",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
                
            validity_months = policy.get("validity_months", 12.0)
            
            # Clean date strings
            # record_date could be "2026-06-02" or ISO timestamp
            clean_rec_date = record_date.split("T")[0]
            rec_dt = datetime.strptime(clean_rec_date, "%Y-%m-%d")
            
            # Current time (2026-07-04 as per hackathon metadata)
            now_dt = datetime(2026, 7, 4)
            
            elapsed_days = (now_dt - rec_dt).days
            months_elapsed = round(elapsed_days / 30.0, 2)
            
            valid = months_elapsed <= validity_months
            
            logger.info("Exiting FreshnessTool.check successfully")
            return {
                "success": True,
                "data": {
                    "valid": valid,
                    "policy_applied": policy.get("name"),
                    "months_elapsed": months_elapsed,
                    "months_allowed": validity_months
                },
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in FreshnessTool.check: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        
        
