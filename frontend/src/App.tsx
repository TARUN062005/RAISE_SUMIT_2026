import { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, LayoutDashboard, Users, 
  FlaskConical, ClipboardList, Bell, Search,
  FolderHeart, Info
} from "lucide-react";
import EvaluatePage from "./pages/EvaluatePage";
import RunPage from "./pages/RunPage";

export default function App() {
  const location = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
      isActive 
        ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20" 
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    }`;
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
      <header className="h-20 bg-[#0f1422]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 p-2 rounded-xl shadow-inner animate-pulse">
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
          <div className="relative hidden md:block w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search patients, protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161c2e] border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200"
            />
          </div>

          <button 
            onClick={() => setShowNotification(!showNotification)}
            className="relative p-2 bg-[#161c2e] border border-slate-800/80 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          <div className="flex items-center gap-3 bg-[#131929] border border-slate-800/80 px-4 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              SC
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-xs text-slate-200">Dr. Sarah Chen</p>
              <p className="text-[10px] text-slate-400 font-medium">Research Coordinator</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-[#0c101d] border-r border-slate-800/80 p-6 space-y-8 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-2">Navigation</div>
            <nav className="space-y-2">
              <Link to="/evaluate" className={getLinkClass("/evaluate")}>
                <FlaskConical className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Eligibility Agent</span>
              </Link>
              <div className="text-slate-400 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
              <div className="text-slate-400 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed">
                <Users className="w-5 h-5" />
                <span>Patients</span>
              </div>
              <div className="text-slate-400 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed">
                <ClipboardList className="w-5 h-5" />
                <span>Trials</span>
              </div>
              <div className="text-slate-400 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed">
                <FolderHeart className="w-5 h-5" />
                <span>Reports</span>
              </div>
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
            <Route path="/" element={<Navigate to="/evaluate" replace />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
            <Route path="/run/:runId" element={<RunPage />} />
            <Route path="*" element={<Navigate to="/evaluate" replace />} />
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
