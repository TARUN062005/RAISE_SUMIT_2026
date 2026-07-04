import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, 
  Activity, ShieldAlert, ArrowLeft, RefreshCw, Layers, Brain, User, Pill,
  BarChart3, ClipboardList, CheckCircle2, AlertCircle, FlaskConical
} from "lucide-react";

interface Step {
  type: string;
  content: string;
  tool_called?: string;
  tool_input?: any;
  tool_output?: any;
  tool_output_ref?: string;
  duration_ms?: number;
  timestamp: string;
}

interface FinalReport {
  eligibility_decision: "eligible" | "conditionally_eligible" | "ineligible";
  decision_summary?: {
    status: "eligible" | "conditionally_eligible" | "ineligible";
    headline_reasons: string[];
    required_actions: string[];
    readiness_pct: number;
  };
  satisfied_criteria: Array<{ criterion: string; evidence_citation: string }>;
  unsatisfied_criteria: Array<{ criterion: string; reason: string }>;
  outstanding_requirements: Array<{ description: string; related_record_type: string }>;
  drug_exclusions: { checked: boolean; conflicts: any[] };
  policy_checks: Array<{ policy_name: string; record_checked: string; result: string }>;
  freshness_checks: Array<{ record_type: string; record_date: string; valid: boolean; policy_applied: string }>;
  evidence: { verified_records: number; total_criteria: number; satisfied_count: number; coverage_pct: number };
  recommendation: string;
}

const toolRationales: Record<string, string> = {
  "PatientRecordTool.get_record": "Retrieve patient demographic profile to verify core identifiers, gender and birthdate.",
  "PatientRecordTool.get_conditions": "Scan diagnostic registry for active clinical conditions and chronic medical history.",
  "PatientRecordTool.get_medications": "Compile complete list of active prescriptions to detect trial medication exclusions.",
  "PatientRecordTool.get_observations": "Query quantitative clinical observations, lab panels, and vitals thresholds.",
  "PatientRecordTool.get_allergies": "Check immunological allergies and hypersensitivity profiles for drug safety.",
  "TrialEligibilityTool.get_trial": "Fetch the study protocol detail registry to inspect target indications and design.",
  "TrialEligibilityTool.get_criteria": "Resolve the structured inclusion and exclusion variables for comparative matching.",
  "DrugInteractionTool.check_exclusions": "Compute concomitant drug-drug conflict risk against protocol exclusion guidelines.",
  "FreshnessTool.check": "Audit diagnostic record dates to ensure compliance with strict clinical freshness policies."
};

function getToolIcon(toolName?: string) {
  if (!toolName) return <Brain className="w-4 h-4 text-teal-650" />;
  switch (toolName) {
    case "PatientRecordTool.get_record":
      return <User className="w-4 h-4 text-slate-500" />;
    case "PatientRecordTool.get_conditions":
      return <Activity className="w-4 h-4 text-slate-500" />;
    case "PatientRecordTool.get_medications":
      return <Pill className="w-4 h-4 text-slate-500" />;
    case "PatientRecordTool.get_observations":
      return <BarChart3 className="w-4 h-4 text-slate-500" />;
    case "PatientRecordTool.get_allergies":
      return <ShieldAlert className="w-4 h-4 text-slate-500" />;
    case "TrialEligibilityTool.get_trial":
      return <FlaskConical className="w-4 h-4 text-slate-500" />;
    case "TrialEligibilityTool.get_criteria":
      return <ClipboardList className="w-4 h-4 text-slate-500" />;
    case "DrugInteractionTool.check_exclusions":
      return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    case "FreshnessTool.check":
      return <Clock className="w-4 h-4 text-slate-500" />;
    default:
      return <Brain className="w-4 h-4 text-teal-650" />;
  }
}

