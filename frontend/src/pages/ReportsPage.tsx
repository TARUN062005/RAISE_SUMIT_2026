import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderHeart, Loader2, AlertCircle, Activity } from "lucide-react";

interface AgentRun {
  id: string;
  patient_id: string;
  trial_id: string;
  status: string;
  created_at: string;
  total_duration_ms?: number;
}

export default function ReportsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/agent/runs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load clinical agent runs");
        return res.json();
      })
      .then((data) => {
        setRuns(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms === null) return "N/A";
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const isCompleted = status === "completed";
    const isFailed = status === "failed";
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isCompleted 
          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          : isFailed
            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          isCompleted ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-amber-500"
        }`} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-200">Autonomous Agent Evaluations</h2>
          <p className="text-xs text-slate-500 mt-1">Audit logs, live telemetry streams, and clinical evidence matching runs</p>
        </div>
        <div className="bg-[#121626]/50 border border-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <FolderHeart className="w-3.5 h-3.5" /> {runs.length} Runs Logged
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold">Retrieving agent run records...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Failed to retrieve agent runs</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl text-slate-500 italic text-xs">
          No agent evaluation runs logged yet. Initiate an evaluation in the Workspace!
        </div>
      ) : (
        <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#121828]/40">
                  <th className="py-4 px-6">Evaluation Run ID</th>
                  <th className="py-4 px-6">Patient ID</th>
                  <th className="py-4 px-6">Trial ID</th>
                  <th className="py-4 px-6">Run Status</th>
                  <th className="py-4 px-6">Execution time</th>
                  <th className="py-4 px-6">Created At</th>
                  <th className="py-4 px-6 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/20 transition duration-150 group">
                    <td className="py-4 px-6 font-bold text-slate-200">
                      <code className="bg-slate-900/60 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-850 text-slate-400">
                        {run.id}
                      </code>
                    </td>
                    <td className="py-4 px-6">
                      <code className="bg-slate-900/60 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-850 text-slate-400">
                        {run.patient_id}
                      </code>
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-400">{run.trial_id}</td>
                    <td className="py-4 px-6">{getStatusBadge(run.status)}</td>
                    <td className="py-4 px-6 text-slate-400 font-semibold">{formatDuration(run.total_duration_ms)}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{formatDate(run.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/run/${run.id}`)}
                        className="inline-flex items-center gap-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 group-hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition duration-200"
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> Stream
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
