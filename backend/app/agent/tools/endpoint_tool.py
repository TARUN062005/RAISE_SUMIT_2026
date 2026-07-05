import logging
import time
import uuid
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

INTERNAL_BASE_URL = "http://127.0.0.1:8000"

class EndpointFetchTool:
    @staticmethod
    async def fetch(path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        try:
            if not path.startswith("/api/"):
                return {
                    "success": False,
                    "error": "Only internal /api/* paths are permitted.",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
            url = f"{INTERNAL_BASE_URL}{path}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params or {})
                if response.status_code == 200:
                    try:
                        data = response.json()
                    except Exception:
                        data = response.text
                    return {
                        "success": True,
                        "path": path,
                        "data": data,
                        "duration_ms": round((time.time() - start_time) * 1000, 2),
                        "tool_call_id": tool_call_id
                    }
                return {
                    "success": False,
                    "error": f"Endpoint returned {response.status_code}: {response.text[:300]}",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
