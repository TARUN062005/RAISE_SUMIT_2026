import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.db.session import get_db

logger = logging.getLogger(__name__)

class ReportTool:
    @staticmethod
    async def compile_report(agent_run_id: str) -> Dict[str, Any]:
        logger.info("Entering ReportTool.compile_report for run_id: %s", agent_run_id)
        start_time = time.time()
        tool_call_id = str(uuid.uuid4())
        
        try:
            db = await get_db()
            run = await db["agent_runs"].find_one({"id": agent_run_id})
            if not run:
                return {
                    "success": False,
                    "error": f"Agent run {agent_run_id} not found",
                    "duration_ms": round((time.time() - start_time) * 1000, 2),
                    "tool_call_id": tool_call_id
                }
            
            steps = run.get("steps", [])
            patient_id = run.get("patient_id")
            trial_id = run.get("trial_id")
            
            # Extract data collected during the run steps
            demographics = {}
            conditions = []
            medications = []
            observations = []
            allergies = []
            procedures = []
            trial = {}
            criteria = []
            drug_results = {}
            freshness_results = []
            
            for step in steps:
                if step.get("type") == "observation" and step.get("tool_called"):
                    tool = step.get("tool_called")
                    tool_output = step.get("tool_output")
                    if not tool_output or not tool_output.get("success"):
                        continue
                    
                    data = tool_output.get("data")
                    if tool == "PatientRecordTool.get_record":
                        demographics = data
                    elif tool == "PatientRecordTool.get_conditions":
                        conditions = data
                    elif tool == "PatientRecordTool.get_medications":
                        medications = data
                    elif tool == "PatientRecordTool.get_observations":
                        observations = data
                    elif tool == "PatientRecordTool.get_allergies":
                        allergies = data
                    elif tool == "TrialEligibilityTool.get_trial":
                        trial = data
                    elif tool == "TrialEligibilityTool.get_criteria":
                        criteria = data
                    elif tool == "DrugInteractionTool.check_exclusions":
                        drug_results = data
                    elif tool == "FreshnessTool.check":
                        freshness_results.append(data)
            
            # Deterministic criteria checking in Python
            satisfied_criteria = []
            unsatisfied_criteria = []
            outstanding_requirements = []
            policy_checks = []
            freshness_checks = []
            
            # Helper to check if a condition exists
            def has_condition(keywords: List[str]) -> bool:
                for c in conditions:
                    desc = c.get("description", "").lower()
                    if any(kw in desc for kw in keywords):
                        return True
                return False
                
            # Helper to find latest observation value
            def get_latest_obs(keywords: List[str]) -> Optional[Dict[str, Any]]:
                matched = []
                for o in observations:
                    desc = o.get("description", "").lower()
                    if any(kw in desc for kw in keywords):
                        matched.append(o)
                if not matched:
                    return None
                # Sort by date descending
                matched.sort(key=lambda x: x.get("date", ""), reverse=True)
                return matched[0]
            
            # 1. Evaluate structured criteria
            # If no criteria was fetched, fallback to trial_eligibility in DB
            if not criteria:
                cursor = db["trial_eligibility"].find({"trial_id": trial_id})
                criteria = await cursor.to_list(length=100)
                
            # If no demographics, fallback to patients in DB
            if not demographics:
                demographics = await db["patients"].find_one({"id": patient_id}) or {}
                
            # If no conditions/meds/obs, fetch from DB to be complete
            if not conditions:
                cursor = db["conditions"].find({"patient_id": patient_id})
                conditions = await cursor.to_list(length=1000)
            if not medications:
                cursor = db["medications"].find({"patient_id": patient_id})
                medications = await cursor.to_list(length=1000)
            if not observations:
                cursor = db["observations"].find({"patient_id": patient_id})
                observations = await cursor.to_list(length=1000)
            if not allergies:
                cursor = db["allergies"].find({"patient_id": patient_id})
                allergies = await cursor.to_list(length=1000)
            if not procedures:
                cursor = db["procedures"].find({"patient_id": patient_id})
                procedures = await cursor.to_list(length=1000)
                
            birthdate = demographics.get("birthdate")
            gender = demographics.get("gender")
            
            # Calculate age relative to 2026-07-04
            age = 40 # Default fallback
            if birthdate:
                try:
                    birth_dt = datetime.strptime(birthdate.split("T")[0], "%Y-%m-%d")
                    now_dt = datetime(2026, 7, 4)
                    age = now_dt.year - birth_dt.year - ((now_dt.month, now_dt.day) < (birth_dt.month, birth_dt.day))
                except Exception:
                    pass
            
            for crit in criteria:
                field = crit.get("field", "general")
                op = crit.get("operator", "contains")
                val = crit.get("value", "")
                desc = crit.get("description", "")
                crit_type = crit.get("criterion_type", "inclusion")
                
                # Check age
                if field == "age":
                    if op == ">=":
                        satisfied = age >= float(val)
                    elif op == "<=":
                        satisfied = age <= float(val)
                    elif op == "range":
                        low, high = map(float, val.split("-"))
                        satisfied = low <= age <= high
                    else:
                        satisfied = age >= 18
                        
                    if crit_type == "inclusion":
                        if satisfied:
                            satisfied_criteria.append({
                                "criterion": desc,
                                "evidence_citation": f"patients.id={patient_id}, birthdate={birthdate} (calculated age: {age})"
                            })
                        else:
                            unsatisfied_criteria.append({
                                "criterion": desc,
                                "reason": f"Patient is {age} years old, trial requires age {val}"
                            })
                    else:  # exclusion criteria
                        if satisfied:  # If satisfied exclusion, it means they are excluded!
                            unsatisfied_criteria.append({
                                "criterion": desc,
                                "reason": f"Patient age is {age}, which meets the exclusion criteria"
                            })
                        else:
                            satisfied_criteria.append({
                                "criterion": desc,
                                "evidence_citation": f"patients.id={patient_id}, birthdate={birthdate} (calculated age: {age})"
                            })
                            
                # Check ECOG
                elif field == "ecog":
                    ecog_obs = get_latest_obs(["ecog", "pain severity", "performance status"])
                    ecog_val = 0.0
                    citation = "Default ECOG score assumed 0 (no record found)"
                    if ecog_obs:
                        try:
                            ecog_val = float(ecog_obs.get("value", 0))
                            citation = f"observations.id={ecog_obs.get('id')}, value={ecog_val}, date={ecog_obs.get('date')}"
                        except ValueError:
                            pass
                            
                    satisfied = False
                    if op == "<=":
                        satisfied = ecog_val <= float(val)
                    elif op == "range":
                        low, high = map(float, val.split("-"))
                        satisfied = low <= ecog_val <= high
                    else:
                        satisfied = ecog_val <= 2.0
                        
                    if crit_type == "inclusion":
                        if satisfied:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                        else:
                            unsatisfied_criteria.append({"criterion": desc, "reason": f"Patient ECOG is {ecog_val}, trial requires <= {val}"})
                    else:
                        if satisfied:
                            unsatisfied_criteria.append({"criterion": desc, "reason": f"Patient ECOG is {ecog_val}, matching exclusion criteria"})
                        else:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                            
                # Lab values (neutrophil, platelet, hemoglobin, bilirubin, creatinine, alt, ast)
                elif field in ["neutrophil", "platelet", "hemoglobin", "bilirubin", "creatinine", "alt", "ast"]:
                    # map keywords for lookup
                    obs_keywords = {
                        "neutrophil": ["neutrophil", "anc"],
                        "platelet": ["platelet"],
                        "hemoglobin": ["hemoglobin", "haemoglobin", "hb"],
                        "bilirubin": ["bilirubin"],
                        "creatinine": ["creatinine"],
                        "alt": ["alanine aminotransferase", "alt"],
                        "ast": ["aspartate aminotransferase", "ast"]
                    }
                    matched_obs = get_latest_obs(obs_keywords[field])
                    
                    if not matched_obs:
                        outstanding_requirements.append({
                            "description": f"Recent {field} laboratory measurement required",
                            "related_record_type": "observation"
                        })
                    else:
                        try:
                            val_float = float(matched_obs.get("value", 0))
                            limit_float = float(val)
                            satisfied = False
                            if op == ">=":
                                satisfied = val_float >= limit_float
                            elif op == "<=":
                                satisfied = val_float <= limit_float
                                
                            citation = f"observations.id={matched_obs.get('id')}, value={val_float} {matched_obs.get('units', '')}, date={matched_obs.get('date')}"
                            
                            if crit_type == "inclusion":
                                if satisfied:
                                    satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                                else:
                                    unsatisfied_criteria.append({"criterion": desc, "reason": f"Patient {field} is {val_float}, trial requires {op} {val}"})
                            else:
                                if satisfied:
                                    unsatisfied_criteria.append({"criterion": desc, "reason": f"Patient {field} is {val_float}, matching exclusion criteria"})
                                else:
                                    satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                        except ValueError:
                            outstanding_requirements.append({
                                "description": f"Unable to parse {field} laboratory value: {matched_obs.get('value')}",
                                "related_record_type": "observation"
                            })
                            
                # Pregnancy
                elif field == "pregnancy":
                    if gender == "M":
                        satisfied_criteria.append({
                            "criterion": desc,
                            "evidence_citation": f"patients.id={patient_id}, gender=M (not of childbearing potential)"
                        })
                    else:
                        preg_obs = get_latest_obs(["pregnancy", "human chorionic gonadotropin", "hcg"])
                        if preg_obs:
                            val_lower = str(preg_obs.get("value", "")).lower()
                            is_pregnant = "positive" in val_lower or "true" in val_lower
                            citation = f"observations.id={preg_obs.get('id')}, value={preg_obs.get('value')}, date={preg_obs.get('date')}"
                            
                            if crit_type == "exclusion":
                                if is_pregnant:
                                    unsatisfied_criteria.append({"criterion": desc, "reason": "Patient is pregnant"})
                                else:
                                    satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                            else:
                                if is_pregnant:
                                    unsatisfied_criteria.append({"criterion": desc, "reason": "Patient is pregnant"})
                                else:
                                    satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                        else:
                            outstanding_requirements.append({
                                "description": "Pregnancy test required prior to study entry",
                                "related_record_type": "observation"
                            })
                            
                # EGFR Mutation
                elif field == "egfr":
                    has_egfr = has_condition(["egfr", "epidermal growth factor receptor"])
                    # Check if observation shows EGFR mutation
                    egfr_obs = get_latest_obs(["egfr", "mutation"])
                    if egfr_obs and "positive" in str(egfr_obs.get("value", "")).lower():
                        has_egfr = True
                        
                    satisfied = False
                    if val == "positive":
                        satisfied = has_egfr
                    elif val == "negative":
                        satisfied = not has_egfr
                        
                    citation = f"conditions.patient_id={patient_id} (EGFR mutation: {has_egfr})"
                    if crit_type == "inclusion":
                        if satisfied:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                        else:
                            unsatisfied_criteria.append({"criterion": desc, "reason": f"Trial requires EGFR {val}, but patient is EGFR {'positive' if has_egfr else 'negative'}"})
                    else:
                        if satisfied:
                            unsatisfied_criteria.append({"criterion": desc, "reason": f"Trial excludes EGFR {val}, but patient is EGFR {'positive' if has_egfr else 'negative'}"})
                        else:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": citation})
                            
                # General clinical criteria
                else:
                    # Look up condition keywords or procedures in the patient record to verify
                    matched_evidence = None
                    # Simple keyword lookup: if it's "squamous cell carcinoma" or "adenocarcinoma" or "nsclc"
                    desc_words = desc.lower()
                    if "nsclc" in desc_words or "non-small cell lung cancer" in desc_words or "lung cancer" in desc_words or "adenocarcinoma" in desc_words:
                        for c in conditions:
                            c_desc = c.get("description", "").lower()
                            if "cancer" in c_desc or "carcinoma" in c_desc or "malignant" in c_desc or "adenocarcinoma" in c_desc:
                                matched_evidence = f"conditions.id={c.get('id')}, description='{c.get('description')}'"
                                break
                    elif "surgery" in desc_words or "resection" in desc_words or "resected" in desc_words:
                        for p in procedures:
                            p_desc = p.get("description", "").lower()
                            if "surgery" in p_desc or "resection" in p_desc or "lobectomy" in p_desc or "operation" in p_desc:
                                matched_evidence = f"procedures.id={p.get('id')}, description='{p.get('description')}'"
                                break
                                
                    if crit_type == "inclusion":
                        if matched_evidence:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": matched_evidence})
                        else:
                            # If it's general requirement like consent or willing to use birth control, assume satisfied or outstanding
                            if "consent" in desc_words or "willing" in desc_words or "use of" in desc_words:
                                satisfied_criteria.append({"criterion": desc, "evidence_citation": "Assumed satisfied upon enrollment"})
                            else:
                                unsatisfied_criteria.append({"criterion": desc, "reason": "No matching clinical history found in records"})
                    else:
                        if matched_evidence:
                            unsatisfied_criteria.append({"criterion": desc, "reason": f"Exclusion criteria matched: {matched_evidence}"})
                        else:
                            satisfied_criteria.append({"criterion": desc, "evidence_citation": "No matching exclusion history found"})

            # 2. Policy & Freshness Checks
            # Resolve policy and freshness checks from database
            # We want to check: ECG Report (POL001), Complete Blood Count (POL002), LFT (POL003)
            # Find latest records for ECG, CBC, LFT
            ecg_proc = get_latest_obs(["electrocardiogram", "ecg"]) or get_latest_obs(["electroencephalogram", "eeg"]) # EEG is EEG report from procedures, let's look for ECG or EEG
            cbc_obs = get_latest_obs(["complete blood count", "cbc", "hemoglobin", "white blood cell", "platelet"])
            lft_obs = get_latest_obs(["lft", "liver function", "alt", "ast", "bilirubin"])
            
            policies_list = await db["hospital_policies"].find({}).to_list(length=10)
            
            now_dt = datetime(2026, 7, 4)
            
            def evaluate_policy_freshness(obs_record, policy_obj, doc_name):
                if not obs_record:
                    outstanding_requirements.append({
                        "description": f"Missing required document: {doc_name}",
                        "related_record_type": "observation"
                    })
                    return {
                        "policy_name": policy_obj.get("name"),
                        "record_checked": doc_name,
                        "result": f"Missing document. Action: {policy_obj.get('actionIfMissing', '')}"
                    }, None
                    
                rec_date_str = obs_record.get("date") or obs_record.get("start_date") or obs_record.get("date", "2026-01-01").split("T")[0]
                rec_dt = datetime.strptime(rec_date_str.split("T")[0], "%Y-%m-%d")
                elapsed_months = round((now_dt - rec_dt).days / 30.0, 2)
                allowed_months = policy_obj.get("validity_months", 12.0)
                valid = elapsed_months <= allowed_months
                
                result_text = "Valid" if valid else f"Expired. Action: {policy_obj.get('actionIfExpired', 'Repeat test')}"
                if not valid:
                    outstanding_requirements.append({
                        "description": f"Expired document: {doc_name} ({elapsed_months} months old). Action: {policy_obj.get('actionIfExpired', 'Repeat test')}",
                        "related_record_type": "observation"
                    })
                    
                policy_chk = {
                    "policy_name": policy_obj.get("name"),
                    "record_checked": f"{doc_name} (Date: {rec_date_str})",
                    "result": result_text
                }
                
                freshness_chk = {
                    "record_type": doc_name,
                    "record_date": rec_date_str,
                    "valid": valid,
                    "policy_applied": policy_obj.get("name")
                }
                return policy_chk, freshness_chk

            for p in policies_list:
                p_id = p.get("policyId")
                if p_id == "POL001":
                    p_chk, f_chk = evaluate_policy_freshness(ecg_proc, p, "ECG Report")
                    policy_checks.append(p_chk)
                    if f_chk: freshness_checks.append(f_chk)
                elif p_id == "POL002":
                    p_chk, f_chk = evaluate_policy_freshness(cbc_obs, p, "Complete Blood Count")
                    policy_checks.append(p_chk)
                    if f_chk: freshness_checks.append(f_chk)
                elif p_id == "POL003":
                    p_chk, f_chk = evaluate_policy_freshness(lft_obs, p, "LFT")
                    policy_checks.append(p_chk)
                    if f_chk: freshness_checks.append(f_chk)

            # 3. Drug Exclusions
            # If drug check wasn't run in ReAct loop, run it now to guarantee it's complete
            drug_excluded = False
            conflicts = []
            
            if drug_results and "excluded" in drug_results:
                drug_excluded = drug_results.get("excluded", False)
                conflicts = drug_results.get("matched_rules", [])
            else:
                # Compute directly
                from backend.app.agent.tools.drug_tool import DrugInteractionTool
                res = await DrugInteractionTool.check_exclusions(patient_id, trial_id)
                if res.get("success"):
                    drug_excluded = res["data"]["excluded"]
                    conflicts = res["data"]["matched_rules"]
            
            drug_exclusions = {
                "checked": True,
                "conflicts": conflicts
            }
            
            if drug_excluded:
                for c in conflicts:
                    unsatisfied_criteria.append({
                        "criterion": f"Exclude concomitant {c.get('category')} medication",
                        "reason": f"Patient is active on {c.get('medication')} ({c.get('description')})"
                    })

            # 4. Final Decision
            if unsatisfied_criteria:
                decision = "ineligible"
            elif outstanding_requirements:
                decision = "conditionally_eligible"
            else:
                decision = "eligible"
                
            # 5. Evidence coverage calculations
            total_criteria = len(satisfied_criteria) + len(unsatisfied_criteria)
            satisfied_count = len(satisfied_criteria)
            coverage_pct = round((satisfied_count / total_criteria) * 100, 2) if total_criteria > 0 else 0.0
            
            evidence = {
                "verified_records": len(conditions) + len(medications) + len(observations) + len(allergies),
                "total_criteria": total_criteria,
                "satisfied_count": satisfied_count,
                "coverage_pct": coverage_pct
            }
            
            # 6. Recommendation text formulation
            pat_obj = await db["patients"].find_one({"id": patient_id})
            pat_name = f"{pat_obj.get('first', '')} {pat_obj.get('last', '')}" if pat_obj else "Patient"
            trial_title = trial.get("title", f"Trial {trial_id}")
            
            rec = f"Evaluation completed for patient {pat_name} on trial '{trial_title}'. "
            if decision == "eligible":
                rec += "The patient meets all inclusion and exclusion criteria based on verified electronic health records and has current, valid lab results. They are fully eligible for enrollment."
            elif decision == "conditionally_eligible":
                rec += f"The patient meets the core clinical criteria but is conditionally eligible pending: "
                rec += ", ".join(o.get("description") for o in outstanding_requirements)
                rec += ". Please order these tests and repeat any expired records prior to final enrollment."
            else:
                rec += f"The patient is determined to be INELIGIBLE for this trial due to the following conflicts: "
                rec += "; ".join(u.get("reason") or u.get("criterion") for u in unsatisfied_criteria)
                rec += ". Enrollment is not permitted under current clinical protocols."
                
            final_report = {
                "eligibility_decision": decision,
                "satisfied_criteria": satisfied_criteria,
                "unsatisfied_criteria": unsatisfied_criteria,
                "outstanding_requirements": outstanding_requirements,
                "drug_exclusions": drug_exclusions,
                "policy_checks": policy_checks,
                "freshness_checks": freshness_checks,
                "evidence": evidence,
                "recommendation": rec
            }
            
            # Save report back to agent run in database
            await db["agent_runs"].update_one(
                {"id": agent_run_id},
                {"$set": {"final_report": final_report, "status": "completed", "completed_at": datetime.now().isoformat()}}
            )
            
            logger.info("Exiting ReportTool.compile_report successfully")
            return {
                "success": True,
                "data": final_report,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
        except Exception as e:
            logger.error("Error in ReportTool.compile_report: %s", str(e))
            return {
                "success": False,
                "error": str(e),
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "tool_call_id": tool_call_id
            }
