import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, LayoutDashboard, Users, 
  FlaskConical, ClipboardList, FolderHeart, Info
} from "lucide-react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluatePage from "./pages/EvaluatePage";
import PatientsPage from "./pages/PatientsPage";
import TrialsPage from "./pages/TrialsPage";
import ReportsPage from "./pages/ReportsPage";
import RunPage from "./pages/RunPage";

export default function App() {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<{ name: string; role: string } | null>(null);
  
  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUserProfile(data))
      .catch(() => console.log("Mock user profile resolution failed. Using defaults."));
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
      isActive 
        ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20" 
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    }`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatRole = (role?: string) => {
    if (!role) return "Staff User";
    return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
      <header className="h-20 bg-[#0f1422]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 p-2 rounded-xl shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                AURA Clinical Agent
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Enterprise Protocol Matching</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#131929] border border-slate-800/80 px-4 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {getInitials(userProfile?.name)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-xs text-slate-200">{userProfile ? userProfile.name : "Staff Member"}</p>
              <p className="text-[10px] text-slate-400 font-medium">{formatRole(userProfile?.role)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-[#0c101d] border-r border-slate-800/80 p-6 space-y-8 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-2">Navigation</div>
            <nav className="space-y-2">
              <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/evaluate" className={getLinkClass("/evaluate")}>
                <FlaskConical className="w-5 h-5" />
                <span>Eligibility Agent</span>
              </Link>
              <Link to="/patients" className={getLinkClass("/patients")}>
                <Users className="w-5 h-5" />
                <span>Patients</span>
              </Link>
              <Link to="/trials" className={getLinkClass("/trials")}>
                <ClipboardList className="w-5 h-5" />
                <span>Trials</span>
              </Link>
              <Link to="/reports" className={getLinkClass("/reports")}>
                <FolderHeart className="w-5 h-5" />
                <span>Reports</span>
              </Link>
            </nav>
          </div>

          <div className="bg-[#121828]/60 border border-slate-800/60 rounded-xl p-4 space-y-3">
            <div className="flex gap-2 text-indigo-400">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase">Hackathon Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Evaluating patient health profiles against registered FDA trial criteria locally.
            </p>
          </div>
        </aside>

        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/trials" element={<TrialsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/run/:runId" element={<RunPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <footer className="bg-[#0b0f19] border-t border-slate-800/80 py-4 px-8 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>AURA Clinical Agent v1.0.0</span>
        <span>RAISE Summit Hackathon 2026</span>
      </footer>
    </div>
  );
}
