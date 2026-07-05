import logging
import time
import uuid
from typing import Dict, Any, Optional
from app.db.session import get_db
from app.core.utils import calculate_age

logger = logging.getLogger(__name__)

class QueryTool:
    @staticmethod
    async def list_patients(limit: int = 100) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["patients"].find({})
            patients = await cursor.to_list(length=limit)
            result = []
            for p in patients:
                result.append({
                    "id": p.get("id"),
                    "name": f"{p.get('first', '')} {p.get('last', '')}".strip(),
                    "gender": p.get("gender"),
                    "birthdate": p.get("birthdate"),
                    "age": calculate_age(p.get("birthdate"))
                })
            return {"success": True, "data": result, "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def filter_patients_by_age(min_age: int = 0, max_age: int = 120) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["patients"].find({})
            patients = await cursor.to_list(length=10000)
            result = []
            for p in patients:
                age = calculate_age(p.get("birthdate"))
                if min_age <= age <= max_age:
                    result.append({
                        "id": p.get("id"),
                        "name": f"{p.get('first', '')} {p.get('last', '')}".strip(),
                        "age": age,
                        "gender": p.get("gender"),
                        "birthdate": p.get("birthdate")
                    })
            return {"success": True, "data": result, "count": len(result), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def filter_patients_by_medication(medication_name: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["medications"].find({"description": {"$regex": medication_name, "$options": "i"}})
            meds = await cursor.to_list(length=10000)
            patient_ids = list({m["patient_id"] for m in meds if m.get("patient_id")})
            result = []
            for pid in patient_ids:
                p = await db["patients"].find_one({"id": pid})
                if p:
                    patient_meds = [m for m in meds if m.get("patient_id") == pid]
                    result.append({
                        "id": p.get("id"),
                        "name": f"{p.get('first', '')} {p.get('last', '')}".strip(),
                        "age": calculate_age(p.get("birthdate")),
                        "matching_medications": [m.get("description") for m in patient_meds]
                    })
            return {"success": True, "data": result, "count": len(result), "medication_filter": medication_name, "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def filter_patients_by_condition(condition_keyword: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["conditions"].find({"description": {"$regex": condition_keyword, "$options": "i"}})
            conditions = await cursor.to_list(length=10000)
            patient_ids = list({c["patient_id"] for c in conditions if c.get("patient_id")})
            result = []
            for pid in patient_ids:
                p = await db["patients"].find_one({"id": pid})
                if p:
                    patient_conds = [c for c in conditions if c.get("patient_id") == pid]
                    result.append({
                        "id": p.get("id"),
                        "name": f"{p.get('first', '')} {p.get('last', '')}".strip(),
                        "age": calculate_age(p.get("birthdate")),
                        "matching_conditions": [c.get("description") for c in patient_conds]
                    })
            return {"success": True, "data": result, "count": len(result), "condition_filter": condition_keyword, "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_trials(limit: int = 50) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["trials"].find({})
            trials = await cursor.to_list(length=limit)
            result = []
            for t in trials:
                if "_id" in t:
                    t["_id"] = str(t["_id"])
                result.append(t)
            return {"success": True, "data": result, "count": len(result), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_reports(limit: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            query: Dict[str, Any] = {}
            if status:
                query["status"] = status
            cursor = db["agent_runs"].find(query).sort("created_at", -1)
            runs = await cursor.to_list(length=limit)
            result = []
            for r in runs:
                if "_id" in r:
                    r["_id"] = str(r["_id"])
                result.append({
                    "id": r.get("id"),
                    "patient_id": r.get("patient_id"),
                    "trial_id": r.get("trial_id"),
                    "status": r.get("status"),
                    "created_at": r.get("created_at"),
                    "total_duration_ms": r.get("total_duration_ms"),
                    "decision": r.get("final_report", {}).get("eligibility_decision") if r.get("final_report") else None,
                    "run_type": r.get("run_type", "eligibility")
                })
            return {"success": True, "data": result, "count": len(result), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_report(run_id: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            run = await db["agent_runs"].find_one({"id": run_id})
            if not run:
                return {"success": False, "error": f"Report {run_id} not found", "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
            if "_id" in run:
                run["_id"] = str(run["_id"])
            return {"success": True, "data": run, "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_hospital_policies() -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["hospital_policies"].find({})
            policies = await cursor.to_list(length=100)
            for p in policies:
                if "_id" in p:
                    p["_id"] = str(p["_id"])
            return {"success": True, "data": policies, "count": len(policies), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_drug_rules(limit: int = 100) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["drug_rules"].find({})
            rules = await cursor.to_list(length=limit)
            for r in rules:
                if "_id" in r:
                    r["_id"] = str(r["_id"])
            return {"success": True, "data": rules, "count": len(rules), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_encounters(patient_id: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["encounters"].find({"patient_id": patient_id})
            encounters = await cursor.to_list(length=1000)
            for e in encounters:
                if "_id" in e:
                    e["_id"] = str(e["_id"])
            return {"success": True, "data": encounters, "count": len(encounters), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_procedures(patient_id: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["procedures"].find({"patient_id": patient_id})
            procedures = await cursor.to_list(length=1000)
            for p in procedures:
                if "_id" in p:
                    p["_id"] = str(p["_id"])
            return {"success": True, "data": procedures, "count": len(procedures), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_careplans(patient_id: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["careplans"].find({"patient_id": patient_id})
            careplans = await cursor.to_list(length=500)
            for c in careplans:
                if "_id" in c:
                    c["_id"] = str(c["_id"])
            return {"success": True, "data": careplans, "count": len(careplans), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_providers(limit: int = 100) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["providers"].find({})
            providers = await cursor.to_list(length=limit)
            for p in providers:
                if "_id" in p:
                    p["_id"] = str(p["_id"])
            return {"success": True, "data": providers, "count": len(providers), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def list_organizations(limit: int = 100) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["organizations"].find({})
            orgs = await cursor.to_list(length=limit)
            for o in orgs:
                if "_id" in o:
                    o["_id"] = str(o["_id"])
            return {"success": True, "data": orgs, "count": len(orgs), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def search_patients_by_name(name: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            name_lower = name.lower().strip()
            cursor = db["patients"].find({})
            patients = await cursor.to_list(length=10000)
            result = []
            for p in patients:
                full_name = f"{p.get('first', '')} {p.get('last', '')}".lower().strip()
                if name_lower in full_name or any(part in full_name for part in name_lower.split()):
                    result.append({
                        "id": p.get("id"),
                        "name": f"{p.get('first', '')} {p.get('last', '')}".strip(),
                        "age": calculate_age(p.get("birthdate")),
                        "gender": p.get("gender"),
                        "birthdate": p.get("birthdate")
                    })
            return {"success": True, "data": result, "count": len(result), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}

    @staticmethod
    async def get_trial_criteria(trial_id: str) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["trial_eligibility"].find({"trial_id": trial_id})
            criteria = await cursor.to_list(length=500)
            for c in criteria:
                if "_id" in c:
                    c["_id"] = str(c["_id"])
            return {"success": True, "data": criteria, "count": len(criteria), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": round((time.time() - start_time) * 1000, 2), "tool_call_id": tool_call_id}