function getToolTitle(toolName?: string) {
  if (!toolName) return "Clinical Reasoning Decision";
  const parts = toolName.split(".");
  const method = parts[parts.length - 1];
  switch (method) {
    case "get_record": return "Retrieve Demographics";
    case "get_conditions": return "Scan Diagnostic Profile";
    case "get_medications": return "Extract Medication History";
    case "get_observations": return "Query Vitals & Lab Panels";
    case "get_allergies": return "Verify Hypersensitivities";
    case "get_trial": return "Load Protocol Registry";
    case "get_criteria": return "Resolve Protocol Criteria";
    case "check_exclusions": return "Evaluate Concomitant Drugs";
    case "check": return "Audit Record Freshness";
    default: return toolName;
  }
}

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const [status, setStatus] = useState("initializing");
  const [steps, setSteps] = useState<Step[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState("");
  
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
    setIsUserScrolled(!isAtBottom);
  };

  const toggleStepDetail = (idx: number) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    if (isUserScrolled) return;
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [steps, isUserScrolled]);

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`/api/agent/run/${runId}/stream`);

    eventSource.onopen = () => {
      setStatus("running");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setStatus("failed");
          eventSource.close();
          return;
        }

        if (data.final) {
          setStatus(data.status || "completed");
          if (data.final_report) {
            setReport(data.final_report);
          }
          eventSource.close();
          return;
        }

        setSteps((prev) => {
          const exists = prev.some(
            (s) => s.timestamp === data.timestamp && s.type === data.type && s.content === data.content
          );
          if (exists) return prev;
          return [...prev, data];
        });
      } catch (err) {
        console.error("Failed to parse event message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      fetch(`/api/agent/run/${runId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load run history");
        })
        .then((data) => {
          setSteps(data.steps || []);
          setStatus(data.status || "completed");
          if (data.final_report) {
            setReport(data.final_report);
          }
        })
        .catch((e) => {
          console.error("Failed fetching run history:", e);
          setError("Loss of server connection during stream.");
          setStatus("failed");
        });
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case "eligible":
        return {
          bg: "bg-emerald-50 border-emerald-250 text-emerald-805",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        };
      case "conditionally_eligible":
        return {
          bg: "bg-amber-50 border-amber-250 text-amber-805",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
        };
      default:
        return {
          bg: "bg-rose-50 border-rose-250 text-rose-850",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <XCircle className="w-8 h-8 text-rose-600" />
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb and Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <Link 
          to="/workspace/evaluate" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-teal-650 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Run ID: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[9px] border border-slate-200 text-slate-600">{runId}</code></span>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
            status === "running" || status === "initializing"
              ? "bg-teal-50 text-teal-700 border-teal-200/50 animate-pulse"
              : status === "completed" || status === "eligible"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
              : status === "conditionally_eligible"
              ? "bg-amber-50 text-amber-700 border-amber-200/50"
              : "bg-rose-50 text-rose-700 border-rose-200/50"
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 SPAN): REPORT & METRICS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Status header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Evaluation Process</div>
              <h3 className="text-base font-extrabold text-slate-900">ReAct Reasoning Execution</h3>
              <p className="text-xs text-slate-500">Agent autonomously matches criteria variables and audits diagnostics.</p>
            </div>
            {(status === "running" || status === "initializing") && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-lg text-teal-700 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Running Inference Loop...</span>
              </div>
            )}
          </div>

          {/* Metrics summary cards */}
          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-2xs">
                <div className="text-2xl font-extrabold text-slate-900">{report.evidence.verified_records}</div>
                <div className="text-[9px] text-slate-455 uppercase font-bold tracking-wider mt-1">EHR Records Audited</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-2xs">
                <div className="text-2xl font-extrabold text-slate-900">{report.evidence.total_criteria}</div>
                <div className="text-[9px] text-slate-455 uppercase font-bold tracking-wider mt-1">Criteria Scanned</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-2xs">
                <div className="text-2xl font-extrabold text-slate-900">{report.evidence.satisfied_count}</div>
                <div className="text-[9px] text-slate-455 uppercase font-bold tracking-wider mt-1">Satisfied criteria</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-2xs">
                <div className="text-2xl font-extrabold text-teal-600">{report.evidence.coverage_pct}%</div>
                <div className="text-[9px] text-teal-650 uppercase font-bold tracking-wider mt-1">Evidence Coverage</div>
              </div>
            </motion.div>
          )}

          {/* Fallback error display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-750 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* compiled Clinical Report */}
          <AnimatePresence>
            {report && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Decision Summary Block */}
                {report.decision_summary && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">Evaluation Readiness Profile</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Summary of critical clinical action points</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-455 font-bold uppercase tracking-wider">Readiness Index</span>
                          <div className="text-sm font-extrabold text-teal-600">{report.decision_summary.readiness_pct}%</div>
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-teal-600 h-full rounded-full" 
                            style={{ width: `${report.decision_summary.readiness_pct}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest block">Headline Findings</span>
                        <ul className="space-y-1.5">
                          {report.decision_summary.headline_reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                              <span className="leading-relaxed font-medium">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest block">Required Clinical Actions</span>
                        <ul className="space-y-1.5">
                          {report.decision_summary.required_actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-550 shrink-0 mt-1.5" />
                              <span className="leading-relaxed font-semibold">{action}</span>
                            </li>
                          ))}
                          {report.decision_summary.required_actions.length === 0 && (
                            <li className="text-slate-400 italic py-2 text-center w-full">No outstanding protocol actions required.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decision Banner */}
                {(() => {
                  const styles = getDecisionStyles(report.eligibility_decision);
                  return (
                    <div className={`border rounded-xl p-5 shadow-2xs ${styles.bg} flex flex-col md:flex-row items-start gap-4`}>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg shrink-0">
                        {styles.icon}
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol Eligibility Outcome</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${styles.badge}`}>
                            {report.eligibility_decision.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold">Recommendation Summary</h4>
                        <p className="text-xs leading-relaxed font-medium">
                          {report.recommendation}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist criteria grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Satisfied Criteria Checklist */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Satisfied Inclusion/Exclusion
                    </h4>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {report.satisfied_criteria.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                          <p className="font-semibold text-slate-700 leading-normal">{item.criterion}</p>
                          <div className="text-[9px] text-slate-550 font-mono bg-white border border-slate-200 px-2 py-1 rounded inline-block select-all">
                            Citation: {item.evidence_citation}
                          </div>
                        </div>
                      ))}
                      {report.satisfied_criteria.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No satisfied criteria verified.</p>
                      )}
                    </div>
                  </div>

                  {/* Unsatisfied Exclusions Checklist */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <XCircle className="w-4 h-4 text-rose-600" /> Unsatisfied & Exclusions
                    </h4>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {report.unsatisfied_criteria.map((item, idx) => (
                        <div key={idx} className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
                          <p className="font-semibold text-rose-700 leading-normal">{item.criterion}</p>
                          <p className="text-rose-800 font-semibold text-[11px]">{item.reason}</p>
                        </div>
                      ))}
                      {report.unsatisfied_criteria.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No exclusions or unsatisfied variables detected.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outstanding Tasks & Policy checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outstanding Tasks */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Outstanding Clinical Requirements
                    </h4>
                    <div className="space-y-2.5">
                      {report.outstanding_requirements.map((item, idx) => (
                        <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex justify-between items-center gap-3">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-amber-800 leading-normal">{item.description}</p>
                            <p className="text-[8px] text-amber-700 font-bold uppercase tracking-wider">Record Class: {item.related_record_type}</p>
                          </div>
                          <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded font-bold text-[8px] uppercase tracking-wider shrink-0">
                            Required
                          </span>
                        </div>
                      ))}
                      {report.outstanding_requirements.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No outstanding tests required.</p>
                      )}
                    </div>
                  </div>

                  {/* Policy & Freshness Audit */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Clock className="w-4 h-4 text-slate-655" /> Freshness & Policy Audits
                    </h4>
                    <div className="space-y-2.5">
                      {report.policy_checks.map((item, idx) => {
                        const isSuccess = item.result.toLowerCase().includes("valid") || item.result.toLowerCase().includes("fresh");
                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-850 leading-normal">{item.policy_name}</p>
                              <p className="text-slate-500 text-[10px]">Record Checked: {item.record_checked}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded border font-bold text-[8px] uppercase tracking-wider shrink-0 ${
                              isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"
                            }`}>
                              {item.result.split(".")[0]}
                            </span>
                          </div>
                        );
                      })}
                      {report.policy_checks.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No quality policy checks logged.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drug interactions log */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ShieldAlert className="w-4 h-4 text-slate-655" /> Concomitant Drug Conflict Log
                  </h4>
                  <div className="space-y-2.5">
                    {report.drug_exclusions.conflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs flex items-start gap-3">
                        <div className="p-1.5 bg-white rounded border border-rose-350 shrink-0">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-800">Active Exclusion Drug: {conflict.medication}</p>
                          <p className="text-rose-705 text-[10px] font-semibold">Exclusion Category: {conflict.category} | Severity: {conflict.severity}</p>
                          <p className="text-slate-550 mt-1 text-[11px] leading-relaxed">Rule Basis: {conflict.description}</p>
                        </div>
                      </div>
                    ))}
                    {report.drug_exclusions.conflicts.length === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Zero drug interaction or concomitant medication conflicts detected.</span>
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN (1/3 SPAN): LIVE STREAMING EXECUTION LOG */}
        <div className="bg-slate-900 border border-slate-950 rounded-xl overflow-hidden shadow-2xs min-h-[450px] h-[calc(100vh-280px)] lg:h-[calc(100vh-240px)] flex flex-col">
          <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400 animate-pulse" /> Agent Reasoning Stream
            </h3>
            {(status === "running" || status === "initializing") && (
              <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            )}
          </div>
          
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="p-5 flex-grow overflow-y-auto space-y-4 font-mono text-[11px] text-slate-350 bg-slate-950 animate-scroll"
          >
            <AnimatePresence initial={false}>
              {steps.map((step, idx) => {
                const isObservation = step.type === "observation";
                const isThought = step.type === "thought";
                const toolName = step.tool_called;
                const toolTitle = getToolTitle(toolName);
                const icon = getToolIcon(toolName);
                const rationale = toolName ? toolRationales[toolName] : "Formulating next clinical evaluation plan";
                const isExpanded = !!expandedSteps[idx];
                const isLatestStep = idx === steps.length - 1;
                const isInProgress = isLatestStep && (status === "running" || status === "initializing");
                
                const previewText = isThought 
                  ? (step.content.split("\n")[0].length > 60 ? step.content.split("\n")[0].slice(0, 57) + "..." : step.content.split("\n")[0])
                  : rationale;

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-slate-800/40 pb-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-teal-400 shrink-0">
                          {isThought ? <Brain className="w-3.5 h-3.5 animate-pulse" /> : icon}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-200 text-[10px] uppercase tracking-wider min-w-0 truncate">
                            {isThought ? "Planning Reasoning" : (toolName ? toolName.split(".")[0] : "Observation Agent")}
                          </span>
                          <span className="text-slate-400 text-[11px] leading-tight truncate">
                            {previewText}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status / Timing / Toggle */}
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                        {isInProgress ? (
                          <div className="flex items-center gap-1.5 text-teal-400 font-bold uppercase tracking-wider">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span className="animate-pulse">Active</span>
                          </div>
                        ) : (
                          <>
                            {step.duration_ms !== undefined ? (
                              <span className="text-teal-400 font-semibold">✓ {step.duration_ms}ms</span>
                            ) : (
                              <span className="text-emerald-405 font-semibold">✓</span>
                            )}
                            <button
                              onClick={() => toggleStepDetail(idx)}
                              className="text-slate-400 hover:text-teal-405 font-semibold transition px-1 py-0.5 rounded border border-slate-800 hover:border-teal-500/50 bg-slate-900/60"
                            >
                              {isExpanded ? "Hide" : "Details"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded payload block */}
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-2 bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2 font-mono text-[10px] overflow-hidden"
                      >
                        {isThought ? (
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reasoning Thought:</div>
                            <pre className="text-slate-350 whitespace-pre-wrap font-sans leading-relaxed text-xs max-h-60 overflow-y-auto select-all">{step.content}</pre>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Args Payload:</div>
                              <pre className="text-slate-405 overflow-x-auto select-all max-h-32 bg-slate-900/50 p-2 rounded border border-slate-900">{JSON.stringify(step.tool_input, null, 2)}</pre>
                            </div>
                            {step.tool_output && (
                              <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-900 pt-2">Returned Payload:</div>
                                <pre className="text-slate-405 overflow-x-auto select-all max-h-48 bg-slate-900/50 p-2 rounded border border-slate-900 overflow-y-auto">{JSON.stringify(step.tool_output.data || step.tool_output, null, 2)}</pre>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {steps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  Initializing autonomous agent workflow...
                </span>
              </div>
            )}
          </div>
        </div>      </div>
    </div>
  );
}
