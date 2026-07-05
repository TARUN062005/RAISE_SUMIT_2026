import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FolderHeart, Loader2, AlertCircle, CheckCircle2,
  Trash2, Archive, Copy, Download, Eye
} from "lucide-react";
import { apiFetch } from "../lib/api";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    apiFetch("/api/agent/runs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load clinical agent runs");
        return res.json();
      })
      .then((data: AgentRun[]) => {
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

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = (visibleIds: string[], e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(new Set(visibleIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete Clinical Report",
      message: "Are you sure you want to permanently delete this clinical evaluation report? This action cannot be undone.",
      onConfirm: () => {
        setRuns(prev => prev.filter(r => r.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Evaluation report ${id.slice(0, 8)}... was successfully deleted.`);
      }
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Batch Delete Reports",
      message: `Are you sure you want to permanently delete the ${selectedIds.size} selected clinical evaluation reports? This action cannot be undone.`,
      onConfirm: () => {
        setRuns(prev => prev.filter(r => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Successfully deleted ${selectedIds.size} clinical evaluation reports.`);
      }
    });
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

  const handleExportPDF = (_id: string, e: React.MouseEvent) => {
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
  const visibleIds = visibleRuns.map(r => r.id);
  const allSelected = visibleRuns.length > 0 && visibleRuns.every(r => selectedIds.has(r.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 pulse-teal">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Confirm Modal Overlay */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-text-primary">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-bold text-text-primary hover:bg-bg-elevated transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-border-subtle bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-white p-6 md:p-7 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-100">
              <FolderHeart className="w-3.5 h-3.5" /> Report Archive
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Agent Evaluation Reports</h2>
            <p className="text-sm text-slate-200/90 max-w-2xl">Audit logs, telemetry streams, and clinical evidence records with a cleaner archival surface.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="px-3.5 py-1.5 text-xs font-extrabold rounded-lg bg-rose-650 hover:bg-rose-700 text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.size})
              </button>
            )}

            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                showArchived 
                  ? "bg-teal-50 text-teal-700 border-teal-200" 
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {showArchived ? "Viewing Archived" : "Show Archived"}
            </button>
            
            <div className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 backdrop-blur">
              <FolderHeart className="w-3.5 h-3.5" /> {visibleRuns.length} Reports
            </div>
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
        <div className="text-center py-20 bg-bg-surface border border-border-subtle rounded-[1.75rem] text-text-secondary italic text-xs shadow-2xs">
          {showArchived 
            ? "No archived evaluation reports found." 
            : "No active evaluation reports found. Initiate an evaluation in the Eligibility Agent!"}
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-[1.75rem] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-extrabold uppercase tracking-wider text-text-secondary bg-bg-base/80">
                  <th className="py-3.5 px-5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(visibleIds, e)}
                      className="rounded border-slate-350 text-teal-600 focus:ring-teal-500/20 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
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
                {visibleRuns.map((run) => {
                  const isSelected = selectedIds.has(run.id);
                  return (
                    <tr 
                      key={run.id} 
                      className={`transition-colors group cursor-pointer ${
                        isSelected 
                          ? "bg-teal-50/20 hover:bg-teal-50/30" 
                          : "hover:bg-slate-50/80"
                      }`}
                      onClick={() => navigate(`/workspace/run/${run.id}`)}
                    >
                      <td className="py-4 px-5 text-center" onClick={(e) => toggleSelect(run.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled state toggled by cell onClick
                          className="rounded border-slate-350 text-teal-600 focus:ring-teal-500/20 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
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
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/workspace/run/${run.id}`)}
                            className="inline-flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded-md transition shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
