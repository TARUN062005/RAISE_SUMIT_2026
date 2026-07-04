from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from backend.app.db.session import get_db
from backend.app.api.deps import get_current_staff_user

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_patients(user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    cursor = db["patients"].find({})
    patients = await cursor.to_list(length=1000)
    
    result = []
    for p in patients:
        result.append({
            "id": p.get("id"),
            "name": f"{p.get('first', '')} {p.get('last', '')}",
            "dob": p.get("birthdate", "")
        })
    return result

@router.get("/{patient_id}", response_model=Dict[str, Any])
async def get_patient_profile(patient_id: str, user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    patient = await db["patients"].find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if "_id" in patient:
        patient["_id"] = str(patient["_id"])
        
    conditions = await db["conditions"].find({"patient_id": patient_id}).to_list(length=1000)
    for c in conditions:
        if "_id" in c:
            c["_id"] = str(c["_id"])
            
    medications = await db["medications"].find({"patient_id": patient_id}).to_list(length=1000)
    for m in medications:
        if "_id" in m:
            m["_id"] = str(m["_id"])
            
    observations = await db["observations"].find({"patient_id": patient_id}).to_list(length=1000)
    for o in observations:
        if "_id" in o:
            o["_id"] = str(o["_id"])
            
    allergies = await db["allergies"].find({"patient_id": patient_id}).to_list(length=1000)
    for a in allergies:
        if "_id" in a:
            a["_id"] = str(a["_id"])
            
    return {
        "demographics": patient,
        "conditions": conditions,
        "medications": medications,
        "observations": observations,
        "allergies": allergies
    }
