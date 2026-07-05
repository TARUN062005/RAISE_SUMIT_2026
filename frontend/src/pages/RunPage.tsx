import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XCircle, AlertTriangle, Clock, 
  ShieldAlert, ArrowLeft, RefreshCw, Layers, Brain, User, Pill,
  ClipboardList, CheckCircle2, AlertCircle,
  X, ChevronDown, Download, CheckSquare, FileText, Terminal
} from "lucide-react";
import { apiFetch, apiPath } from "../lib/api";

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

// Replaced by getStepSummary and getToolConfig helper functions below

function AccordionSection({ title, count, children }: { title: string, count?: number, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border-subtle bg-bg-surface rounded-xl overflow-hidden shadow-3xs">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-elevated hover:bg-bg-elevated/75 transition text-xs font-black text-text-primary uppercase tracking-widest cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {title} {count !== undefined && <span className="text-[9px] bg-bg-base px-2 py-0.5 border border-border-subtle rounded-md text-text-secondary font-bold">{count}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="p-4 space-y-3 bg-bg-base/30 border-t border-border-subtle">{children}</div>}
    </div>
  );
}

function getToolConfig(type: string, toolName?: string) {
  if (type === "thought" || !toolName) {
    return {
      bg: "bg-teal-500/5",
      border: "border-teal-500/20",
      text: "text-teal-400",
      icon: <Brain className="w-3.5 h-3.5 text-teal-400" />,
      name: "Clinical Planning"
    };
  }

  const name = toolName;
  if (name.includes("PatientRecordTool")) {
    return {
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      text: "text-blue-400",
      icon: <User className="w-3.5 h-3.5 text-blue-400" />,
      name: "Patient Data Registry"
    };
  }
  if (name.includes("TrialEligibilityTool")) {
    return {
      bg: "bg-indigo-500/5",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      icon: <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />,
      name: "Trial Protocol Registry"
    };
  }
  if (name.includes("DrugInteractionTool")) {
    return {
      bg: "bg-orange-500/5",
      border: "border-orange-500/20",
      text: "text-orange-400",
      icon: <Pill className="w-3.5 h-3.5 text-orange-400" />,
      name: "Drug Safety Check"
    };
  }
  if (name.includes("FreshnessTool")) {
    return {
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      text: "text-amber-400",
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      name: "Freshness Verification"
    };
  }
  
  return {
    bg: "bg-slate-500/5",
    border: "border-slate-500/20",
    text: "text-slate-400",
    icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
    name: toolName
  };
}

