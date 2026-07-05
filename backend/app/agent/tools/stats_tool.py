import logging
import time
import uuid
from typing import Dict, Any
from app.db.session import get_db
from app.core.utils import calculate_age

logger = logging.getLogger(__name__)

class StatsTool:
    @staticmethod
    async def get_patient_count() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            count = await db["patients"].count_documents({})
            return {
                "success": True,
                "data": {"count": count, "label": "Total Patients"},
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_trial_count() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            count = await db["trials"].count_documents({})
            return {
                "success": True,
                "data": {"count": count, "label": "Total Trials"},
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_report_count() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            total = await db["agent_runs"].count_documents({})
            completed = await db["agent_runs"].count_documents({"status": "completed"})
            failed = await db["agent_runs"].count_documents({"status": "failed"})
            running = await db["agent_runs"].count_documents({"status": "running"})
            return {
                "success": True,
                "data": {"total": total, "completed": completed, "failed": failed, "running": running},
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_average_patient_age() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["patients"].find({}, {"birthdate": 1})
            patients = await cursor.to_list(length=10000)
            ages = [calculate_age(p.get("birthdate")) for p in patients if p.get("birthdate")]
            avg_age = round(sum(ages) / len(ages), 1) if ages else 0
            return {
                "success": True,
                "data": {"average_age": avg_age, "patient_count": len(ages), "min_age": min(ages) if ages else 0, "max_age": max(ages) if ages else 0},
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_collection_stats() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            collections = [
                "patients", "conditions", "medications", "observations", "encounters",
                "allergies", "organizations", "providers", "procedures", "careplans",
                "trials", "trial_eligibility", "trial_interventions", "hospital_policies",
                "drug_rules", "agent_runs"
            ]
            counts = {}
            for name in collections:
                counts[name] = await db[name].count_documents({})
            return {
                "success": True,
                "data": counts,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_trial_stats() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["trials"].find({})
            trials = await cursor.to_list(length=1000)
            by_condition: Dict[str, int] = {}
            by_phase: Dict[str, int] = {}
            by_status: Dict[str, int] = {}
            for t in trials:
                cond = t.get("condition", "Unknown")
                phase = t.get("phase", "Unknown")
                status = t.get("status", "Unknown")
                by_condition[cond] = by_condition.get(cond, 0) + 1
                by_phase[phase] = by_phase.get(phase, 0) + 1
                by_status[status] = by_status.get(status, 0) + 1
            return {
                "success": True,
                "data": {"total": len(trials), "by_condition": by_condition, "by_phase": by_phase, "by_status": by_status},
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
