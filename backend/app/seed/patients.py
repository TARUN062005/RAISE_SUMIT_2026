import os
import csv
import hashlib
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReplaceOne

def get_hash_id(*args):
    string_to_hash = "".join(str(arg) for arg in args)
    return hashlib.sha256(string_to_hash.encode()).hexdigest()

def read_csv_dynamic(file_path):
    rows = []
    if not os.path.exists(file_path):
        return rows
    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            clean_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
            rows.append(clean_row)
    return rows

def get_case_insensitive(row, key, default=None):
    key_lower = key.lower()
    for k, v in row.items():
        if k.lower() == key_lower:
            return v
    return default

async def seed_organizations(db, data_dir):
    file_path = os.path.join(data_dir, "organizations.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        org_id = get_case_insensitive(r, "id") or get_case_insensitive(r, "Id")
        name = get_case_insensitive(r, "name")
        if org_id and name:
            docs.append({
                "id": org_id,
                "name": name,
                "address": get_case_insensitive(r, "address"),
                "city": get_case_insensitive(r, "city"),
                "state": get_case_insensitive(r, "state"),
                "zip": get_case_insensitive(r, "zip"),
                "lat": get_case_insensitive(r, "lat"),
                "lon": get_case_insensitive(r, "lon"),
                "phone": get_case_insensitive(r, "phone"),
                "revenue": get_case_insensitive(r, "revenue"),
                "utilization": get_case_insensitive(r, "utilization")
            })
    if docs:
        col = db["organizations"]
        await col.create_index("id", unique=True)
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_providers(db, data_dir):
    file_path = os.path.join(data_dir, "providers.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        prov_id = get_case_insensitive(r, "id") or get_case_insensitive(r, "Id")
        name = get_case_insensitive(r, "name")
        org_id = get_case_insensitive(r, "organization")
        spec = get_case_insensitive(r, "speciality") or get_case_insensitive(r, "specialty")
        if prov_id and name:
            docs.append({
                "id": prov_id,
                "name": name,
                "organization_id": org_id,
                "specialty": spec,
                "gender": get_case_insensitive(r, "gender"),
                "address": get_case_insensitive(r, "address"),
                "city": get_case_insensitive(r, "city"),
                "state": get_case_insensitive(r, "state"),
                "zip": get_case_insensitive(r, "zip"),
                "lat": get_case_insensitive(r, "lat"),
                "lon": get_case_insensitive(r, "lon"),
                "encounters": get_case_insensitive(r, "encounters"),
                "procedures": get_case_insensitive(r, "procedures")
            })
    if docs:
        col = db["providers"]
        await col.create_index("id", unique=True)
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_patients(db, data_dir):
    file_path = os.path.join(data_dir, "patients.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        pat_id = get_case_insensitive(r, "id") or get_case_insensitive(r, "Id")
        birthdate = get_case_insensitive(r, "birthdate")
        gender = get_case_insensitive(r, "gender")
        first = get_case_insensitive(r, "first")
        last = get_case_insensitive(r, "last")
        race = get_case_insensitive(r, "race")
        ethnicity = get_case_insensitive(r, "ethnicity")
        if pat_id:
            docs.append({
                "id": pat_id,
                "birthdate": birthdate,
                "gender": gender,
                "first": first,
                "last": last,
                "race": race,
                "ethnicity": ethnicity,
                "deathdate": get_case_insensitive(r, "deathdate"),
                "ssn": get_case_insensitive(r, "ssn"),
                "drivers": get_case_insensitive(r, "drivers"),
                "passport": get_case_insensitive(r, "passport"),
                "prefix": get_case_insensitive(r, "prefix"),
                "middle": get_case_insensitive(r, "middle"),
                "suffix": get_case_insensitive(r, "suffix"),
                "maiden": get_case_insensitive(r, "maiden"),
                "marital": get_case_insensitive(r, "marital"),
                "birthplace": get_case_insensitive(r, "birthplace"),
                "address": get_case_insensitive(r, "address"),
                "city": get_case_insensitive(r, "city"),
                "state": get_case_insensitive(r, "state"),
                "county": get_case_insensitive(r, "county"),
                "fips": get_case_insensitive(r, "fips"),
                "zip": get_case_insensitive(r, "zip"),
                "lat": get_case_insensitive(r, "lat"),
                "lon": get_case_insensitive(r, "lon"),
                "healthcare_expenses": get_case_insensitive(r, "healthcare_expenses"),
                "healthcare_coverage": get_case_insensitive(r, "healthcare_coverage"),
                "income": get_case_insensitive(r, "income")
            })
    if docs:
        col = db["patients"]
        await col.create_index("id", unique=True)
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_encounters(db, data_dir):
    file_path = os.path.join(data_dir, "encounters.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        enc_id = get_case_insensitive(r, "id") or get_case_insensitive(r, "Id")
        patient_id = get_case_insensitive(r, "patient")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        stop_date = get_case_insensitive(r, "stop")
        prov_id = get_case_insensitive(r, "provider")
        if enc_id and patient_id:
            docs.append({
                "id": enc_id,
                "patient_id": patient_id,
                "code": code,
                "description": desc,
                "start_date": start_date,
                "stop_date": stop_date,
                "provider_id": prov_id,
                "organization": get_case_insensitive(r, "organization"),
                "payer": get_case_insensitive(r, "payer"),
                "encounterclass": get_case_insensitive(r, "encounterclass"),
                "base_encounter_cost": get_case_insensitive(r, "base_encounter_cost"),
                "total_claim_cost": get_case_insensitive(r, "total_claim_cost"),
                "payer_coverage": get_case_insensitive(r, "payer_coverage"),
                "reasoncode": get_case_insensitive(r, "reasoncode"),
                "reasondescription": get_case_insensitive(r, "reasondescription")
            })
    if docs:
        col = db["encounters"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_conditions(db, data_dir):
    file_path = os.path.join(data_dir, "conditions.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        stop_date = get_case_insensitive(r, "stop")
        if patient_id and code:
            cond_id = get_hash_id(patient_id, encounter_id, code, start_date)
            docs.append({
                "id": cond_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "start_date": start_date,
                "stop_date": stop_date,
                "system": get_case_insensitive(r, "system")
            })
    if docs:
        col = db["conditions"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_medications(db, data_dir):
    file_path = os.path.join(data_dir, "medications.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        stop_date = get_case_insensitive(r, "stop")
        if patient_id and code:
            med_id = get_hash_id(patient_id, encounter_id, code, start_date)
            docs.append({
                "id": med_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "start_date": start_date,
                "stop_date": stop_date,
                "payer": get_case_insensitive(r, "payer"),
                "base_cost": get_case_insensitive(r, "base_cost"),
                "payer_coverage": get_case_insensitive(r, "payer_coverage"),
                "dispenses": get_case_insensitive(r, "dispenses"),
                "totalcost": get_case_insensitive(r, "totalcost"),
                "reasoncode": get_case_insensitive(r, "reasoncode"),
                "reasondescription": get_case_insensitive(r, "reasondescription")
            })
    if docs:
        col = db["medications"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_observations(db, data_dir):
    file_path = os.path.join(data_dir, "observations.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        value = get_case_insensitive(r, "value")
        units = get_case_insensitive(r, "units")
        date = get_case_insensitive(r, "date")
        if patient_id and code:
            obs_id = get_hash_id(patient_id, encounter_id, code, date, value, units)
            docs.append({
                "id": obs_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "value": value,
                "units": units,
                "date": date,
                "category": get_case_insensitive(r, "category"),
                "type": get_case_insensitive(r, "type")
            })
    if docs:
        col = db["observations"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_allergies(db, data_dir):
    file_path = os.path.join(data_dir, "allergies.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        if patient_id and code:
            all_id = get_hash_id(patient_id, encounter_id, code, start_date)
            docs.append({
                "id": all_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "start_date": start_date,
                "stop_date": get_case_insensitive(r, "stop"),
                "system": get_case_insensitive(r, "system"),
                "type": get_case_insensitive(r, "type"),
                "category": get_case_insensitive(r, "category"),
                "reaction1": get_case_insensitive(r, "reaction1"),
                "description1": get_case_insensitive(r, "description1"),
                "severity1": get_case_insensitive(r, "severity1")
            })
    if docs:
        col = db["allergies"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_procedures(db, data_dir):
    file_path = os.path.join(data_dir, "procedures.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        if patient_id and code:
            proc_id = get_hash_id(patient_id, encounter_id, code, start_date)
            docs.append({
                "id": proc_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "date": start_date,
                "stop_date": get_case_insensitive(r, "stop"),
                "system": get_case_insensitive(r, "system"),
                "base_cost": get_case_insensitive(r, "base_cost"),
                "reasoncode": get_case_insensitive(r, "reasoncode"),
                "reasondescription": get_case_insensitive(r, "reasondescription")
            })
    if docs:
        col = db["procedures"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_careplans(db, data_dir):
    file_path = os.path.join(data_dir, "careplans.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        cp_id = get_case_insensitive(r, "id") or get_case_insensitive(r, "Id")
        patient_id = get_case_insensitive(r, "patient")
        encounter_id = get_case_insensitive(r, "encounter")
        code = get_case_insensitive(r, "code")
        desc = get_case_insensitive(r, "description")
        start_date = get_case_insensitive(r, "start")
        stop_date = get_case_insensitive(r, "stop")
        if cp_id and patient_id:
            docs.append({
                "id": cp_id,
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "code": code,
                "description": desc,
                "start_date": start_date,
                "stop_date": stop_date,
                "reasoncode": get_case_insensitive(r, "reasoncode"),
                "reasondescription": get_case_insensitive(r, "reasondescription")
            })
    if docs:
        col = db["careplans"]
        await col.create_index("id", unique=True)
        await col.create_index("patient_id")
        ops = [ReplaceOne({"id": doc["id"]}, doc, upsert=True) for doc in docs]
        for i in range(0, len(ops), 500):
            await col.bulk_write(ops[i:i+500], ordered=False)
    return len(docs)

async def seed_all_patients(db, data_dir):
    orgs = await seed_organizations(db, data_dir)
    provs = await seed_providers(db, data_dir)
    pats = await seed_patients(db, data_dir)
    encs = await seed_encounters(db, data_dir)
    conds = await seed_conditions(db, data_dir)
    meds = await seed_medications(db, data_dir)
    obss = await seed_observations(db, data_dir)
    alls = await seed_allergies(db, data_dir)
    procs = await seed_procedures(db, data_dir)
    cplans = await seed_careplans(db, data_dir)
    return {
        "organizations": orgs,
        "providers": provs,
        "patients": pats,
        "encounters": encs,
        "conditions": conds,
        "medications": meds,
        "observations": obss,
        "allergies": alls,
        "procedures": procs,
        "careplans": cplans
    }
