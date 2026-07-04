from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.db.session import get_db
from app.api.deps import get_current_staff_user

router = APIRouter(prefix="/trials", tags=["trials"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_trials(user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    cursor = db["trials"].find({})
    trials = await cursor.to_list(length=100)
    
    result = []
    for t in trials:
        result.append({
            "id": t.get("id"),
            "title": t.get("title", ""),
            "condition": t.get("condition", ""),
            "phase": t.get("phase", ""),
            "status": t.get("status", "")
        })
    return result
