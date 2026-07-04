import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

from backend.app.seed.patients import seed_all_patients
from backend.app.seed.trials import seed_all_trials
from backend.app.seed.rules import seed_policies, seed_drug_rules

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

async def seed_golden_patient(db):
    patient_id = "john_williams"
    
    # 1. Patients profile
    patient_doc = {
        "id": patient_id,
        "first": "John",
        "last": "Williams",
        "gender": "M",
        "birthdate": "1968-03-12T00:00:00"  # Exactly 58 years old relative to 2026-07-04
    }
    await db["patients"].replace_one({"id": patient_id}, patient_doc, upsert=True)
    
    # 2. Conditions
    # Diagnosis: NSCLC, Stage IIA
    conditions = [
        {
            "id": "john_nsclc",
            "patient_id": patient_id,
            "description": "Non-small cell lung cancer (NSCLC)",
            "code": "254637007",
            "date": "2025-10-15T00:00:00"
        },
        {
            "id": "john_stage_iia",
            "patient_id": patient_id,
            "description": "Stage IIA NSCLC",
            "code": "Stage_IIA",
            "date": "2025-10-15T00:00:00"
        }
    ]
    for c in conditions:
        await db["conditions"].replace_one({"id": c["id"]}, c, upsert=True)
        
    # 3. Medications: Metformin, Aspirin, Warfarin
    meds = [
        {"id": "john_med_metformin", "patient_id": patient_id, "description": "Metformin 500mg", "date": "2025-12-01T00:00:00"},
        {"id": "john_med_aspirin", "patient_id": patient_id, "description": "Aspirin 81mg", "date": "2025-12-01T00:00:00"},
        {"id": "john_med_warfarin", "patient_id": patient_id, "description": "Warfarin 5mg", "date": "2025-12-01T00:00:00"}
    ]
    for med in meds:
        await db["medications"].replace_one({"id": med["id"]}, med, upsert=True)
        
    # 4. Observations: ECOG 1, Expired CBC & LFT, Current CT Scan & PET Scan, No ECG
    obs = [
        {
            "id": "john_obs_ecog",
            "patient_id": patient_id,
            "description": "ECOG Performance Status",
            "code": "ecog",
            "value": "1",
            "units": "",
            "date": "2026-06-01T00:00:00"
        },
        {
            "id": "john_obs_cbc",
            "patient_id": patient_id,
            "description": "Complete Blood Count (CBC) Panel",
            "code": "cbc",
            "value": "7.2",
            "units": "k/ul",
            "date": "2025-05-10T00:00:00"  # Expired relative to 2026-07-04 (12m validity)
        },
        {
            "id": "john_obs_lft",
            "patient_id": patient_id,
            "description": "Liver Function Test (LFT) Panel",
            "code": "lft",
            "value": "normal",
            "units": "",
            "date": "2025-05-10T00:00:00"  # Expired relative to 2026-07-04 (12m validity)
        },
        {
            "id": "john_obs_ct",
            "patient_id": patient_id,
            "description": "CT Scan Chest",
            "code": "ct_scan",
            "value": "Completed",
            "units": "",
            "date": "2026-06-15T00:00:00"  # Current
        },
        {
            "id": "john_obs_pet",
            "patient_id": patient_id,
            "description": "PET Scan",
            "code": "pet_scan",
            "value": "Completed",
            "units": "",
            "date": "2026-06-15T00:00:00"  # Current
        }
    ]
    for o in obs:
        await db["observations"].replace_one({"id": o["id"]}, o, upsert=True)

async def run():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    print(f"Seeding data from directory: {DATA_DIR}...")
    
    pat_dir = os.path.join(DATA_DIR, "patients")
    trial_dir = os.path.join(DATA_DIR, "trails")
    policy_dir = os.path.join(DATA_DIR, "policies")
    drug_dir = os.path.join(DATA_DIR, "drug_interactions")
    
    # Check if large clinical collections are already seeded to save network time
    patients_count_db = await db["patients"].count_documents({})
    observations_count_db = await db["observations"].count_documents({})
    
    if patients_count_db >= 35 and observations_count_db >= 40000:
        print(f"Skipping bulk patient EHR records seed (already populated: {patients_count_db} patients, {observations_count_db} observations)")
    else:
        print("Seeding large patient clinical collections...")
        await seed_all_patients(db, pat_dir)
        
    trial_counts = await seed_all_trials(db, trial_dir)
    policies_count = await seed_policies(db, policy_dir)
    drug_rules_count = await seed_drug_rules(db, drug_dir)
    
    # Seed the Golden Demo Patient
    await seed_golden_patient(db)
    
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
