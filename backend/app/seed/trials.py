import os
import csv
import re
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

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

def parse_criteria(trial_id, full_text):
    incl_match = re.search(r"Inclusion\s+Criteria:", full_text, re.IGNORECASE)
    excl_match = re.search(r"Exclusion\s+Criteria:", full_text, re.IGNORECASE)
    
    incl_text = ""
    excl_text = ""
    
    if incl_match and excl_match:
        if incl_match.start() < excl_match.start():
            incl_text = full_text[incl_match.end():excl_match.start()]
            excl_text = full_text[excl_match.end():]
        else:
            excl_text = full_text[excl_match.end():incl_match.start()]
            incl_text = full_text[incl_match.end():]
    elif incl_match:
        incl_text = full_text[incl_match.end():]
    elif excl_match:
        excl_text = full_text[excl_match.end():]
    else:
        incl_text = full_text

    def clean_items(text):
        lines = []
        raw_lines = text.split("\n")
        current_item = []
        
        for line in raw_lines:
            stripped = line.strip()
            if not stripped:
                continue
            is_new_item = False
            if stripped.startswith(("*", "-", "•")):
                is_new_item = True
            elif re.match(r"^\d+\.?\s+", stripped) or re.match(r"^\[\d+\]", stripped):
                is_new_item = True
            
            if is_new_item:
                if current_item:
                    lines.append(" ".join(current_item))
                    current_item = []
                clean_line = re.sub(r"^[\*\-\•]\s*", "", stripped)
                clean_line = re.sub(r"^\d+\.?\s*", "", clean_line)
                clean_line = re.sub(r"^\[\d+\]\s*", "", clean_line)
                current_item.append(clean_line)
            else:
                if current_item:
                    current_item.append(stripped)
                else:
                    current_item.append(stripped)
        
        if current_item:
            lines.append(" ".join(current_item))
            
        return [l.strip() for l in lines if l.strip()]

    inclusion_items = clean_items(incl_text)
    exclusion_items = clean_items(excl_text)
    
    rows = []
    
    def parse_item_details(text, crit_type):
        text_lower = text.lower()
        field = "general"
        operator = "contains"
        value = text
        
        if "age" in text_lower:
            field = "age"
            if "and" in text_lower or "to" in text_lower:
                range_match = re.search(r"(\d+)\s*to\s*(\d+)", text_lower)
                range_match2 = re.search(r"≥\s*(\d+)\s*and\s*≤\s*(\d+)", text_lower)
                range_match3 = re.search(r">=\s*(\d+)\s*and\s*<=\s*(\d+)", text_lower)
                if range_match:
                    operator = "range"
                    value = f"{range_match.group(1)}-{range_match.group(2)}"
                elif range_match2:
                    operator = "range"
                    value = f"{range_match2.group(1)}-{range_match2.group(2)}"
                elif range_match3:
                    operator = "range"
                    value = f"{range_match3.group(1)}-{range_match3.group(2)}"
                else:
                    op_match = re.search(r"≥\s*(\d+)|>=\s*(\d+)", text_lower)
                    if op_match:
                        operator = ">="
                        value = op_match.group(1) or op_match.group(2)
            else:
                op_match = re.search(r"(?:≥|>=|greater\s+than\s+or\s+equal\s+to)\s*(\d+)", text_lower)
                op_match_le = re.search(r"(?:≤|<=|less\s+than\s+or\s+equal\s+to)\s*(\d+)", text_lower)
                if op_match:
                    operator = ">="
                    value = op_match.group(1)
                elif op_match_le:
                    operator = "<="
                    value = op_match_le.group(1)
                else:
                    num_match = re.search(r"(\d+)", text_lower)
                    if num_match:
                        operator = ">="
                        value = num_match.group(1)
                        
        elif "ecog" in text_lower:
            field = "ecog"
            ecog_range_match = re.search(r"ecog\s*(?:performance\s+status\s*(?:of|is)?)?\s*(\d+)\s*-\s*(\d+)", text_lower)
            ecog_op_match = re.search(r"ecog\s*(?:performance\s+status\s*(?:of|is)?)?\s*(?:≤|<=|of\s*≤|of\s*<=)?\s*(\d+)", text_lower)
            if ecog_range_match:
                operator = "range"
                value = f"{ecog_range_match.group(1)}-{ecog_range_match.group(2)}"
            elif ecog_op_match:
                operator = "<="
                value = ecog_op_match.group(1)
            else:
                operator = "<="
                value = "2"
                
        elif "neutrophil" in text_lower or "anc" in text_lower:
            field = "neutrophil"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = ">="
        elif "platelet" in text_lower:
            field = "platelet"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = ">="
        elif "haemoglobin" in text_lower or "hemoglobin" in text_lower:
            field = "hemoglobin"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = ">="
        elif "bilirubin" in text_lower:
            field = "bilirubin"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = "<="
        elif "creatinine" in text_lower:
            field = "creatinine"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = "<="
        elif "alanine aminotransferase" in text_lower or "alt" in text_lower:
            field = "alt"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = "<="
        elif "aspartate aminotransferase" in text_lower or "ast" in text_lower:
            field = "ast"
            num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
            if num_match:
                value = num_match.group(1)
                operator = "<="
        elif "pregnant" in text_lower or "breast-feeding" in text_lower or "breastfeeding" in text_lower or "lactating" in text_lower:
            field = "pregnancy"
            operator = "=="
            value = "false"
        elif "egfr" in text_lower:
            field = "egfr"
            operator = "=="
            if "positive" in text_lower or "actionable" in text_lower:
                value = "positive"
            elif "negative" in text_lower or "driver gene-negative" in text_lower:
                value = "negative"
            else:
                value = "positive"
                
        return field, operator, value

    for item in inclusion_items:
        f, o, v = parse_item_details(item, "inclusion")
        rows.append({
            "trial_id": trial_id,
            "criterion_type": "inclusion",
            "field": f,
            "operator": o,
            "value": v,
            "description": item
        })
        
    for item in exclusion_items:
        f, o, v = parse_item_details(item, "exclusion")
        rows.append({
            "trial_id": trial_id,
            "criterion_type": "exclusion",
            "field": f,
            "operator": o,
            "value": v,
            "description": item
        })
        
    return rows

