import uuid
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
from backend.app.db.session import get_db
from backend.app.api.deps import get_current_staff_user
from backend.app.agent.orchestrator import run_agent

router = APIRouter(prefix="/agent", tags=["agent"])

class RunTriggerInput(BaseModel):
    patient_id: str
    trial_id: str

@router.post("/run", response_model=Dict[str, Any])
async def trigger_run(payload: RunTriggerInput, background_tasks: BackgroundTasks, user: dict = Depends(get_current_staff_user)):
    run_id = str(uuid.uuid4())
    db = await get_db()
    
    # Insert initial state immediately in the main request thread
    await db["agent_runs"].insert_one({
        "id": run_id,
        "patient_id": payload.patient_id,
        "trial_id": payload.trial_id,
        "status": "running",
        "steps": [],
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
        "total_duration_ms": None
    })
    
    background_tasks.add_task(run_agent, run_id, payload.patient_id, payload.trial_id)
    return {"run_id": run_id}

@router.get("/run/{run_id}", response_model=Dict[str, Any])
async def get_run_details(run_id: str, user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    run = await db["agent_runs"].find_one({"id": run_id})
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    if "_id" in run:
        run["_id"] = str(run["_id"])
    return run

@router.get("/run/{run_id}/stream")
async def stream_run(run_id: str, user: dict = Depends(get_current_staff_user)):
    async def event_generator():
        db = await get_db()
        last_step_count = 0
        while True:
            run = await db["agent_runs"].find_one({"id": run_id})
            if not run:
                yield "data: " + json.dumps({"error": "Run not found"}) + "\n\n"
                break
                
            steps = run.get("steps", [])
            status = run.get("status", "running")
            
            if len(steps) > last_step_count:
                for step in steps[last_step_count:]:
                    yield "data: " + json.dumps(step) + "\n\n"
                last_step_count = len(steps)
                
            if status in ["completed", "failed", "incomplete"]:
                final_report = run.get("final_report")
                yield "data: " + json.dumps({"status": status, "final": True, "final_report": final_report}) + "\n\n"
                break
                
            await asyncio.sleep(0.5)
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

from typing import List

@router.get("/runs", response_model=List[Dict[str, Any]])
async def list_runs(user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    cursor = db["agent_runs"].find({}).sort("created_at", -1)
    runs = await cursor.to_list(length=100)
    for r in runs:
        if "_id" in r:
            r["_id"] = str(r["_id"])
    return runs
