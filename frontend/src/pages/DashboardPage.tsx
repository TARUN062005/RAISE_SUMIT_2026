import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, ClipboardList, FolderHeart, 
  Play, Activity, ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2
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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-200">Hospital Coordinator Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Real-time telemetry and overview of clinical eligibility agent pipelines</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold">Loading dashboard metrics...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Dashboard Error</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/patients"
              className="bg-[#0f1422]/60 hover:bg-[#121828]/80 border border-slate-800/80 hover:border-indigo-500/35 rounded-2xl p-6 transition duration-200 group flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {stats.patientsCount}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Patients Enrolled
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
            </Link>

            <Link 
              to="/trials"
              className="bg-[#0f1422]/60 hover:bg-[#121828]/80 border border-slate-800/80 hover:border-indigo-500/35 rounded-2xl p-6 transition duration-200 group flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {stats.trialsCount}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Trial Protocols
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <ClipboardList className="w-6 h-6" />
              </div>
            </Link>

            <Link 
              to="/reports"
              className="bg-[#0f1422]/60 hover:bg-[#121828]/80 border border-slate-800/80 hover:border-indigo-500/35 rounded-2xl p-6 transition duration-200 group flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {stats.runsCount}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Agent Evaluations
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <FolderHeart className="w-6 h-6" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 lg:col-span-1 h-fit">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/evaluate"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                >
                  <Play className="w-4 h-4" /> Start Match Evaluation
                </Link>
                <Link
                  to="/patients"
                  className="w-full bg-[#161c2e] hover:bg-[#1d243a] border border-slate-800 text-slate-300 text-xs font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> View Patient Directory
                </Link>
              </div>
            </div>

            {/* Recent Evaluations */}
            <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Recent Evaluations</h3>
                <Link to="/reports" className="text-indigo-400 hover:text-indigo-350 text-xs font-bold flex items-center gap-1 group">
                  View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {stats.recentRuns.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl text-slate-500 italic text-xs">
                  No patient evaluations logged yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-850">
                  {stats.recentRuns.map((run) => (
                    <div key={run.id} className="py-3 flex items-center justify-between text-xs group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-900/60 px-1.5 py-0.5 rounded font-mono text-[9px] border border-slate-850 text-slate-400">
                            {run.id.slice(0, 8)}...
                          </code>
                          <span className="font-bold text-slate-350">{run.trial_id}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Patient: <span className="font-semibold text-slate-400">{run.patient_id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {run.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Success
                          </span>
                        ) : run.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <XCircle className="w-3 h-3 text-rose-400" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                            <Activity className="w-3 h-3 text-amber-400 animate-spin" /> Running
                          </span>
                        )}
                        <button
                          onClick={() => navigate(`/run/${run.id}`)}
                          className="bg-[#161c2e] hover:bg-[#1d243a] border border-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition duration-200"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
