import hashlib
import json
from typing import Dict, Any, Tuple

class AgentMemory:
    def __init__(self):
        self.scratchpad: Dict[str, Any] = {}
        self.tool_cache: Dict[Tuple[str, str], Any] = {}

    def _get_input_hash(self, tool_input: Dict[str, Any]) -> str:
        serialized = json.dumps(tool_input, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def get_cached_result(self, tool_name: str, tool_input: Dict[str, Any]) -> Any:
        input_hash = self._get_input_hash(tool_input)
        return self.tool_cache.get((tool_name, input_hash))

    def cache_result(self, tool_name: str, tool_input: Dict[str, Any], result: Any):
        input_hash = self._get_input_hash(tool_input)
        self.tool_cache[(tool_name, input_hash)] = result
        
        # Store in scratchpad by collection if it has list of records or single record
        if isinstance(result, dict) and result.get("success"):
            data = result.get("data")
            if tool_name == "PatientRecordTool.get_record":
                self.scratchpad["patients"] = data
            elif tool_name == "PatientRecordTool.get_conditions":
                self.scratchpad["conditions"] = data
            elif tool_name == "PatientRecordTool.get_medications":
                self.scratchpad["medications"] = data
            elif tool_name == "PatientRecordTool.get_observations":
                if "observations" not in self.scratchpad:
                    self.scratchpad["observations"] = []
                # Merge observation lists
                if isinstance(data, list):
                    self.scratchpad["observations"].extend(data)
            elif tool_name == "PatientRecordTool.get_allergies":
                self.scratchpad["allergies"] = data
            elif tool_name == "TrialEligibilityTool.get_trial":
                self.scratchpad["trials"] = data
            elif tool_name == "TrialEligibilityTool.get_criteria":
                self.scratchpad["trial_eligibility"] = data
            elif tool_name == "DrugInteractionTool.check_exclusions":
                self.scratchpad["drug_exclusions"] = data
            elif tool_name == "FreshnessTool.check":
                if "freshness_checks" not in self.scratchpad:
                    self.scratchpad["freshness_checks"] = []
                self.scratchpad["freshness_checks"].append(data)
