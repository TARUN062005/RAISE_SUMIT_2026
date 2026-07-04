import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FolderHeart, Loader2, AlertCircle, Activity, 
  Trash2, Archive, Copy, Download, Eye, RotateCw
} from "lucide-react";

interface AgentRun {
  id: string;
  patient_id: string;
  trial_id: string;
  status: string;
  created_at: string;
  total_duration_ms?: number;
  archived?: boolean;
}

export default function ReportsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    fetch("/api/agent/runs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load clinical agent runs");
        return res.json();
      })
      .then((data: AgentRun[]) => {
        // Initialize local fields
        const initialized = data.map(r => ({ ...r, archived: false }));
        setRuns(initialized);
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this clinical report?")) {
      setRuns(runs.filter(r => r.id !== id));
      showToast(`Evaluation run ${id.slice(0, 8)}... was successfully deleted.`);
    }
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRuns(runs.map(r => r.id === id ? { ...r, archived: !r.archived } : r));
    const run = runs.find(r => r.id === id);
    if (run) {
      showToast(
        run.archived 
          ? `Run ${id.slice(0, 8)}... was restored from archive.` 
          : `Run ${id.slice(0, 8)}... was archived.`
      );
    }
  };

  const handleDuplicate = (patientId: string, trialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/workspace/evaluate?patient=${patientId}&trial=${trialId}`);
  };

  const handleExportPDF = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const isCompleted = status === "completed";
    const isFailed = status === "failed";
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
        isCompleted 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
          : isFailed
            ? "bg-rose-50 text-rose-700 border-rose-200/50"
            : "bg-amber-50 text-amber-700 border-amber-200/50 animate-pulse"
      }`}>
        <span className={`w-1 h-1 rounded-full ${
          isCompleted ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-amber-500"
        }`} />
        {status}
      </span>
    );
  };

  const visibleRuns = runs.filter(r => showArchived ? r.archived : !r.archived);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 pulse-teal">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Agent Evaluation Reports</h2>
          <p className="text-xs text-slate-500">Audit logs, live telemetry streams, and clinical evidence matching runs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              showArchived 
                ? "bg-teal-50 text-teal-700 border-teal-200" 
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {showArchived ? "Viewing Archived" : "Show Archived"}
          </button>
          
          <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 shadow-2xs">
            <FolderHeart className="w-3.5 h-3.5" /> {visibleRuns.length} Reports
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Retrieving audit records...</span>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-750 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Failed to retrieve agent runs</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : visibleRuns.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl text-slate-400 italic text-xs shadow-2xs">
          {showArchived 
            ? "No archived evaluation reports found." 
            : "No active evaluation reports found. Initiate an evaluation in the Eligibility Agent!"}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-5">Evaluation Run ID</th>
                  <th className="py-3.5 px-5">Patient ID</th>
                  <th className="py-3.5 px-5">Trial ID</th>
                  <th className="py-3.5 px-5 w-32">Run Status</th>
                  <th className="py-3.5 px-5 w-24">Exec Time</th>
                  <th className="py-3.5 px-5 w-44">Created At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {visibleRuns.map((run) => (
                  <tr 
                    key={run.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/workspace/run/${run.id}`)}
                  >
                    <td className="py-4 px-5 font-bold text-slate-800">
                      <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[9px] border border-slate-200 text-slate-550">
                        {run.id}
                      </code>
                    </td>
                    <td className="py-4 px-5">
                      <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[9px] border border-slate-200 text-slate-550 font-bold">
                        {run.patient_id}
                      </code>
                    </td>
                    <td className="py-4 px-5 font-bold text-teal-650">{run.trial_id}</td>
                    <td className="py-4 px-5">{getStatusBadge(run.status)}</td>
                    <td className="py-4 px-5 text-slate-700 font-semibold">{formatDuration(run.total_duration_ms)}</td>
                    <td className="py-4 px-5 text-slate-500">{formatDate(run.created_at)}</td>
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleArchive(run.id, e)}
                          title={run.archived ? "Restore Report" : "Archive Report"}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(run.patient_id, run.trial_id, e)}
                          title="Duplicate Evaluation"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExportPDF(run.id, e)}
                          title="Export PDF"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(run.id, e)}
                          title="Delete Report"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/workspace/run/${run.id}`)}
                          className="inline-flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded-md transition shadow-2xs"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
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

// Simple CSS helper for toast pulse glow
const style = document.createElement("style");
style.innerHTML = `
.pulse-teal {
  box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
  animation: pulse-teal-glow 2s infinite;
}
@keyframes pulse-teal-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0);
  }
}
`;
document.head.appendChild(style);
