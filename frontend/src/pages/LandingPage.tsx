import { Link } from "react-router-dom";
import { 
  ShieldCheck, Compass, AlertTriangle, ArrowRight, CheckCircle2,
  Cpu, Database, Shield, Zap, Check, Sun, Moon,
  Workflow, AlertOctagon, Server
} from "lucide-react";

interface LandingPageProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export default function LandingPage({ theme, setTheme }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans transition-colors duration-200">
      <header className="h-16 bg-bg-surface border-b border-border-subtle sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-teal-50 border border-teal-200 text-teal-600 p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-text-primary tracking-tight">
              AURA Clinical Agent
            </h1>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Enterprise Match Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-1.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition shadow-2xs flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link 
            to="/workspace/dashboard" 
            className="inline-flex items-center gap-1.5 bg-text-primary hover:bg-text-secondary text-bg-surface font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            Access Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-250 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
            <Shield className="w-3 h-3 text-teal-600" /> Enterprise Healthcare Protocol Matching
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
            Autonomous Clinical Trial Eligibility Matching Agent
          </h1>
          
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
            Evaluate complex EHR patient diagnostics against registered FDA trial criteria in real time. Powered by autonomous ReAct reasoning.
          </p>

          <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-text-secondary font-medium">
            <div className="flex items-center gap-1.5 bg-bg-surface px-3 py-1.5 rounded-lg border border-border-subtle shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Not a Diagnosis Tool</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-surface px-3 py-1.5 rounded-lg border border-border-subtle shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Not a Chatbot</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-surface px-3 py-1.5 rounded-lg border border-border-subtle shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-teal-600" />
              <span>No Medical Advice</span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Link 
              to="/workspace/dashboard" 
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-contrast text-white font-bold text-sm px-6 py-3 rounded-lg transition shadow-xs group"
            >
              Access Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-md max-w-md w-full relative">
            <img 
              src="/hospital_research_illustration.png" 
              alt="Medical Research and Clinical Agent Illustration" 
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute -bottom-4 -left-4 bg-text-primary text-bg-surface text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Vultr LLM Active
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-surface border-y border-border-subtle py-16 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">The Manual Matching Crisis</h2>
            <p className="text-xs text-text-secondary">Traditional workflow is slow, error-prone, and compromises clinical trial enrollment rates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-base border border-border-subtle rounded-xl p-6 space-y-4 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-text-primary text-sm">Time Sink Constraints</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Clinical coordinators spend up to 45 minutes manually auditing a single patient record across multiple EHR tabs, scans, and PDFs.
              </p>
            </div>

            <div className="bg-bg-base border border-border-subtle rounded-xl p-6 space-y-4 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-text-primary text-sm">Compliance Risk</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Missing a single drug exclusion or matching based on an expired blood lab test compromises patient safety and compliance.
              </p>
            </div>

            <div className="bg-bg-base border border-border-subtle rounded-xl p-6 space-y-4 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-text-primary text-sm">Research Delays</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Slow candidate identification delays trials, stalling the delivery of critical new therapeutic options to patients.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-bold text-teal-700 uppercase tracking-wide">
            <Workflow className="w-3 h-3" /> Execution Sequence
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Autonomous Process Flow</h2>
          <p className="text-xs text-text-secondary">Visually trace how the clinical reasoning agent executes matching protocols step-by-step.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative">
          {[
            { step: "01", title: "Plan", detail: "Formulate reasoning goals and execution steps based on protocol criteria" },
            { step: "02", title: "Retrieve Patient Data", detail: "Extract patient demographic profile, diagnostic codes, medications, and observations" },
            { step: "03", title: "Retrieve Trial Criteria", detail: "Resolve structured protocol inclusion and exclusion criteria variables" },
            { step: "04", title: "Check Drug Exclusions", detail: "Scan active medications against contraindicated drug classes and rules" },
            { step: "05", title: "Check Freshness", detail: "Audit diagnostic record dates against hospital validity policy constraints" },
            { step: "06", title: "Compile Evidence Report", detail: "Bind final match recommendation to direct verified EHR database records" }
          ].map((item, idx) => (
            <div key={idx} className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col justify-between shadow-2xs relative group hover:border-accent transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-150 px-1.5 py-0.5 rounded">
                    STEP {item.step}
                  </span>
                  {idx < 5 && (
                    <ArrowRight className="w-4 h-4 text-border-subtle hidden lg:block translate-x-3.5 absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-text-primary mt-4">{item.title}</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-normal mt-2">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg-surface border-y border-border-subtle py-16 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Scope & Boundaries</h2>
            <p className="text-xs text-text-secondary">Understanding exactly what the autonomous matching agent is and is not.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-bg-base border border-border-subtle rounded-xl p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-teal-600 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-teal-600" /> What It Is
              </h3>
              <ul className="space-y-3.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Autonomous ReAct Planner</strong>: Dynamically reasons and adjusts planning steps based on intermediate observation logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Deterministic Evaluator</strong>: Maps rules to verified math boundaries and drug rules to avoid safety oversights.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Database Citation Binder</strong>: Integrates direct collection and record identifiers into audit logs.</span>
                </li>
              </ul>
            </div>

            <div className="bg-bg-base border border-border-subtle rounded-xl p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-rose-600 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2.5">
                <AlertOctagon className="w-4.5 h-4.5 text-rose-600" /> What It Is Not
              </h3>
              <ul className="space-y-3.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <XIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Not a Conversational Chatbot</strong>: Does not engage in casual chat, answer generic questions, or generate creative stories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Not a Clinical Diagnostician</strong>: Does not treat, diagnose, identify new diseases, or formulate therapeutic regimens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Not Medical Advice</strong>: Does not replace professional clinical decisions, coordinator expertise, or medical oversight.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-bold text-teal-700 uppercase tracking-wide">
            <Server className="w-3 h-3" /> System Architecture
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">How It's Built</h2>
          <p className="text-xs text-text-secondary">Clinical logic runs on structured infrastructure components.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-3 shadow-2xs">
            <Cpu className="w-8 h-8 text-teal-600" />
            <h4 className="font-bold text-sm text-text-primary">Vultr Serverless Inference</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Provides the reasoning LLM engine. Uses structural system prompt guidelines to execute the planning loop and construct precise JSON actions.
            </p>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-3 shadow-2xs">
            <Database className="w-8 h-8 text-teal-600" />
            <h4 className="font-bold text-sm text-text-primary">MongoDB Data Store</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Acts as the central electronic health records warehouse. Houses documents for patient demographics, conditions list, observation labs, and trial eligibility rules.
            </p>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-3 shadow-2xs">
            <Zap className="w-8 h-8 text-teal-600" />
            <h4 className="font-bold text-sm text-text-primary">Specialist Tool APIs</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Encapsulated Python tool modules that query databases, compare values, compute age thresholds, perform drug interaction rules, and verify freshness guidelines.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-bg-elevated border-t border-border-subtle py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">Ready to Run Diagnostic Screening?</h2>
          <p className="text-xs text-text-secondary">Access the secure clinical portal to inspect active patients and registered protocols.</p>
          <div className="pt-2">
            <Link 
              to="/workspace/dashboard" 
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-contrast text-white font-bold text-sm px-8 py-3.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              Enter Enterprise Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-bg-surface border-t border-border-subtle py-6 px-8 flex justify-between items-center text-[10px] text-text-secondary font-bold uppercase tracking-wider">
        <span>AURA Clinical Agent v1.0.0</span>
        <span>RAISE Summit Hackathon 2026</span>
      </footer>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
