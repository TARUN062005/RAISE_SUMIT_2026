import sys
import logging
from fastapi import FastAPI
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

    # 3. Vultr model load verification
    if not settings.VULTR_API_KEY:
        logger.warning("Vultr model loaded: FAILED (VULTR_API_KEY is not set)")
    else:
        try:
            from backend.app.agent.vultr_client import VultrClient
            vultr = VultrClient()
            logger.info("Vultr model loaded: %s", vultr.model)
        except Exception as e:
            logger.warning("Vultr model loaded: FAILED (%s)", e)

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

@app.get("/health")
async def health_check():
    return {"status": "ok"}