function getStepSummary(step: Step) {
  if (step.type === "thought") {
    const line = step.content.split("\n").map(x => x.trim()).filter(Boolean)[0] || "";
    return line.length > 80 ? line.slice(0, 77) + "..." : line;
  }
  
  const tool = step.tool_called || "";
  if (tool === "PatientRecordTool.get_record") return "Retrieved demographic details, gender, and date of birth.";
  if (tool === "PatientRecordTool.get_conditions") return "Scanned diagnostic registry for history checklist.";
  if (tool === "PatientRecordTool.get_medications") return "Compiled active medications list for drug interaction scans.";
  if (tool === "PatientRecordTool.get_observations") return "Queried clinical observations, labs, and vital records.";
  if (tool === "PatientRecordTool.get_allergies") return "Audited immunology history and active drug allergies.";
  if (tool === "TrialEligibilityTool.get_trial") return "Fetched trial registry parameters and details.";
  if (tool === "TrialEligibilityTool.get_criteria") return "Loaded inclusion and exclusion criteria rules.";
  if (tool === "DrugInteractionTool.check_exclusions") return "Checked active medications against exclusions.";
  if (tool === "FreshnessTool.check") return "Audited freshness timestamps for clinical compliance.";
  
  return step.content || "Completed system database query.";
}

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const [status, setStatus] = useState("initializing");
  const [steps, setSteps] = useState<Step[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState("");
  
  // Metadata fields
  const [patientId, setPatientId] = useState("");
  const [trialId, setTrialId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [trialTitle, setTrialTitle] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [totalDurationMs, setTotalDurationMs] = useState<number | null>(null);

  const [selectedStepForDetail, setSelectedStepForDetail] = useState<Step | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
    setIsUserScrolled(!isAtBottom);
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

    // Load initial metadata immediately
    apiFetch(`/api/agent/run/${runId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load run details");
      })
      .then((data) => {
        setPatientId(data.patient_id || "");
        setTrialId(data.trial_id || "");
        setCreatedAt(data.created_at || "");
        setCompletedAt(data.completed_at || "");
        setTotalDurationMs(data.total_duration_ms || null);
        if (data.status) setStatus(data.status);
        if (data.steps) setSteps(data.steps);
        if (data.final_report) setReport(data.final_report);
      })
      .catch(err => console.error("Initial load error:", err));

    const eventSource = new EventSource(apiPath(`/api/agent/run/${runId}/stream`));

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
          // Fetch once more to get completed timestamps
          apiFetch(`/api/agent/run/${runId}`)
            .then(res => res.json())
            .then(updated => {
              setCompletedAt(updated.completed_at || "");
              setTotalDurationMs(updated.total_duration_ms || null);
            }).catch(e => console.error("Completed update error:", e));
            
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
      apiFetch(`/api/agent/run/${runId}`)
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
    if (!patientId) return;
    apiFetch("/api/patients")
      .then(res => res.json())
      .then((data: any[]) => {
        const p = data.find(item => item.id === patientId);
        if (p) setPatientName(p.name);
      })
      .catch(err => console.error("Error loading patient name:", err));
  }, [patientId]);

  useEffect(() => {
    if (!trialId) return;
    apiFetch("/api/trials")
      .then(res => res.json())
      .then((data: any[]) => {
        const t = data.find(item => item.id === trialId);
        if (t) setTrialTitle(t.title);
      })
      .catch(err => console.error("Error loading trial title:", err));
  }, [trialId]);

  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case "eligible":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          badge: "bg-emerald-100/70 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        };
      case "conditionally_eligible":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          badge: "bg-amber-100/70 text-amber-800 border-amber-300",
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />
        };
      default:
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          badge: "bg-rose-100/70 text-rose-800 border-rose-300",
          icon: <XCircle className="w-6 h-6 text-rose-600" />
        };
    }
  };

  const formatDuration = (ms?: number | null) => {
    if (ms === undefined || ms === null) return "N/A";
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Dynamic CSS styles to format printing cleanly */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            grid-column: span 3 / span 3 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Slide-over details Modal Drawer */}
      {selectedStepForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 text-white">
            <div className="space-y-4 flex-grow overflow-y-auto pr-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {selectedStepForDetail.tool_called ? selectedStepForDetail.tool_called.split(".")[0] : "Clinical Thought"}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedStepForDetail(null)}
                  className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {selectedStepForDetail.type === "thought" ? (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Reasoning Thought Process:</span>
                  <pre className="text-slate-350 whitespace-pre-wrap font-sans text-xs bg-slate-950 border border-slate-850 p-4 rounded-xl leading-relaxed select-all">
                    {selectedStepForDetail.content}
                  </pre>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Query Input Arguments:</span>
                    <pre className="text-teal-400 font-mono text-[10px] bg-slate-950 border border-slate-850 p-4 rounded-xl overflow-x-auto select-all max-h-48 leading-relaxed">
                      {JSON.stringify(selectedStepForDetail.tool_input, null, 2)}
                    </pre>
                  </div>
                  {selectedStepForDetail.tool_output && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Returned Database Payload:</span>
                      <pre className="text-slate-350 font-mono text-[10px] bg-slate-950 border border-slate-850 p-4 rounded-xl overflow-x-auto select-all max-h-[30rem] overflow-y-auto leading-relaxed">
                        {JSON.stringify(selectedStepForDetail.tool_output.data || selectedStepForDetail.tool_output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-800 pt-4 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStepForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Audit Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb and Meta (Hidden on print) */}
      <div className="rounded-[1.75rem] border border-border-subtle bg-bg-surface px-5 py-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
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
            {status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 no-print">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: EXECUTIVE REPORT */}
        <div className="lg:col-span-2 space-y-8 print-full-width">
          
          {/* Active Status header (Hidden on print) */}
          {(status === "running" || status === "initializing") && (
            <div className="bg-bg-surface border border-border-subtle rounded-[1.75rem] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs no-print animate-pulse">
              <div className="space-y-0.5">
                <div className="text-[9px] text-teal-605 font-bold uppercase tracking-wider">Evaluation Process</div>
                <h3 className="text-base font-black text-text-primary uppercase tracking-wide">Executing Active Evaluation Pipeline</h3>
                <p className="text-xs text-text-secondary font-medium">Please wait while the ReAct agent resolves variables and runs interaction algorithms...</p>
              </div>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-150 px-3.5 py-2 rounded-xl text-teal-700 text-xs font-bold shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Running Inference Loop...</span>
              </div>
            </div>
          )}

          {/* compiled Clinical Report */}
          <AnimatePresence>
            {report ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Executive Medical Report Card */}
                <div className="bg-bg-surface border border-border-subtle rounded-[1.75rem] p-6 md:p-8 shadow-2xs space-y-6 print-container relative">
                  
                  {/* Print / Export Actions bar (Hidden on print) */}
                  <div className="absolute top-6 right-6 flex items-center gap-2 no-print">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 bg-bg-surface border border-border-subtle hover:bg-bg-elevated text-text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-text-secondary" />
                      Export Report (PDF)
                    </button>
                  </div>

                  {/* 1. Header Information Block */}
                  <div className="border-b border-border-subtle pb-6 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-teal-700">
                      <FileText className="w-3.5 h-3.5" /> Clinical Evaluation Record
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Patient Target</span>
                        <span className="text-xs font-extrabold text-text-primary">{patientName || patientId || "Target Patient"}</span>
                        {patientName && <span className="text-[9px] font-mono text-text-secondary block">ID: {patientId}</span>}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Study Protocol</span>
                        <span className="text-xs font-extrabold text-text-primary truncate block max-w-[200px]" title={trialTitle || trialId}>{trialTitle || trialId || "Study Protocol"}</span>
                        {trialTitle && <span className="text-[9px] font-mono text-text-secondary block">ID: {trialId}</span>}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Generated Date</span>
                        <span className="text-xs font-semibold text-text-primary block">{formatDate(completedAt || createdAt)}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Processing Time</span>
                        <span className="text-xs font-semibold text-text-primary block">{formatDuration(totalDurationMs)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Executive Summary / Decision outcome */}
                  {(() => {
                    const styles = getDecisionStyles(report.eligibility_decision);
                    return (
                      <div className={`border rounded-2xl p-6 ${styles.bg} flex flex-col md:flex-row items-start gap-5`}>
                        <div className="p-2 bg-white/80 border border-slate-200 rounded-xl shrink-0 shadow-3xs">
                          {styles.icon}
                        </div>
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Protocol Matching Decision Outcome</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${styles.badge}`}>
                              {report.eligibility_decision.replace(/_/g, " ")}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-text-primary tracking-tight">Executive Rationale Recommendation</h4>
                          <p className="text-xs leading-relaxed font-semibold text-text-primary">
                            {report.recommendation}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Evidence Coverage Metrics summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                    <div className="bg-bg-elevated/45 border border-border-subtle rounded-xl p-3 text-center shadow-3xs">
                      <div className="text-lg font-extrabold text-text-primary">{report.evidence.verified_records}</div>
                      <div className="text-[8.5px] text-text-secondary uppercase font-bold tracking-wider mt-0.5">Records Audited</div>
                    </div>
                    <div className="bg-bg-elevated/45 border border-border-subtle rounded-xl p-3 text-center shadow-3xs">
                      <div className="text-lg font-extrabold text-text-primary">{report.evidence.total_criteria}</div>
                      <div className="text-[8.5px] text-text-secondary uppercase font-bold tracking-wider mt-0.5">Criteria Mapped</div>
                    </div>
                    <div className="bg-bg-elevated/45 border border-border-subtle rounded-xl p-3 text-center shadow-3xs">
                      <div className="text-lg font-extrabold text-text-primary">{report.evidence.satisfied_count}</div>
                      <div className="text-[8.5px] text-text-secondary uppercase font-bold tracking-wider mt-0.5">Verified Satisfied</div>
                    </div>
                    <div className="bg-bg-elevated/45 border border-border-subtle rounded-xl p-3 text-center shadow-3xs">
                      <div className="text-lg font-extrabold text-teal-650">{report.evidence.coverage_pct}%</div>
                      <div className="text-[8.5px] text-teal-650 uppercase font-bold tracking-wider mt-0.5">Evidence Coverage</div>
                    </div>
                  </div>

                  {/* 4. Reasoning Summary Narrative */}
                  {report.decision_summary && (
                    <div className="bg-bg-elevated/20 border border-border-subtle rounded-2xl p-5 space-y-3">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Matching Rationale Summary</span>
                      <div className="text-xs text-text-primary leading-relaxed space-y-3">
                        {report.decision_summary.headline_reasons.map((reason, idx) => (
                          <p key={idx} className="font-medium">
                            {reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Recommended Actions checklist */}
                  {report.decision_summary && report.decision_summary.required_actions.length > 0 && (
                    <div className="bg-amber-50/20 border border-amber-200 rounded-2xl p-5 space-y-3.5">
                      <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest block flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" /> Recommended Clinical Action Checklist
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {report.decision_summary.required_actions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-amber-50/40 border border-amber-200/50 px-3 py-2.5 rounded-xl text-xs text-amber-850 font-semibold shadow-3xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-550 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 6. Collapsible Clinical Evidence groupings */}
                  <div className="space-y-4 pt-2">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block border-b border-border-subtle/50 pb-2">Clinical Evidence Registries</span>
                    
                    <AccordionSection title="Satisfied inclusion & exclusion criteria" count={report.satisfied_criteria.length}>
                      <div className="space-y-3">
                        {report.satisfied_criteria.map((item, idx) => (
                          <div key={idx} className="bg-bg-elevated/40 border border-border-subtle rounded-xl p-3.5 text-xs space-y-2 shadow-3xs">
                            <p className="font-semibold text-text-primary leading-relaxed">{item.criterion}</p>
                            <div className="text-[9px] text-teal-650 font-bold uppercase tracking-wider inline-flex bg-teal-50 border border-teal-200/30 px-2 py-0.5 rounded-md select-all">
                              Evidence Citation: {item.evidence_citation}
                            </div>
                          </div>
                        ))}
                        {report.satisfied_criteria.length === 0 && (
                          <p className="text-xs text-text-secondary italic text-center py-4">No criteria documented as satisfied.</p>
                        )}
                      </div>
                    </AccordionSection>

                    <AccordionSection title="Unsatisfied protocol criteria & exclusions" count={report.unsatisfied_criteria.length}>
                      <div className="space-y-3">
                        {report.unsatisfied_criteria.map((item, idx) => (
                          <div key={idx} className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 text-xs space-y-1.5 shadow-3xs">
                            <p className="font-bold text-rose-800 leading-normal">{item.criterion}</p>
                            <p className="text-rose-900 font-medium text-[11px] leading-relaxed">Reasoning Basis: {item.reason}</p>
                          </div>
                        ))}
                        {report.unsatisfied_criteria.length === 0 && (
                          <p className="text-xs text-text-secondary italic text-center py-4">No unsatisfied protocol criteria logged.</p>
                        )}
                      </div>
                    </AccordionSection>

                    <AccordionSection title="Freshness & Policy validity status" count={report.policy_checks.length}>
                      <div className="space-y-3">
                        {report.policy_checks.map((item, idx) => {
                          const isSuccess = item.result.toLowerCase().includes("valid") || item.result.toLowerCase().includes("fresh");
                          return (
                            <div key={idx} className="bg-bg-elevated/40 border border-border-subtle rounded-xl p-3.5 text-xs flex items-center justify-between gap-4 shadow-3xs">
                              <div className="space-y-0.5">
                                <p className="font-bold text-text-primary leading-normal">{item.policy_name}</p>
                                <p className="text-text-secondary text-[10px]">Record Checked: {item.record_checked}</p>
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
                          <p className="text-xs text-text-secondary italic text-center py-4">No policy audits logged.</p>
                        )}
                      </div>
                    </AccordionSection>

                    <AccordionSection title="Active concomitant medication conflicts" count={report.drug_exclusions.conflicts.length}>
                      <div className="space-y-3">
                        {report.drug_exclusions.conflicts.map((conflict, idx) => (
                          <div key={idx} className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-xs flex items-start gap-3 shadow-3xs">
                            <div className="p-1.5 bg-white border border-rose-350 rounded-lg shrink-0">
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-black text-rose-800">Concomitant Excluded Drug: {conflict.medication}</p>
                              <p className="text-rose-705 text-[10px] font-semibold">Conflict Category: {conflict.category} | Severity: {conflict.severity}</p>
                              <p className="text-slate-550 mt-1 text-[11px] leading-relaxed">Rule Basis: {conflict.description}</p>
                            </div>
                          </div>
                        ))}
                        {report.drug_exclusions.conflicts.length === 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-200/55 rounded-xl p-4 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Zero drug interaction or concomitant medication conflicts detected in patient registry.</span>
                          </div>
                        )}
                      </div>
                    </AccordionSection>
                  </div>

                  {/* 7. Audit Information Block (Footer) */}
                  <div className="border-t border-border-subtle pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-[9px] text-text-secondary font-medium">
                    <div>
                      REPORT ID: <span className="font-mono text-text-primary">{runId}</span>
                    </div>
                    <div>
                      HOSPITAL POLICIES TRIGGERED: <span className="text-text-primary">5 Rules</span>
                    </div>
                    <div>
                      EVALUATION CORES: <span className="text-text-primary">Vultr Serverless Inference</span>
                    </div>
                    <div>
                      TIMESTAMP: <span className="font-mono text-text-primary">{formatDate(completedAt || createdAt)}</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="bg-bg-surface border border-border-subtle rounded-[1.75rem] p-10 text-center text-text-secondary italic text-xs shadow-2xs min-h-[300px] flex flex-col items-center justify-center space-y-2">
                <Layers className="w-10 h-10 text-slate-300 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Report Pending</p>
                <p className="max-w-xs leading-normal">The finalized evaluation report will render here dynamically upon ReAct inference completion.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: VERTICAL TIMELINE STREAM (Hidden on print) */}
        <div className="bg-slate-950 border border-slate-900 rounded-[1.75rem] overflow-hidden shadow-2xs flex flex-col shrink-0 lg:sticky lg:top-6 no-print w-full lg:w-96">
          <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400 animate-pulse" /> Telemetry Timeline
            </h3>
            {(status === "running" || status === "initializing") && (
              <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            )}
          </div>
          
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="p-5 overflow-y-auto space-y-4 bg-slate-950 max-h-[500px]"
          >
            {steps.length > 0 ? (
              <div className="relative pl-4 space-y-5 border-l border-slate-800">
                {steps.map((step, idx) => {
                  const toolName = step.tool_called;
                  const config = getToolConfig(step.type, toolName);
                  const isLatestStep = idx === steps.length - 1;
                  const isInProgress = isLatestStep && (status === "running" || status === "initializing");
                  const summaryText = getStepSummary(step);

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative group text-white"
                    >
                      {/* Timeline dot connector node */}
                      <span className={`absolute -left-[25px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full border bg-slate-950 shrink-0 ${
                        isInProgress ? "border-teal-400 animate-pulse ring-2 ring-teal-500/10" : "border-slate-800"
                      }`}>
                        {config.icon}
                      </span>
                      
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-extrabold text-slate-250 text-[10px] uppercase tracking-wider truncate">
                            {config.name}
                          </span>
                          
                          {/* Timings or terminal details buttons */}
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[9px]">
                            {isInProgress ? (
                              <span className="text-teal-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping"></span>
                                Active
                              </span>
                            ) : (
                              <>
                                {step.duration_ms !== undefined ? (
                                  <span className="text-slate-500">{step.duration_ms}ms</span>
                                ) : (
                                  <span className="text-slate-550">✓</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedStepForDetail(step)}
                                  title="View audit code payload"
                                  className="text-slate-500 hover:text-teal-400 p-0.5 rounded transition cursor-pointer"
                                >
                                  <Terminal className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-slate-400 text-[10px] leading-relaxed pr-2">
                          {summaryText}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  Initializing telemetry stream...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
