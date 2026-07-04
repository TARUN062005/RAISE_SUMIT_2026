from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Patient(BaseModel):
    id: str
    birthdate: str
    gender: str
    first: str
    last: str
    race: str
    ethnicity: str

class Condition(BaseModel):
    id: str
    patient_id: str
    encounter_id: str
    code: str
    description: str
    start_date: str
    stop_date: Optional[str] = None

class Medication(BaseModel):
    id: str
    patient_id: str
    encounter_id: str
    code: str
    description: str
    start_date: str
    stop_date: Optional[str] = None

class Observation(BaseModel):
    id: str
    patient_id: str
    encounter_id: str
    code: str
    description: str
    value: str
    units: Optional[str] = None
    date: str

class Encounter(BaseModel):
    id: str
    patient_id: str
    code: str
    description: str
    start_date: str
    stop_date: Optional[str] = None
    provider_id: str

class Allergy(BaseModel):
    id: str
    patient_id: str
    code: str
    description: str

class Organization(BaseModel):
    id: str
    name: str

class Provider(BaseModel):
    id: str
    name: str
    organization_id: str
    specialty: str

class Procedure(BaseModel):
    id: str
    patient_id: str
    encounter_id: str
    code: str
    description: str
    date: str

class CarePlan(BaseModel):
    id: str
    patient_id: str
    code: str
    description: str
    start_date: str
    stop_date: Optional[str] = None

class Trial(BaseModel):
    id: str
    title: str
    condition: str
    phase: str
    status: str

class TrialEligibility(BaseModel):
    trial_id: str
    criterion_type: str
    field: str
    operator: str
    value: str
    description: str

class TrialIntervention(BaseModel):
    trial_id: str
    intervention_type: str
    name: str
    excluded_medications: List[str]

class HospitalPolicy(BaseModel):
    name: str
    applies_to: str
    validity_months: float
    description: str
    source: str

class DrugRule(BaseModel):
    drug_a: str
    drug_b: str
    severity: str
    description: str
    drug: Optional[str] = None
    category: Optional[str] = None
    trialExclusion: Optional[bool] = None
    reason: Optional[str] = None

class AgentStep(BaseModel):
    type: str
    content: str
    tool_called: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output_ref: Optional[str] = None
    duration_ms: Optional[int] = None
    timestamp: str

class FinalReport(BaseModel):
    eligibility_decision: str
    satisfied_criteria: List[Dict[str, Any]]
    unsatisfied_criteria: List[Dict[str, Any]]
    outstanding_requirements: List[Dict[str, Any]]
    drug_exclusions: Dict[str, Any]
    policy_checks: List[Dict[str, Any]]
    freshness_checks: List[Dict[str, Any]]
    evidence: Dict[str, Any]
    recommendation: str

class AgentRun(BaseModel):
    id: str
    patient_id: str
    trial_id: str
    status: str
    steps: List[AgentStep]
    final_report: Optional[FinalReport] = None
    created_at: str
    completed_at: Optional[str] = None
    total_duration_ms: Optional[int] = None
