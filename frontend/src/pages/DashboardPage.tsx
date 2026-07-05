import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, ClipboardList, FolderHeart, 
  Play, Activity, ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2, CheckSquare
} from "lucide-react";
import { apiFetch } from "../lib/api";

interface DashboardStats {
  patientsCount: number;
  trialsCount: number;
  runsCount: number;
  recentRuns: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patientsCount: 0,
    trialsCount: 0,
    runsCount: 0,
    recentRuns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, trialsRes, runsRes] = await Promise.all([
          apiFetch("/api/patients"),
          apiFetch("/api/trials"),
          apiFetch("/api/agent/runs").then(r => r.ok ? r.json() : [])
        ]);
        
        if (!patientsRes.ok || !trialsRes.ok) {
          throw new Error("Failed to load dashboard metrics");
        }
        
        const patientsData = await patientsRes.json();
        const trialsData = await trialsRes.json();
        
        setStats({
          patientsCount: patientsData.length,
          trialsCount: trialsData.length,
          runsCount: runsRes.length,
          recentRuns: runsRes.slice(0, 5)
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="rounded-[2rem] border border-border-subtle bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 text-white p-6 md:p-7 shadow-[0_24px_80px_rgba(15,118,110,0.22)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-50">
              <Activity className="w-3.5 h-3.5" /> Operations Control Center
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Clinical Coordinator Dashboard</h2>
            <p className="text-sm text-teal-50/90 max-w-2xl">
              Real-time telemetry, active evaluation throughput, and the shortest path into patient and trial review.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur">
              <div className="text-2xl font-black">{stats.patientsCount}</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-teal-50/80">Patients</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur">
              <div className="text-2xl font-black">{stats.trialsCount}</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-teal-50/80">Trials</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur">
              <div className="text-2xl font-black">{stats.runsCount}</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-teal-50/80">Runs</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading dashboard telemetry...</span>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-750 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Dashboard Error</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/workspace/patients"
              className="bg-bg-surface border border-border-subtle hover:border-accent rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-text-primary group-hover:text-accent transition-colors">
                  {stats.patientsCount}
                </div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  Patients Enrolled
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <Users className="w-5 h-5" />
              </div>
            </Link>

            <Link 
              to="/workspace/trials"
              className="bg-bg-surface border border-border-subtle hover:border-accent rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-text-primary group-hover:text-accent transition-colors">
                  {stats.trialsCount}
                </div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  Trial Protocols
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <ClipboardList className="w-5 h-5" />
              </div>
            </Link>

            <Link 
              to="/workspace/reports"
              className="bg-bg-surface border border-border-subtle hover:border-accent rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-text-primary group-hover:text-accent transition-colors">
                  {stats.runsCount}
                </div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  Evaluations Logged
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <FolderHeart className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" /> Recent Evaluations
                  </h3>
                  <Link to="/workspace/reports" className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center gap-0.5 group">
                    View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {stats.recentRuns.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border-subtle rounded-lg text-text-secondary italic text-xs">
                    No patient evaluations logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {stats.recentRuns.map((run) => (
                      <div key={run.id} className="py-3 flex items-center justify-between text-xs group first:pt-0 last:pb-0">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">{run.trial_id}</span>
                            <span className="text-[9px] text-text-secondary font-mono">
                              ({run.id.slice(0, 8)}...)
                            </span>
                          </div>
                          <div className="text-[10px] text-text-secondary">
                            Patient: <span className="font-semibold text-text-primary">{run.patient_id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {run.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
                            </span>
                          ) : run.status === "failed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200/50">
                              <XCircle className="w-3 h-3 text-rose-600" /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200/50 animate-pulse">
                              <Activity className="w-3 h-3 text-amber-600" /> Running
                            </span>
                          )}
                          <button
                            onClick={() => navigate(`/workspace/run/${run.id}`)}
                            className="bg-bg-elevated hover:bg-bg-base border border-border-subtle text-text-secondary hover:text-text-primary font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition duration-150 cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-teal-600" /> Key Trial Registries
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-base border border-border-subtle rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-150 text-teal-700 px-2 py-0.5 rounded-md">PHASE II</span>
                      <span className="text-[10px] text-emerald-605 font-bold">RECRUITING</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-text-primary leading-tight">NCT07218601: E-nose Lung Cancer Diagnostics</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Assesses pathological responses to neoadjuvant therapy using electronic nose breathprinting.
                    </p>
                  </div>
                  <div className="bg-bg-base border border-border-subtle rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-150 text-teal-700 px-2 py-0.5 rounded-md">PHASE III</span>
                      <span className="text-[10px] text-emerald-605 font-bold">RECRUITING</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-text-primary leading-tight">NCT04561234: Osimertinib Adjuvant Trial</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Evaluates targeted EGFR-mutated non-small cell lung cancer outcomes following complete surgical resection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Quick Actions</h3>
                <div className="space-y-2.5">
                  <Link
                    to="/workspace/evaluate"
                    className="w-full bg-accent hover:bg-accent-contrast text-white text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Play className="w-4 h-4" /> Start Match Evaluation
                  </Link>
                  <Link
                    to="/workspace/patients"
                    className="w-full bg-bg-surface hover:bg-bg-base border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" /> View Patient Directory
                  </Link>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-605" /> Coordinator Checklist
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-border-subtle" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-text-primary text-[11px]">Seeded Demographics</p>
                      <p className="text-[10px] text-text-secondary leading-tight">Patient John Williams initialized in database.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-border-subtle" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-text-primary text-[11px]">Collect ECG Reports</p>
                      <p className="text-[10px] text-text-secondary leading-tight">ECG document missing for John Williams.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-border-subtle" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-text-primary text-[11px]">Renew Expired Vitals</p>
                      <p className="text-[10px] text-text-secondary leading-tight">CBC and LFT lab updates required (14 months old).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
