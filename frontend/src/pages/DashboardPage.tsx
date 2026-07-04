import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, ClipboardList, FolderHeart, 
  Play, Activity, ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2, CheckSquare
} from "lucide-react";

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
          fetch("/api/patients"),
          fetch("/api/trials"),
          fetch("/api/agent/runs").then(r => r.ok ? r.json() : [])
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
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Clinical Coordinator Dashboard</h2>
        <p className="text-xs text-slate-500">Real-time telemetry and overview of clinical eligibility matching pipelines</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/workspace/patients"
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-950 group-hover:text-teal-600 transition-colors">
                  {stats.patientsCount}
                </div>
                <div className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                  Patients Enrolled
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <Users className="w-5 h-5" />
              </div>
            </Link>

            <Link 
              to="/workspace/trials"
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-950 group-hover:text-teal-600 transition-colors">
                  {stats.trialsCount}
                </div>
                <div className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                  Trial Protocols
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <ClipboardList className="w-5 h-5" />
              </div>
            </Link>

            <Link 
              to="/workspace/reports"
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 transition duration-200 group flex items-center justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-950 group-hover:text-teal-600 transition-colors">
                  {stats.runsCount}
                </div>
                <div className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                  Evaluations Logged
                </div>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
                <FolderHeart className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3 Span) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Evaluations */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" /> Recent Evaluations
                  </h3>
                  <Link to="/workspace/reports" className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center gap-0.5 group">
                    View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {stats.recentRuns.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg text-slate-400 italic text-xs">
                    No patient evaluations logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stats.recentRuns.map((run) => (
                      <div key={run.id} className="py-3 flex items-center justify-between text-xs group first:pt-0 last:pb-0">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{run.trial_id}</span>
                            <span className="text-[9px] text-slate-450 font-mono">
                              ({run.id.slice(0, 8)}...)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Patient: <span className="font-semibold text-slate-700">{run.patient_id}</span>
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
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition duration-150"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocol Overview Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-teal-600" /> Key Trial Registries
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-150 text-teal-700 px-2 py-0.5 rounded-md">PHASE II</span>
                      <span className="text-[10px] text-emerald-600 font-bold">RECRUITING</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">NCT07218601: E-nose Lung Cancer Diagnostics</h4>
                    <p className="text-[10px] text-slate-550 leading-relaxed">
                      Assesses pathological responses to neoadjuvant therapy using electronic nose breathprinting.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-150 text-teal-700 px-2 py-0.5 rounded-md">PHASE III</span>
                      <span className="text-[10px] text-emerald-600 font-bold">RECRUITING</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">NCT04561234: Osimertinib Adjuvant Trial</h4>
                    <p className="text-[10px] text-slate-550 leading-relaxed">
                      Evaluates targeted EGFR-mutated non-small cell lung cancer outcomes following complete surgical resection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1/3 Span) */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
                <div className="space-y-2.5">
                  <Link
                    to="/workspace/evaluate"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Play className="w-4 h-4" /> Start Match Evaluation
                  </Link>
                  <Link
                    to="/workspace/patients"
                    className="w-full bg-white hover:bg-slate-50 border border-slate-350 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" /> View Patient Directory
                  </Link>
                </div>
              </div>

              {/* Pending Action Items */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-650" /> Coordinator Checklist
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-[11px]">Seeded Demographics</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Patient John Williams initialized in database.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-[11px]">Collect ECG Reports</p>
                      <p className="text-[10px] text-slate-500 leading-tight">ECG document missing for John Williams.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-[11px]">Renew Expired Vitals</p>
                      <p className="text-[10px] text-slate-500 leading-tight">CBC and LFT lab updates required (14 months old).</p>
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
