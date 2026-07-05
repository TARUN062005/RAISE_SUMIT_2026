import { useState, useEffect, useRef, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Brain, User, Pill, Activity, BarChart3, ShieldAlert,
  FlaskConical, ClipboardList, AlertTriangle, Clock, Database,
  FileText, Filter, Search, Building2, UserCheck, Stethoscope,
  Globe, TrendingUp, CheckCircle, XCircle, Loader2, ChevronDown,
  ChevronUp, Table2, BarChart2, BookOpen, ArrowRight
} from "lucide-react";
import { apiFetch, apiPath } from "../lib/api";

interface Step {
  type: string;
  content: string;
  tool_called?: string;
  tool_input?: any;
  tool_output?: any;
  duration_ms?: number;
  timestamp: string;
}

interface AssistantResult {
  response_type: "stats" | "list" | "summary" | "explanation" | "refusal";
  title: string;
  data: any;
  summary: string;
  columns?: string[];
}

const EXAMPLE_QUERIES = [
  {
    category: "Statistics",
    icon: <BarChart2 className="w-3.5 h-3.5" />,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    queries: [
      "How many patients are in the system?",
      "Show me statistics across all collections",
      "What is the average patient age?",
      "How many reports were generated?",
      "Show trial statistics by condition and phase",
    ],
  },
  {
    category: "Patient Retrieval",
    icon: <User className="w-3.5 h-3.5" />,
    color: "text-teal-600 bg-teal-50 border-teal-200",
    queries: [
      "Show me John Williams",
      "List all patients",
      "Summarize patient John Williams",
      "Show observations for John Williams",
      "Show medications for John Williams",
      "Show encounters for John Williams",
      "Show procedures for John Williams",
      "Show careplans for John Williams",
    ],
  },
  {
    category: "Filtering",
    icon: <Filter className="w-3.5 h-3.5" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    queries: [
      "Show patients older than 60",
      "Show patients younger than 40",
      "Patients taking Warfarin",
      "Patients taking Aspirin",
      "Patients with NSCLC",
      "Patients with lung cancer",
      "Patients with diabetes",
    ],
  },
  {
    category: "Trials & Policies",
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    queries: [
      "List all clinical trials",
      "Show hospital policies",
      "Show drug interaction rules",
      "Show eligibility criteria for trial NSCLC-2026-001",
    ],
  },
  {
    category: "Reports & Evidence",
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    queries: [
      "List all evaluation reports",
      "Show completed reports",
      "List failed reports",
    ],
  },
  {
    category: "Operations",
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    queries: [
      "List all providers",
      "List all organizations",
      "Fetch data from /api/health",
      "Fetch data from /api/patients",
    ],
  },
];

const TOOL_ICONS: Record<string, ReactElement> = {
  "StatsTool.get_patient_count": <User className="w-3.5 h-3.5" />,
  "StatsTool.get_trial_count": <FlaskConical className="w-3.5 h-3.5" />,
  "StatsTool.get_report_count": <FileText className="w-3.5 h-3.5" />,
  "StatsTool.get_average_patient_age": <TrendingUp className="w-3.5 h-3.5" />,
  "StatsTool.get_collection_stats": <Database className="w-3.5 h-3.5" />,
  "StatsTool.get_trial_stats": <BarChart3 className="w-3.5 h-3.5" />,
  "QueryTool.list_patients": <User className="w-3.5 h-3.5" />,
  "QueryTool.search_patients_by_name": <Search className="w-3.5 h-3.5" />,
  "QueryTool.filter_patients_by_age": <Filter className="w-3.5 h-3.5" />,
  "QueryTool.filter_patients_by_medication": <Pill className="w-3.5 h-3.5" />,
  "QueryTool.filter_patients_by_condition": <Stethoscope className="w-3.5 h-3.5" />,
  "QueryTool.list_trials": <FlaskConical className="w-3.5 h-3.5" />,
  "QueryTool.get_trial_criteria": <ClipboardList className="w-3.5 h-3.5" />,
  "QueryTool.list_reports": <FileText className="w-3.5 h-3.5" />,
  "QueryTool.get_report": <FileText className="w-3.5 h-3.5" />,
  "QueryTool.list_hospital_policies": <Building2 className="w-3.5 h-3.5" />,
  "QueryTool.list_drug_rules": <ShieldAlert className="w-3.5 h-3.5" />,
  "QueryTool.list_encounters": <Activity className="w-3.5 h-3.5" />,
  "QueryTool.list_procedures": <Stethoscope className="w-3.5 h-3.5" />,
  "QueryTool.list_careplans": <ClipboardList className="w-3.5 h-3.5" />,
  "QueryTool.list_providers": <UserCheck className="w-3.5 h-3.5" />,
  "QueryTool.list_organizations": <Building2 className="w-3.5 h-3.5" />,
  "PatientRecordTool.get_record": <User className="w-3.5 h-3.5" />,
  "PatientRecordTool.get_conditions": <Activity className="w-3.5 h-3.5" />,
  "PatientRecordTool.get_medications": <Pill className="w-3.5 h-3.5" />,
  "PatientRecordTool.get_observations": <BarChart3 className="w-3.5 h-3.5" />,
  "PatientRecordTool.get_allergies": <ShieldAlert className="w-3.5 h-3.5" />,
  "TrialEligibilityTool.get_trial": <FlaskConical className="w-3.5 h-3.5" />,
  "TrialEligibilityTool.get_criteria": <ClipboardList className="w-3.5 h-3.5" />,
  "DrugInteractionTool.check_exclusions": <AlertTriangle className="w-3.5 h-3.5" />,
  "FreshnessTool.check": <Clock className="w-3.5 h-3.5" />,
  "EndpointFetchTool.fetch": <Globe className="w-3.5 h-3.5" />,
};

