import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation, Outlet } from "react-router-dom";
import { 
  ShieldCheck, LayoutDashboard, Users, 
  ClipboardList, FolderHeart, Info, FlaskConical, ArrowLeft, Sun, Moon, Bot
} from "lucide-react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluatePage from "./pages/EvaluatePage";
import PatientsPage from "./pages/PatientsPage";
import TrialsPage from "./pages/TrialsPage";
import ReportsPage from "./pages/ReportsPage";
import RunPage from "./pages/RunPage";
import AssistantPage from "./pages/AssistantPage";
import { apiFetch } from "./lib/api";

function WorkspaceLayout({ userProfile, theme, setTheme }: { userProfile: any; theme: string; setTheme: (theme: string) => void }) {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== "/workspace/dashboard" && location.pathname.startsWith(path));
    return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 group ${
      isActive 
        ? "bg-teal-600 text-white shadow-xs" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "RS";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatRole = (role?: string) => {
    if (!role) return "Research Coordinator";
    return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans">
      <header className="h-14 bg-bg-surface border-b border-border-subtle sticky top-0 z-40 px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-teal-50 border border-teal-200 text-teal-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-text-primary tracking-tight">
                AURA Clinical Agent
              </h1>
              <p className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">Enterprise Match Portal</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-1.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition shadow-2xs flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2.5 bg-bg-elevated border border-border-subtle px-3 py-1.5 rounded-lg">
            <div className="w-6.5 h-6.5 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              {getInitials(userProfile?.name)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-[10px] text-text-primary leading-tight">{userProfile ? userProfile.name : "Research Staff"}</p>
              <p className="text-[8px] text-text-secondary font-semibold">{formatRole(userProfile?.role)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main shell: Sidebar + Workspace Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-56 bg-slate-900 text-slate-350 p-4 space-y-6 flex flex-col justify-between shrink-0">
          <div className="space-y-5">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-2">Navigation</div>
            <nav className="space-y-1.5">
              <Link to="/workspace/assistant" className={getLinkClass("/workspace/assistant")}>
                <Bot className="w-4 h-4" />
                <span>Clinical Assistant</span>
              </Link>
              <Link to="/workspace/dashboard" className={getLinkClass("/workspace/dashboard")}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/workspace/evaluate" className={getLinkClass("/workspace/evaluate")}>
                <FlaskConical className="w-4 h-4" />
                <span>Eligibility Agent</span>
              </Link>
              <Link to="/workspace/patients" className={getLinkClass("/workspace/patients")}>
                <Users className="w-4 h-4" />
                <span>Patients</span>
              </Link>
              <Link to="/workspace/trials" className={getLinkClass("/workspace/trials")}>
                <ClipboardList className="w-4 h-4" />
                <span>Trials</span>
              </Link>
              <Link to="/workspace/reports" className={getLinkClass("/workspace/reports")}>
                <FolderHeart className="w-4 h-4" />
                <span>Reports</span>
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2">
              <div className="flex gap-1.5 text-teal-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Hackathon Mode</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Evaluating patient health profiles against registered FDA trial criteria locally.
              </p>
            </div>
            
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-1 text-[10px] text-slate-450 hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Landing Page
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-grow p-6 md:p-8 overflow-y-auto bg-bg-base">
          <Outlet />
        </main>
      </div>

      <footer className="bg-bg-surface border-t border-border-subtle py-3 px-8 flex justify-between items-center text-[9px] text-text-secondary font-bold uppercase tracking-wider shadow-2xs">
        <span>AURA Clinical Agent v1.0.0</span>
        <span>RAISE Summit Hackathon 2026</span>
      </footer>
    </div>
  );
}

export default function App() {
  const [userProfile, setUserProfile] = useState<{ name: string; role: string } | null>(null);
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  useEffect(() => {
    apiFetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUserProfile(data))
      .catch(() => console.log("Mock user profile resolution failed. Using defaults."));
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} setTheme={setTheme} />} />
      <Route path="/workspace" element={<WorkspaceLayout userProfile={userProfile} theme={theme} setTheme={setTheme} />}>
        <Route index element={<Navigate to="/workspace/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="evaluate" element={<EvaluatePage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="trials" element={<TrialsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="run/:runId" element={<RunPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
