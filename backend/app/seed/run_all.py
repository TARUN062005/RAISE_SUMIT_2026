import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

from backend.app.seed.patients import seed_all_patients
from backend.app.seed.trials import seed_all_trials
from backend.app.seed.rules import seed_policies, seed_drug_rules

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

async def run():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    print(f"Seeding data from directory: {DATA_DIR}...")
    
    pat_dir = os.path.join(DATA_DIR, "patients")
    trial_dir = os.path.join(DATA_DIR, "trails")
    policy_dir = os.path.join(DATA_DIR, "policies")
    drug_dir = os.path.join(DATA_DIR, "drug_interactions")
    
    patient_counts = await seed_all_patients(db, pat_dir)
    trial_counts = await seed_all_trials(db, trial_dir)
    policies_count = await seed_policies(db, policy_dir)
    drug_rules_count = await seed_drug_rules(db, drug_dir)
    
    # Let's count all collections in database
    counts = {}
    collections = [
        "patients", "conditions", "medications", "observations", "encounters",
        "allergies", "organizations", "providers", "procedures", "careplans",
        "trials", "trial_eligibility", "trial_interventions", "hospital_policies",
        "drug_rules", "agent_runs"
    ]
    
    print("\n--- Seeding Completed successfully ---")
    for name in collections:
        col = db[name]
        count = await col.count_documents({})
        counts[name] = count
        print(f"Collection '{name}': {count} documents")
        
    # Append counts to PROGRESS.md
    progress_path = os.path.abspath(os.path.join(DATA_DIR, "..", "PROGRESS.md"))
    timestamp = datetime.now().isoformat()
    
    counts_str = ", ".join(f"{k}: {v}" for k, v in counts.items())
    
    progress_entry = f"\n## Phase 2 — Data layer — {timestamp}\n"
    progress_entry += f"Files created/modified:\n"
    progress_entry += f"- [session.py](file:///D:/Raise/backend/app/db/session.py)\n"
    progress_entry += f"- [schemas.py](file:///D:/Raise/backend/app/models/schemas.py)\n"
    progress_entry += f"- [patients.py](file:///D:/Raise/backend/app/seed/patients.py)\n"
    progress_entry += f"- [trials.py](file:///D:/Raise/backend/app/seed/trials.py)\n"
    progress_entry += f"- [rules.py](file:///D:/Raise/backend/app/seed/rules.py)\n"
    progress_entry += f"- [run_all.py](file:///D:/Raise/backend/app/seed/run_all.py)\n"
    progress_entry += f"Collections seeded (if applicable): {counts_str}\n"
    progress_entry += f"Endpoints implemented (if applicable): none\n"
    progress_entry += f"Tools implemented (if applicable): none\n"
    progress_entry += f"Deviations from prompt and why: none\n"
    progress_entry += f"Remaining for this phase: none\n"
    
    with open(progress_path, mode="a", encoding="utf-8") as pf:
        pf.write(progress_entry)
        
    print(f"PROGRESS.md updated at: {progress_path}")

if __name__ == "__main__":
    asyncio.run(run())