function getToolIcon(toolName?: string): ReactElement {
  if (!toolName) return <Brain className="w-3.5 h-3.5 text-teal-500" />;
  return TOOL_ICONS[toolName] ?? <Database className="w-3.5 h-3.5" />;
}

function KpiCards({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data).filter(([, v]) => typeof v === "number" || typeof v === "string");
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-2xl font-black text-text-primary tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DataTable({ data, columns }: { data: any[]; columns?: string[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  if (!data || data.length === 0) return <p className="text-xs text-text-secondary">No results found.</p>;

  const cols = columns ?? Object.keys(data[0]).filter(k => k !== "_id").slice(0, 8);

  const filtered = data.filter(row =>
    cols.some(col => String(row[col] ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const handleSort = (col: string) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search results…"
          className="w-full pl-9 pr-4 py-2 text-xs border border-border-subtle rounded-lg bg-bg-elevated text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <table className="w-full text-xs">
          <thead className="bg-bg-elevated border-b border-border-subtle">
            <tr>
              {cols.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-text-secondary cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col.replace(/_/g, " ")}
                    {sortKey === col && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sorted.slice(0, 200).map((row, i) => (
              <tr key={i} className="hover:bg-bg-elevated transition-colors">
                {cols.map(col => {
                  const val = row[col];
                  const display = Array.isArray(val) ? val.join(", ") : String(val ?? "—");
                  return (
                    <td key={col} className="px-4 py-2 text-text-primary max-w-[200px] truncate" title={display}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && (
          <div className="px-4 py-2 text-[10px] text-text-secondary bg-bg-elevated border-t border-border-subtle">
            Showing 200 of {sorted.length} results
          </div>
        )}
      </div>
      <p className="text-[10px] text-text-secondary">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
    </div>
  );
}

function SummarySection({ data }: { data: Record<string, any> }) {
  const renderValue = (v: any): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object" && !Array.isArray(v)) return JSON.stringify(v, null, 2);
    if (Array.isArray(v)) return v.map(item => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
    return String(v);
  };

  return (
    <div className="grid gap-2">
      {Object.entries(data).filter(([k]) => k !== "_id").map(([key, val]) => (
        <div key={key} className="flex gap-3 p-3 bg-bg-surface border border-border-subtle rounded-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary w-32 shrink-0 pt-0.5">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-text-primary break-words">
            {Array.isArray(val) ? (
              <ul className="space-y-1">
                {val.slice(0, 20).map((item, i) => (
                  <li key={i} className="text-xs">{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
                ))}
                {val.length > 20 && <li className="text-text-secondary">+{val.length - 20} more…</li>}
              </ul>
            ) : renderValue(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResultRenderer({ result }: { result: AssistantResult }) {
  const rt = result.response_type;

  if (rt === "refusal") {
    return (
      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">{result.title}</p>
          <p className="text-xs text-amber-700 mt-1">{result.summary}</p>
        </div>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="space-y-4">
      {result.summary && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <p className="text-sm text-teal-800 leading-relaxed">{result.summary}</p>
        </div>
      )}

      {rt === "stats" && data && typeof data === "object" && !Array.isArray(data) && (
        <KpiCards data={data} />
      )}

      {rt === "list" && Array.isArray(data) && (
        <DataTable data={data} columns={result.columns} />
      )}

      {rt === "list" && !Array.isArray(data) && data && typeof data === "object" && (
        Object.entries(data).map(([key, val]) => (
          <div key={key} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{key.replace(/_/g, " ")}</p>
            {Array.isArray(val) ? (
              <DataTable data={val as any[]} />
            ) : (
              <div className="p-3 bg-bg-elevated rounded-lg text-xs font-mono">{JSON.stringify(val, null, 2)}</div>
            )}
          </div>
        ))
      )}

      {rt === "summary" && data && typeof data === "object" && !Array.isArray(data) && (
        <SummarySection data={data} />
      )}

      {rt === "summary" && Array.isArray(data) && (
        data.map((item, i) => (
          <div key={i} className="border border-border-subtle rounded-xl overflow-hidden">
            <div className="bg-bg-elevated px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
              Record {i + 1}
            </div>
            <div className="p-4">
              <SummarySection data={item} />
            </div>
          </div>
        ))
      )}

      {rt === "explanation" && Array.isArray(data) && (
        <div className="space-y-3">
          {data.map((item: any, i: number) => (
            <div key={i} className="border border-border-subtle rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-text-primary">{item.criterion || item.title || `Evidence ${i + 1}`}</p>
              <p className="text-xs text-text-secondary">{item.evidence_citation || item.reason || item.description || JSON.stringify(item)}</p>
            </div>
          ))}
        </div>
      )}

      {rt === "explanation" && data && !Array.isArray(data) && (
        <SummarySection data={data} />
      )}
    </div>
  );
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [steps]);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || status === "running") return;
    setStatus("running");
    setSteps([]);
    setResult(null);
    setError("");
    setExpandedSteps({});

    try {
      const res = await apiFetch("/api/assistant/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to start assistant run");
      const { run_id } = await res.json();
      setRunId(run_id);
    } catch {
      setError("Failed to start assistant. Please check the backend connection.");
      setStatus("failed");
    }
  };

  useEffect(() => {
    if (!runId || status !== "running") return;
    const es = new EventSource(apiPath(`/api/assistant/run/${runId}/stream`));

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          setStatus("failed");
          es.close();
          return;
        }
        if (data.final) {
          setStatus(data.status === "completed" ? "completed" : "failed");
          if (data.final_report) setResult(data.final_report as AssistantResult);
          es.close();
          return;
        }
        setSteps(prev => {
          const exists = prev.some(s => s.timestamp === data.timestamp && s.type === data.type && s.content === data.content);
          return exists ? prev : [...prev, data];
        });
      } catch {}
    };

    es.onerror = () => {
      es.close();
      if (!result) {
        apiFetch(`/api/assistant/run/${runId}`)
          .then(r => r.json())
          .then(d => {
            setSteps(d.steps ?? []);
            setStatus(d.status === "completed" ? "completed" : "failed");
            if (d.final_report) setResult(d.final_report as AssistantResult);
          })
          .catch(() => {
            setError("Connection lost.");
            setStatus("failed");
          });
      }
    };

    return () => es.close();
  }, [runId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const reset = () => {
    setQuery("");
    setRunId(null);
    setStatus("idle");
    setSteps([]);
    setResult(null);
    setError("");
    setExpandedSteps({});
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Clinical Assistant</h1>
          </div>
          <p className="text-xs text-text-secondary max-w-xl">
            Domain-specific enterprise AI agent. Query any clinical data, filter records, retrieve evidence, and run evaluations — all grounded in real data.
          </p>
        </div>
        {status !== "idle" && (
          <button
            onClick={reset}
            className="text-xs font-bold text-text-secondary hover:text-text-primary border border-border-subtle px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-elevated transition"
          >
            New Query
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="grid md:grid-cols-3 gap-4">
          {EXAMPLE_QUERIES.map(group => (
            <div key={group.category} className={`border rounded-xl p-4 space-y-2.5 bg-bg-surface ${group.color.split(" ").find(c => c.startsWith("border")) ?? "border-border-subtle"}`}>
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${group.color}`}>
                {group.icon}
                {group.category}
              </div>
              <ul className="space-y-1.5">
                {group.queries.slice(0, 5).map(q => (
                  <li key={q}>
                    <button
                      onClick={() => setQuery(q)}
                      className="flex items-center gap-1.5 text-left w-full text-xs text-text-secondary hover:text-text-primary group"
                    >
                      <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition text-teal-500" />
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-2xs">
        <div className="flex gap-3 items-end">
          <div className="flex-grow relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Ask anything about your clinical data… e.g. 'Show patients with NSCLC older than 55' or 'Summarize John Williams'"
              disabled={status === "running"}
              className="w-full resize-none text-sm border border-border-subtle rounded-xl px-4 py-3 bg-bg-elevated text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60 transition"
              autoFocus
            />
            <span className="absolute bottom-3 right-4 text-[10px] text-text-secondary select-none">
              {status !== "running" ? "Enter ↵ to submit" : "Running…"}
            </span>
          </div>
          <button
            id="assistant-submit"
            onClick={handleSubmit}
            disabled={!query.trim() || status === "running"}
            className="h-12 w-12 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl flex items-center justify-center transition shadow-sm shrink-0"
          >
            {status === "running" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === "running" ? "bg-teal-400 animate-pulse" : status === "completed" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {status === "running" ? "Executing…" : status === "completed" ? "Completed" : "Failed"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
            </div>
            <div ref={timelineRef} className="p-4 space-y-2 max-h-80 overflow-y-auto font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {steps.map((step, idx) => {
                  const isObs = step.type === "observation";
                  const toolName = step.tool_called;
                  const icon = getToolIcon(toolName);
                  const isExpanded = !!expandedSteps[idx];

                  return (
                    <motion.div
                      key={`${step.timestamp}-${idx}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg border px-3 py-2 ${isObs ? "bg-slate-900 border-slate-800" : "bg-slate-900/50 border-slate-800/50"}`}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => setExpandedSteps(p => ({ ...p, [idx]: !p[idx] }))}
                      >
                        <span className={`flex items-center justify-center w-5 h-5 rounded ${isObs ? "text-teal-400" : "text-slate-400"}`}>
                          {isObs ? icon : <Brain className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-slate-300 flex-grow truncate">
                          {isObs && toolName ? (
                            <><span className="text-teal-400">{toolName}</span> — {step.content}</>
                          ) : step.content}
                        </span>
                        {step.duration_ms !== undefined && (
                          <span className="text-slate-600 shrink-0">{step.duration_ms}ms</span>
                        )}
                        {(step.tool_output || (step.type === "thought" && step.content.length > 80)) && (
                          isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                      </div>
                      {isExpanded && step.tool_output && (
                        <div className="mt-2 pl-7 text-slate-400 bg-slate-950/60 rounded p-2 overflow-x-auto max-h-48">
                          <pre className="whitespace-pre-wrap break-all text-[10px]">
                            {JSON.stringify(step.tool_output, null, 2).slice(0, 2000)}
                            {JSON.stringify(step.tool_output).length > 2000 ? "\n… (truncated)" : ""}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-bg-elevated">
              <div className="flex items-center gap-2.5">
                {result.response_type === "refusal" ? (
                  <XCircle className="w-4.5 h-4.5 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                )}
                <div>
                  <p className="text-sm font-bold text-text-primary">{result.title}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">
                    {result.response_type === "stats" && <><BarChart2 className="w-3 h-3 inline mr-1" />Statistics</>}
                    {result.response_type === "list" && <><Table2 className="w-3 h-3 inline mr-1" />List</>}
                    {result.response_type === "summary" && <><BookOpen className="w-3 h-3 inline mr-1" />Summary</>}
                    {result.response_type === "explanation" && <><FileText className="w-3 h-3 inline mr-1" />Explanation</>}
                    {result.response_type === "refusal" && <><AlertTriangle className="w-3 h-3 inline mr-1" />Out of Scope</>}
                  </p>
                </div>
              </div>
              {result.response_type !== "refusal" && runId && (
                <button
                  onClick={() => navigate(`/workspace/run/${runId}`)}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-200 hover:border-teal-300 px-2.5 py-1.5 rounded-lg transition bg-teal-50"
                >
                  Full Timeline <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="p-5">
              <ResultRenderer result={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
