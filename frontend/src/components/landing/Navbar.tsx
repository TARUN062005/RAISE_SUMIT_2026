import { Link } from "react-router-dom";
import { ArrowRight, Moon, ShieldCheck, Sun } from "lucide-react";

type SectionLink = { id: string; label: string };

export function Navbar({
  theme,
  setTheme,
  activeSection,
  sections,
}: {
  theme: string;
  setTheme: (theme: string) => void;
  activeSection: string;
  sections: SectionLink[];
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-base/85 border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="bg-teal-50 border border-teal-200 text-teal-700 p-2 rounded-2xl shadow-2xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-text-primary">AURA Clinical Agent</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary">Enterprise Match Portal</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-full p-1 shadow-2xs">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                  isActive ? "bg-teal-600 text-white shadow-xs" : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                {section.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-xl border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition shadow-2xs"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/workspace/dashboard"
            className="inline-flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-bg-surface font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            Access Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}