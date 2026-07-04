import logging
import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.db.session import get_db

logger = logging.getLogger(__name__)

class PatientQueryInput(BaseModel):
    patient_id: str

class ObservationQueryInput(BaseModel):
    patient_id: str
    code: Optional[str] = None

class ToolResult(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: float
    tool_call_id: str

class PatientRecordTool:
    @staticmethod
    async def get_record(patient_id: str) -> Dict[str, Any]:
        logger.info("Entering PatientRecordTool.get_record for patient_id: %s", patient_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            pat = await db["patients"].find_one({"id": patient_id})
            if not pat:
                return {
                    "success": False,
                    "error": f"Patient with ID {patient_id} not found",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
            if "_id" in pat:
                pat["_id"] = str(pat["_id"])
            
            logger.info("Exiting PatientRecordTool.get_record successfully")
            return {
                "success": True,
                "data": pat,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in PatientRecordTool.get_record: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }

    @staticmethod
    async def get_conditions(patient_id: str) -> Dict[str, Any]:
        logger.info("Entering PatientRecordTool.get_conditions for patient_id: %s", patient_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["conditions"].find({"patient_id": patient_id})
            conds = await cursor.to_list(length=1000)
            for c in conds:
                if "_id" in c:
                    c["_id"] = str(c["_id"])
            logger.info("Exiting PatientRecordTool.get_conditions successfully")
            return {
                "success": True,
                "data": conds,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in PatientRecordTool.get_conditions: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }

    @staticmethod
    async def get_medications(patient_id: str) -> Dict[str, Any]:
        logger.info("Entering PatientRecordTool.get_medications for patient_id: %s", patient_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["medications"].find({"patient_id": patient_id})
            meds = await cursor.to_list(length=1000)
            for m in meds:
                if "_id" in m:
                    m["_id"] = str(m["_id"])
            logger.info("Exiting PatientRecordTool.get_medications successfully")
            return {
                "success": True,
                "data": meds,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in PatientRecordTool.get_medications: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }

    @staticmethod
    async def get_observations(patient_id: str, code: Optional[str] = None) -> Dict[str, Any]:
        logger.info("Entering PatientRecordTool.get_observations for patient_id: %s, code: %s", patient_id, code)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            query = {"patient_id": patient_id}
            if code:
                query["code"] = code
            cursor = db["observations"].find(query)
            obs = await cursor.to_list(length=1000)
            for o in obs:
                if "_id" in o:
                    o["_id"] = str(o["_id"])
            logger.info("Exiting PatientRecordTool.get_observations successfully")
            return {
                "success": True,
                "data": obs,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in PatientRecordTool.get_observations: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }

    @staticmethod
    async def get_allergies(patient_id: str) -> Dict[str, Any]:
        logger.info("Entering PatientRecordTool.get_allergies for patient_id: %s", patient_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            db = await get_db()
            cursor = db["allergies"].find({"patient_id": patient_id})
            alls = await cursor.to_list(length=1000)
            for a in alls:
                if "_id" in a:
                    a["_id"] = str(a["_id"])
            logger.info("Exiting PatientRecordTool.get_allergies successfully")
            return {
                "success": True,
                "data": alls,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in PatientRecordTool.get_allergies: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
