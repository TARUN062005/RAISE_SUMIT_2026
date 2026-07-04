import sys
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routers.patients import router as patients_router
from backend.app.api.routers.trials import router as trials_router
from backend.app.api.routers.agent import router as agent_router
from backend.app.db.session import client, db
from backend.app.core.config import settings

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("backend")

app = FastAPI(title="Hospital Enterprise Clinical Trial Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        alt = text.replace("✓", "[OK]").replace("✗", "[FAIL]").replace("\u2717", "[FAIL]")
        print(alt)

@app.on_event("startup")
async def startup_event():
    # 1. Connected to MongoDB or fail
    try:
        await client.admin.command('ping')
        safe_print("✓ Connected to MongoDB")
        logger.info("Connected to MongoDB")
    except Exception as e:
        safe_print("✗ MongoDB connection failed")
        logger.critical("MongoDB connection failed: %s", e)
        sys.exit(1)

    # 2. Collections loaded verification
    try:
        collections = [
            "patients", "conditions", "medications", "observations", "encounters",
            "allergies", "organizations", "providers", "procedures", "careplans",
            "trials", "trial_eligibility", "trial_interventions", "hospital_policies",
            "drug_rules", "agent_runs"
        ]
        counts = {}
        for name in collections:
            counts[name] = await db[name].count_documents({})
        logger.info("Collections loaded: %s", counts)
    except Exception as e:
        logger.error("Failed to count collections: %s", e)

    # 3. Vultr health check
    try:
        from backend.app.agent.vultr_client import VultrClient
        await VultrClient.run_startup_health_check()
    except Exception as e:
        logger.critical("Vultr startup health check failed: %s", e)
        sys.exit(1)

    # 4. Routes registered logging
    registered_routes = []
    for r in app.routes:
        if hasattr(r, "path"):
            methods = getattr(r, "methods", None)
            method_str = f"[{','.join(methods)}]" if methods else ""
            registered_routes.append(f"{method_str} {r.path}")
    logger.info("Routes registered: %s", ", ".join(registered_routes))

app.include_router(patients_router, prefix="/api")
app.include_router(trials_router, prefix="/api")
app.include_router(agent_router, prefix="/api")

from backend.app.api.deps import get_current_staff_user

@app.get("/api/me")
async def get_me(user: dict = Depends(get_current_staff_user)):
    return user

@app.get("/health")
async def health_check():
    mongo_status = "unhealthy"
    try:
        await client.admin.command('ping')
        mongo_status = "healthy"
    except Exception:
        pass
        
    vultr_status = "unconfigured"
    if settings.VULTR_API_KEY and settings.VULTR_MODEL:
        vultr_status = "configured"
        
    return {
        "status": "ok" if mongo_status == "healthy" else "degraded",
        "mongodb": mongo_status,
        "vultr_inference": vultr_status,
        "vultr_model": settings.VULTR_MODEL
    }
