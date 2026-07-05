import uuid
import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.db.session import get_db
from app.api.deps import get_current_staff_user
from app.agent.orchestrator import run_assistant

router = APIRouter(prefix="/assistant", tags=["assistant"])

class AssistantRequest(BaseModel):
    query: str

@router.post("/run")
async def trigger_assistant_run(
    request: AssistantRequest,
    background_tasks: BackgroundTasks,
    _user: dict = Depends(get_current_staff_user)
):
    run_id = str(uuid.uuid4())
    db = await get_db()
    run_doc = {
        "id": run_id,
        "run_type": "assistant",
        "query": request.query,
        "status": "running",
        "steps": [],
        "final_report": None,
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
        "total_duration_ms": None
    }
    await db["agent_runs"].insert_one(run_doc)
    background_tasks.add_task(run_assistant, run_id, request.query)
    return {"run_id": run_id, "status": "running"}

@router.get("/run/{run_id}")
async def get_assistant_run(
    run_id: str,
    _user: dict = Depends(get_current_staff_user)
):
    db = await get_db()
    run = await db["agent_runs"].find_one({"id": run_id, "run_type": "assistant"})
    if not run:
        raise HTTPException(status_code=404, detail="Assistant run not found")
    if "_id" in run:
        run["_id"] = str(run["_id"])
    return run

@router.get("/run/{run_id}/stream")
async def stream_assistant_run(
    run_id: str,
    _user: dict = Depends(get_current_staff_user)
):
    db = await get_db()

    async def event_generator():
        sent_step_indices = set()
        poll_interval = 0.8
        timeout_seconds = 300
        elapsed = 0

        while elapsed < timeout_seconds:
            run = await db["agent_runs"].find_one({"id": run_id})
            if not run:
                yield f"data: {json.dumps({'error': 'Assistant run not found'})}\n\n"
                return

            steps = run.get("steps", [])
            for idx, step in enumerate(steps):
                if idx not in sent_step_indices:
                    sent_step_indices.add(idx)
                    yield f"data: {json.dumps(step)}\n\n"

            status = run.get("status")
            if status in ("completed", "failed"):
                final_payload = {
                    "final": True,
                    "status": status,
                    "final_report": run.get("final_report"),
                    "query": run.get("query")
                }
                yield f"data: {json.dumps(final_payload)}\n\n"
                return

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        yield f"data: {json.dumps({'error': 'Stream timeout'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/runs")
async def list_assistant_runs(_user: dict = Depends(get_current_staff_user)):
    db = await get_db()
    cursor = db["agent_runs"].find({"run_type": "assistant"}).sort("created_at", -1)
    runs = await cursor.to_list(length=50)
    result = []
    for r in runs:
        if "_id" in r:
            r["_id"] = str(r["_id"])
        result.append({
            "id": r.get("id"),
            "query": r.get("query"),
            "status": r.get("status"),
            "created_at": r.get("created_at"),
            "total_duration_ms": r.get("total_duration_ms"),
            "response_type": r.get("final_report", {}).get("response_type") if r.get("final_report") else None
        })
    return result
