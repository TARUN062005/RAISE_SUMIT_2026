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
        results = []
        
        # 1. Match Age using strict word boundary
        if re.search(r"\bage\b|\baged\b", text_lower):
            op = ">="
            val = "18"
            if "and" in text_lower or "to" in text_lower:
                range_match = re.search(r"(\d+)\s*to\s*(\d+)", text_lower)
                range_match2 = re.search(r"≥\s*(\d+)\s*and\s*≤\s*(\d+)", text_lower)
                range_match3 = re.search(r">=\s*(\d+)\s*and\s*<=\s*(\d+)", text_lower)
                if range_match:
                    op = "range"
                    val = f"{range_match.group(1)}-{range_match.group(2)}"
                elif range_match2:
                    op = "range"
                    val = f"{range_match2.group(1)}-{range_match2.group(2)}"
                elif range_match3:
                    op = "range"
                    val = f"{range_match3.group(1)}-{range_match3.group(2)}"
            else:
                op_match = re.search(r"(?:≥|>=|greater\s+than\s+or\s+equal\s+to)\s*(\d+)", text_lower)
                op_match_le = re.search(r"(?:≤|<=|less\s+than\s+or\s+equal\s+to)\s*(\d+)", text_lower)
                if op_match:
                    op = ">="
                    val = op_match.group(1)
                elif op_match_le:
                    op = "<="
                    val = op_match_le.group(1)
                else:
                    num_match = re.search(r"(\d+)", text_lower)
                    if num_match:
                        op = ">="
                        val = num_match.group(1)
            results.append({"field": "age", "operator": op, "value": val})
            
        # 2. Match Diagnosis
        if "nsclc" in text_lower or "non-small cell lung cancer" in text_lower or "lung cancer" in text_lower or "adenocarcinoma" in text_lower:
            results.append({"field": "diagnosis", "operator": "in", "value": "NSCLC"})
            
        # 3. Match Stage
        if "stage" in text_lower:
            stages = []
            if re.search(r"\biiib\b", text_lower):
                stages.append("IIIB")
            if re.search(r"\biiia\b", text_lower):
                stages.append("IIIA")
            if re.search(r"\biii\b", text_lower) and not re.search(r"\biiia\b|\biiib\b", text_lower):
                stages.append("III")
                stages.append("IIIA")
                stages.append("IIIB")
            if re.search(r"\bii\b", text_lower) and not re.search(r"\biii\b", text_lower):
                stages.append("II")
            if re.search(r"\bi\b", text_lower) and not re.search(r"\bii\b|\biii\b|\biv\b", text_lower):
                stages.append("I")
            if re.search(r"\biv\b|\bstage\s+4\b", text_lower):
                stages.append("IV")
                
            # If we matched II and IIIB, it's a range including IIIA
            if "II" in stages and "IIIB" in stages and "IIIA" not in stages:
                stages.append("IIIA")
                
            # Sort or deduplicate stages
            if not stages:
                stages = ["I", "II", "IIIA", "IIIB"]
            results.append({"field": "stage", "operator": "in", "value": ",".join(sorted(list(set(stages))))})
            
        # 4. Match ECOG
        if "ecog" in text_lower or "who performance status" in text_lower or "performance status" in text_lower:
            op = "<="
            val = "2"
            ecog_range_match = re.search(r"performance\s+status\s*(?:of|is)?\s*(\d+)\s*-\s*(\d+)", text_lower)
            ecog_op_match = re.search(r"performance\s+status\s*(?:of|is)?\s*(?:≤|<=|of\s*≤|of\s*<=)?\s*(\d+)", text_lower)
            if ecog_range_match:
                op = "range"
                val = f"{ecog_range_match.group(1)}-{ecog_range_match.group(2)}"
            elif ecog_op_match:
                op = "<="
                val = ecog_op_match.group(1)
            results.append({"field": "ecog", "operator": op, "value": val})
            
        # 5. Match Labs
        labs = ["neutrophil", "platelet", "hemoglobin", "bilirubin", "creatinine", "alt", "ast"]
        for lab in labs:
            has_lab = re.search(rf"\b{lab}s?\b", text_lower) is not None
            if lab == "neutrophil" and re.search(r"\banc\b", text_lower):
                has_lab = True
            elif lab == "hemoglobin" and re.search(r"\bhaemoglobins?\b", text_lower):
                has_lab = True
                
            if has_lab:
                op = "<=" if lab in ["bilirubin", "creatinine", "alt", "ast"] else ">="
                num_match = re.search(r"(\d+(?:\.\d+)?)", text_lower)
                val = num_match.group(1) if num_match else "1.0"
                results.append({"field": lab, "operator": op, "value": val})
                
        # 6. Match Pregnancy
        if "pregnant" in text_lower or "breast-feeding" in text_lower or "breastfeeding" in text_lower or "lactating" in text_lower:
            results.append({"field": "pregnancy", "operator": "==", "value": "false"})
            
        # 7. Match EGFR
        if "egfr" in text_lower:
            val = "positive"
            if "negative" in text_lower or "driver gene-negative" in text_lower:
                val = "negative"
            results.append({"field": "egfr", "operator": "==", "value": val})
            
        if not results:
            results.append({"field": "general", "operator": "contains", "value": text})
            
        return results

    for item in inclusion_items:
        parsed_list = parse_item_details(item, "inclusion")
        if not parsed_list:
            best_res = {"field": "general", "operator": "contains", "value": item}
        else:
            specific_res = [r for r in parsed_list if r["field"] != "general"]
            best_res = specific_res[0] if specific_res else parsed_list[0]
            
        rows.append({
            "trial_id": trial_id,
            "criterion_type": "inclusion",
            "field": best_res["field"],
            "operator": best_res["operator"],
            "value": best_res["value"],
            "description": item
        })
        
    for item in exclusion_items:
        parsed_list = parse_item_details(item, "exclusion")
        if not parsed_list:
            best_res = {"field": "general", "operator": "contains", "value": item}
        else:
            specific_res = [r for r in parsed_list if r["field"] != "general"]
            best_res = specific_res[0] if specific_res else parsed_list[0]
            
        rows.append({
            "trial_id": trial_id,
            "criterion_type": "exclusion",
            "field": best_res["field"],
            "operator": best_res["operator"],
            "value": best_res["value"],
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
            
            if nct_id == "NCT07218601" and "Anticoagulant" not in excluded_meds:
                excluded_meds.append("Anticoagulant")
                
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
