import os
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

def read_json(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, mode="r", encoding="utf-8") as f:
        return json.load(f)

async def seed_policies(db, data_dir):
    file_path = os.path.join(data_dir, "hospital_policies.json")
    data = read_json(file_path)
    docs = []
    
    for item in data:
        name = item.get("title", "Unnamed Policy")
        required_doc = item.get("requiredDocument", "")
        validity_days = item.get("validityDays", 365)
        validity_months = round(float(validity_days) / 30.0, 1)
        
        # Determine applies_to
        if required_doc:
            applies_to = required_doc
        elif "requiredTests" in item:
            applies_to = "LFT"
        else:
            applies_to = "General Policy"
            
        # Compile description
        rules = item.get("rules", [])
        if rules:
            desc = "; ".join(rules)
        else:
            desc = f"Requires fresh {applies_to} within {validity_days} days. Action: {item.get('actionIfMissing', '')}"
            
        docs.append({
            "name": name,
            "applies_to": applies_to,
            "validity_months": validity_months,
            "description": desc,
            "source": "hospital_policies.json",
            "policyId": item.get("policyId"),
            "requiredDocument": required_doc,
            "validityDays": validity_days,
            "actionIfMissing": item.get("actionIfMissing"),
            "actionIfExpired": item.get("actionIfExpired"),
            "requiredTests": item.get("requiredTests"),
            "rules": rules
        })
        
    if docs:
        col = db["hospital_policies"]
        await col.create_index("name", unique=True)
        for doc in docs:
            await col.replace_one({"name": doc["name"]}, doc, upsert=True)
            
    return len(docs)

async def seed_drug_rules(db, data_dir):
    file_path = os.path.join(data_dir, "drug_interactions.json")
    data = read_json(file_path)
    docs = []
    
    for item in data:
        drug = item.get("drug")
        category = item.get("category")
        trial_excl = item.get("trialExclusion", False)
        reason = item.get("reason", "No reason provided")
        
        severity = "high" if trial_excl else "moderate"
        
        if drug:
            docs.append({
                "drug_a": drug,
                "drug_b": "*",
                "severity": severity,
                "description": f"Category: {category}. Reason: {reason}",
                "drug": drug,
                "category": category,
                "trialExclusion": trial_excl,
                "reason": reason
            })
            
    if docs:
        col = db["drug_rules"]
        await col.create_index("drug_a")
        # Clear existing drug_rules and import
        await col.delete_many({})
        for i in range(0, len(docs), 500):
            await col.insert_many(docs[i:i+500], ordered=False)
            
    return len(docs)

async def seed_all_rules(db, data_dir):
    policies_count = await seed_policies(db, data_dir)
    drug_rules_count = await seed_drug_rules(db, data_dir)
    return {
        "hospital_policies": policies_count,
        "drug_rules": drug_rules_count
    }