def parse_drug_exclusions(exclusion_text):
    text_lower = exclusion_text.lower()
    excluded = []
    
    categories = {
        "Anticoagulant": ["anticoagulant", "warfarin", "heparin", "apixaban", "rivaroxaban", "dabigatran"],
        "Antiplatelet": ["antiplatelet", "clopidogrel", "aspirin"],
        "Corticosteroid": ["corticosteroid", "glucocorticoid", "prednisone", "dexamethasone"],
        "Immunosuppressant": ["immunosuppressive", "immunosuppressant", "methotrexate", "azathioprine", "tacrolimus", "cyclosporine", "sirolimus", "immune deficiency", "organ transplant"],
        "CYP3A4 inducer": ["cyp3a4 inducer", "cyp3a inducer", "carbamazepine", "phenytoin", "phenobarbital", "rifampin"],
        "CYP3A4 inhibitor": ["cyp3a4 inhibitor", "cyp3a inhibitor", "ketoconazole", "itraconazole", "clarithromycin", "erythromycin"],
        "QT prolongation": ["qt prolongation", "prolong the qt", "amiodarone", "sotalol", "hydroxychloroquine"],
        "Chemotherapy": ["chemotherapy", "cisplatin", "gemcitabine"],
        "Targeted therapy": ["targeted therapy", "osimertinib"],
        "Immunotherapy": ["immunotherapy", "atezolizumab"]
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text_lower:
                excluded.append(category)
                break
                
    return list(set(excluded))

async def seed_trials(db, data_dir):
    file_path = os.path.join(data_dir, "trials.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    for r in rows:
        nct_id = get_case_insensitive(r, "nct_id")
        title = get_case_insensitive(r, "title")
        cond = get_case_insensitive(r, "condition")
        phase = get_case_insensitive(r, "phase")
        status = get_case_insensitive(r, "recruitmentstatus") or get_case_insensitive(r, "status")
        if nct_id and title:
            docs.append({
                "id": nct_id,
                "title": title,
                "condition": cond,
                "phase": phase,
                "status": status,
                "briefsummary": get_case_insensitive(r, "briefsummary"),
                "minimumage": get_case_insensitive(r, "minimumage"),
                "maximumage": get_case_insensitive(r, "maximumage"),
                "sex": get_case_insensitive(r, "sex")
            })
    if docs:
        col = db["trials"]
        await col.create_index("id", unique=True)
        for i in range(0, len(docs), 500):
            chunk = docs[i:i+500]
            for doc in chunk:
                await col.replace_one({"id": doc["id"]}, doc, upsert=True)
    return len(docs)

async def seed_eligibility(db, data_dir):
    file_path = os.path.join(data_dir, "eligibility.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    
    # We will accumulate exclusion paragraphs to help determine drug exclusions later
    exclusion_text_by_trial = {}
    
    for r in rows:
        nct_id = get_case_insensitive(r, "nct_id")
        criteria_text = get_case_insensitive(r, "eligibilitycriteria")
        if nct_id and criteria_text:
            parsed_rows = parse_criteria(nct_id, criteria_text)
            docs.extend(parsed_rows)
            
            # Store the full exclusion criteria text for drug exclusions lookup
            excl_match = re.search(r"Exclusion\s+Criteria:", criteria_text, re.IGNORECASE)
            if excl_match:
                exclusion_text_by_trial[nct_id] = criteria_text[excl_match.end():]
            else:
                exclusion_text_by_trial[nct_id] = ""
                
    if docs:
        col = db["trial_eligibility"]
        await col.create_index("trial_id")
        # Since this table has no natural key, we delete existing and batch insert to make it idempotent
        for trial_id in set(doc["trial_id"] for doc in docs):
            await col.delete_many({"trial_id": trial_id})
        for i in range(0, len(docs), 500):
            await col.insert_many(docs[i:i+500], ordered=False)
            
    return len(docs), exclusion_text_by_trial

async def seed_interventions(db, data_dir, exclusion_text_by_trial):
    file_path = os.path.join(data_dir, "interventions.csv")
    rows = read_csv_dynamic(file_path)
    docs = []
    
    # Track existing intervention records to add dynamic drug exclusions
    for r in rows:
        nct_id = get_case_insensitive(r, "nct_id")
        int_type = get_case_insensitive(r, "interventiontype")
        name = get_case_insensitive(r, "interventionname")
        if nct_id and name:
            excl_text = exclusion_text_by_trial.get(nct_id, "")
            excluded_meds = parse_drug_exclusions(excl_text)
            
            docs.append({
                "trial_id": nct_id,
                "intervention_type": int_type,
                "name": name,
                "excluded_medications": excluded_meds
            })
            
    if docs:
        col = db["trial_interventions"]
        await col.create_index("trial_id")
        for trial_id in set(doc["trial_id"] for doc in docs):
            await col.delete_many({"trial_id": trial_id})
        for i in range(0, len(docs), 500):
            await col.insert_many(docs[i:i+500], ordered=False)
            
    return len(docs)

async def seed_all_trials(db, data_dir):
    trials_count = await seed_trials(db, data_dir)
    elig_count, exclusion_texts = await seed_eligibility(db, data_dir)
    interv_count = await seed_interventions(db, data_dir, exclusion_texts)
    return {
        "trials": trials_count,
        "trial_eligibility": elig_count,
        "trial_interventions": interv_count
    }
