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
  if (!toolName) return <Brain className="w-4 h-4 text-indigo-400" />;
  switch (toolName) {
    case "PatientRecordTool.get_record":
      return <User className="w-4 h-4 text-sky-400" />;
    case "PatientRecordTool.get_conditions":
      return <Activity className="w-4 h-4 text-emerald-400" />;
    case "PatientRecordTool.get_medications":
      return <Pill className="w-4 h-4 text-violet-400" />;
    case "PatientRecordTool.get_observations":
      return <BarChart3 className="w-4 h-4 text-amber-400" />;
    case "PatientRecordTool.get_allergies":
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    case "TrialEligibilityTool.get_trial":
      return <FlaskConical className="w-4 h-4 text-indigo-400" />;
    case "TrialEligibilityTool.get_criteria":
      return <ClipboardList className="w-4 h-4 text-purple-400" />;
    case "DrugInteractionTool.check_exclusions":
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case "FreshnessTool.check":
      return <Clock className="w-4 h-4 text-pink-400" />;
    default:
      return <Brain className="w-4 h-4 text-indigo-400" />;
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
  const stepsEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case "eligible":
        return {
          bg: "bg-emerald-950/20 border-emerald-900/60 shadow-emerald-950/5",
          text: "text-emerald-300",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        };
      case "conditionally_eligible":
        return {
          bg: "bg-amber-950/20 border-amber-900/60 shadow-amber-950/5",
          text: "text-amber-300",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />
        };
      default:
        return {
          bg: "bg-rose-950/20 border-rose-900/60 shadow-rose-950/5",
          text: "text-rose-300",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          icon: <XCircle className="w-8 h-8 text-rose-400" />
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb and Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <Link 
          to="/evaluate" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-450">Run ID: <code className="bg-slate-900 px-2.5 py-1 rounded-xl text-indigo-400 font-mono text-[10px] border border-slate-800">{runId}</code></span>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
            status === "running" || status === "initializing"
              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 animate-pulse"
              : status === "completed" || status === "eligible"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : status === "conditionally_eligible"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (2/3 SPAN): REPORT & METRICS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Status header */}
          <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Evaluation Process</div>
              <h3 className="text-lg font-bold text-slate-200">ReAct Reasoning Execution</h3>
              <p className="text-xs text-slate-400">Agent autonomously matches criteria variables and audits diagnostics.</p>
            </div>
            {(status === "running" || status === "initializing") && (
              <div className="flex items-center gap-3 bg-indigo-950/20 border border-indigo-900/60 px-4 py-2 rounded-xl text-indigo-300 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Running Inference Loop...</span>
              </div>
            )}
          </div>

          {/* Metrics summary cards */}
          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div className="bg-[#0f1422] border border-slate-850 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl font-black text-white">{report.evidence.verified_records}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1.5">EHR Records Audited</div>
              </div>
              <div className="bg-[#0f1422] border border-slate-850 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl font-black text-white">{report.evidence.total_criteria}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1.5">Criteria Scanned</div>
              </div>
              <div className="bg-[#0f1422] border border-slate-850 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl font-black text-white">{report.evidence.satisfied_count}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1.5">Satisfied criteria</div>
              </div>
              <div className="bg-[#0f1422] border border-slate-850 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl font-black text-indigo-400">{report.evidence.coverage_pct}%</div>
                <div className="text-[9px] text-indigo-350 uppercase font-bold tracking-wider mt-1.5">Evidence Coverage</div>
              </div>
            </motion.div>
          )}

          {/* Fallback error display */}
          {error && (
            <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl text-xs text-rose-350 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* compiled Clinical Report */}
          <AnimatePresence>
            {report && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Decision Summary Block (Section 5) */}
                {report.decision_summary && (
                  <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evaluation Readiness Profile</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Summary of critical clinical action points</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Readiness Index</span>
                          <div className="text-sm font-black text-indigo-400">{report.decision_summary.readiness_pct}%</div>
                        </div>
                        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-850">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${report.decision_summary.readiness_pct}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Headline Findings</span>
                        <ul className="space-y-1.5 text-slate-355">
                          {report.decision_summary.headline_reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-[#141929] px-3 py-2 rounded-lg border border-slate-850">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              <span className="leading-relaxed text-slate-300">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Required Clinical Actions</span>
                        <ul className="space-y-1.5 text-slate-355">
                          {report.decision_summary.required_actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-[#181124] px-3 py-2 rounded-lg border border-purple-950/40 text-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{action}</span>
                            </li>
                          ))}
                          {report.decision_summary.required_actions.length === 0 && (
                            <li className="text-slate-500 italic py-2 text-center w-full">No outstanding protocol actions required.</li>
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
                    <div className={`border rounded-2xl p-6 md:p-8 shadow-xl ${styles.bg} flex flex-col md:flex-row items-start gap-5`}>
                      <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-2xl shadow-inner shrink-0">
                        {styles.icon}
                      </div>
                      <div className="space-y-3 flex-grow">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Eligibility Outcome</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${styles.badge}`}>
                            {report.eligibility_decision.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-200">Recommendation Summary</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-medium">
                          {report.recommendation}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist criteria grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Satisfied Criteria Checklist */}
                  <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Satisfied Inclusion/Exclusion
                    </h4>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {report.satisfied_criteria.map((item, idx) => (
                        <div key={idx} className="bg-[#141929] border border-slate-850 rounded-xl p-3 text-xs space-y-2">
                          <p className="font-semibold text-slate-300 leading-normal">{item.criterion}</p>
                          <div className="text-[9px] text-slate-400 font-mono bg-slate-900 border border-slate-850 px-2 py-1 rounded inline-block select-all">
                            Citation: {item.evidence_citation}
                          </div>
                        </div>
                      ))}
                      {report.satisfied_criteria.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-4">No satisfied criteria verified.</p>
                      )}
                    </div>
                  </div>

                  {/* Unsatisfied Exclusions Checklist */}
                  <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                      <XCircle className="w-4 h-4 text-rose-400" /> Unsatisfied & Exclusions
                    </h4>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {report.unsatisfied_criteria.map((item, idx) => (
                        <div key={idx} className="bg-rose-950/10 border border-rose-950/40 rounded-xl p-3 text-xs space-y-1.5">
                          <p className="font-semibold text-rose-300 leading-normal">{item.criterion}</p>
                          <p className="text-rose-400 font-medium text-[11px]">{item.reason}</p>
                        </div>
                      ))}
                      {report.unsatisfied_criteria.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-4">No exclusions or unsatisfied variables detected.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outstanding Tasks & Policy checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outstanding Tasks */}
                  <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Outstanding Clinical Requirements
                    </h4>
                    <div className="space-y-3">
                      {report.outstanding_requirements.map((item, idx) => (
                        <div key={idx} className="bg-amber-950/10 border border-amber-950/40 rounded-xl p-3 text-xs flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="font-semibold text-amber-300 leading-normal">{item.description}</p>
                            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Record Class: {item.related_record_type}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded font-bold text-[8px] uppercase tracking-wider shrink-0">
                            Required
                          </span>
                        </div>
                      ))}
                      {report.outstanding_requirements.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-4">No outstanding tests required.</p>
                      )}
                    </div>
                  </div>

                  {/* Policy & Freshness Audit */}
                  <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                      <Clock className="w-4 h-4 text-sky-400" /> Freshness & Policy Audits
                    </h4>
                    <div className="space-y-3">
                      {report.policy_checks.map((item, idx) => {
                        const isSuccess = item.result.toLowerCase().includes("valid") || item.result.toLowerCase().includes("fresh");
                        return (
                          <div key={idx} className="bg-[#141929] border border-slate-850 rounded-xl p-3 text-xs flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-300 leading-normal">{item.policy_name}</p>
                              <p className="text-slate-400 text-[10px]">Record Checked: {item.record_checked}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded border font-bold text-[8px] uppercase tracking-wider shrink-0 ${
                              isSuccess ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}>
                              {item.result.split(".")[0]}
                            </span>
                          </div>
                        );
                      })}
                      {report.policy_checks.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-4">No quality policy checks logged.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drug interactions log */}
                <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
                    <ShieldAlert className="w-4 h-4 text-violet-400" /> Concomitant Drug Conflict Log
                  </h4>
                  <div className="space-y-3">
                    {report.drug_exclusions.conflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-rose-950/10 border border-rose-900/40 rounded-xl p-4 text-xs flex items-start gap-4">
                        <div className="p-2 bg-[#0c101d] rounded-xl border border-rose-900/60 mt-0.5 shrink-0">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-rose-300">Active Exclusion Drug: {conflict.medication}</p>
                          <p className="text-rose-400 text-[11px] font-semibold">Exclusion Category: {conflict.category} | Severity: {conflict.severity}</p>
                          <p className="text-slate-450 mt-1 text-[11px] leading-relaxed">Rule Basis: {conflict.description}</p>
                        </div>
                      </div>
                    ))}
                    {report.drug_exclusions.conflicts.length === 0 && (
                      <div className="bg-emerald-950/10 border border-emerald-900/40 rounded-xl p-4 text-xs text-emerald-350 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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
        <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl min-h-[500px] flex flex-col">
          <div className="bg-[#121828]/50 px-6 py-4 border-b border-slate-850 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 animate-pulse" /> Agent Reasoning Stream
            </h3>
            {(status === "running" || status === "initializing") && (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            )}
          </div>
          
          <div className="p-6 flex-grow overflow-y-auto space-y-4 max-h-[600px] font-mono text-[11px] text-slate-300 leading-relaxed">
            <AnimatePresence initial={false}>
              {steps.map((step, idx) => {
                const isObservation = step.type === "observation";
                const isThought = step.type === "thought";
                const toolName = step.tool_called;
                const toolTitle = getToolTitle(toolName);
                const icon = getToolIcon(toolName);
                const rationale = toolName ? toolRationales[toolName] : "";

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-l-2 border-slate-800 pl-4 py-2 space-y-2 select-text"
                  >
                    {/* Step Title Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-1.5">
                        {icon} {isThought ? "Planning Reasoning" : (step.tool_called ? step.tool_called.split(".")[0] : "Observation Agent")}
                      </span>
                      <div className="flex items-center gap-2 font-semibold">
                        {step.duration_ms !== undefined && (
                          <span className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-slate-400">
                            {step.duration_ms}ms
                          </span>
                        )}
                        <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Step Main text */}
                    {isThought && (
                      <p className="text-slate-200 font-sans text-xs bg-slate-900/40 p-3 border border-slate-850 rounded-xl leading-relaxed">
                        {step.content}
                      </p>
                    )}

                    {isObservation && (
                      <div className="space-y-2 font-sans">
                        <div className="bg-[#141929] border border-slate-850 rounded-xl p-3 space-y-2">
                          <div className="text-xs font-bold text-slate-350">{toolTitle}</div>
                          {rationale && (
                            <div className="text-[10px] text-slate-450 italic border-l border-indigo-500/40 pl-2">
                              Rationale: {rationale}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono select-all">
                            Tool Called: <code className="text-indigo-300 font-semibold">{step.tool_called}</code>
                          </div>
                        </div>

                        {/* Collapsible Tool IO block */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-2 font-mono text-[10px]">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Args Payload:</div>
                          <pre className="text-slate-400 overflow-x-auto select-all max-h-32">{JSON.stringify(step.tool_input, null, 2)}</pre>
                          {step.tool_output && (
                            <>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-900 pt-2 mt-2">Returned payload:</div>
                              <pre className="text-slate-400 overflow-x-auto select-all max-h-48 overflow-y-auto">{JSON.stringify(step.tool_output.data || step.tool_output, null, 2)}</pre>
                            </>
                          )}
                        </div>
                      </div>
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
            <div ref={stepsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
