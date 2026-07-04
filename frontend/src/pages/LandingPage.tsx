import { Link } from "react-router-dom";
import { 
  ShieldCheck, Compass, AlertTriangle, ArrowRight, CheckCircle2,
  Lock, Cpu, FileText, Database, Shield, Zap, Check
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-teal-50 border border-teal-200 text-teal-600 p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">
              AURA Clinical Agent
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Enterprise Match Portal</p>
          </div>
        </div>
        <div>
          <Link 
            to="/workspace/dashboard" 
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            Access Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-250 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
            <Shield className="w-3 h-3 text-teal-600" /> Enterprise Healthcare Protocol Matching
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Autonomous Clinical Trial Eligibility Matching Agent
          </h1>
          
          <p className="text-sm md:text-base text-slate-655 leading-relaxed max-w-xl">
            Evaluate complex EHR patient diagnostics against registered FDA trial criteria in real time. Powered by autonomous ReAct reasoning.
          </p>

          {/* Essential Disclaimers */}
          <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Not a Diagnosis Tool</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Not a Chatbot</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-teal-600" />
              <span>No Medical Advice</span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Link 
              to="/workspace/dashboard" 
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-lg transition shadow-xs group"
            >
              Access Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md max-w-md w-full relative">
            <img 
              src="/hospital_research_illustration.png" 
              alt="Medical Research and Clinical Agent Illustration" 
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute -bottom-4 -left-4 bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-teal-400" /> Vultr LLM active
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why hospitals need this */}
      <section className="bg-white border-y border-slate-200 py-16 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">The Manual Matching Crisis</h2>
            <p className="text-xs text-slate-500">Traditional workflow is slow, error-prone, and compromises clinical trial enrollment rates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-250 rounded-xl p-6 space-y-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Time Sink Constraints</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clinical research coordinators spend up to 45 minutes manually auditing a single patient record across multiple EHR tabs, scans, and PDFs.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-250 rounded-xl p-6 space-y-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Compliance Risk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Missing a single drug exclusion (e.g., concomitant anticoagulants) or matching based on an expired blood lab test compromises patient safety and compliance.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-250 rounded-xl p-6 space-y-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Research Delays</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Slow candidate identification delays trials, stalling the delivery of critical new therapeutic options to patients in need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Custom Visual Timeline */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Autonomous Process Execution</h2>
          <p className="text-xs text-slate-500">Continuous telemetry pipeline executing tools, checking rules, and compiling citation audits.</p>
        </div>

        {/* Timeline Desktop Row / Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 relative">
          {[
            { step: "Plan", desc: "Formulates goals based on protocol criteria" },
            { step: "Retrieve", desc: "Queries demographics, diagnoses, and labs" },
            { step: "Evaluate", desc: "Matches age, diagnoses, and core parameters" },
            { step: "Policy Check", desc: "Resolves institutional lab test rules" },
            { step: "Drug Check", desc: "Cross-references active drug exclusions" },
            { step: "Freshness", desc: "Audits observation dates for compliance" },
            { step: "Decision", desc: "Computes overall eligibility outcome" },
            { step: "Evidence Report", desc: "Binds final findings to direct EHR citations" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs relative group hover:border-teal-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                  STEP 0{idx + 1}
                </span>
                {idx < 7 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 hidden lg:block translate-x-2.5 absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h4 className="font-bold text-xs text-slate-900">{item.step}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Enterprise capabilities */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Enterprise Infrastructure Capabilities</h2>
            <p className="text-xs text-slate-400">Strictly auditable, secure, and production-grade clinical logic matching.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Evidence-Based CITATIONS", desc: "Every match decision binds directly to secure demographic, condition, or observation entries in the database." },
              { title: "Deterministic Output Rules", desc: "No fuzzy AI guesses. Final eligibility outcomes are compiled using verified Python checking rules." },
              { title: "Completely Auditable Logs", desc: "Maintains a full telemetry stream of ReAct reasoning scratchpads for compliance checks." },
              { title: "Policy-Aware Verification", desc: "Integrates clinical guidelines regarding laboratory test dates and expiration values." },
              { title: "Concomitant Drug Audits", desc: "Cross-references active medications with trial exclusions dynamically during agent loop." },
              { title: "Secure EHR Sandbox", desc: "Isolated patient directories mapping exactly to standard healthcare nomenclature systems." }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-teal-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-200">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Tech stack */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Architecture Stack</h2>
          <p className="text-xs text-slate-500">State-of-the-art serverless inference combined with secure backend databases.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <Cpu className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">Vultr Inference</h4>
            <p className="text-[10px] text-slate-500 mt-1">Serverless Reasoning LLM</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <Zap className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">FastAPI</h4>
            <p className="text-[10px] text-slate-500 mt-1">Python API Gateway</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <Database className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">MongoDB</h4>
            <p className="text-[10px] text-slate-500 mt-1">Document Store Layer</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <FileText className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">React + TS</h4>
            <p className="text-[10px] text-slate-500 mt-1">Clinical Portal Interface</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <Compass className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">ReAct Loop</h4>
            <p className="text-[10px] text-slate-500 mt-1">Structured Reasoning</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <Lock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-900">SSE Streams</h4>
            <p className="text-[10px] text-slate-500 mt-1">Real-time Telemetry</p>
          </div>
        </div>
      </section>

      {/* Section 6: Final CTA */}
      <section className="bg-slate-100 border-t border-slate-200 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ready to Run Diagnostic Screening?</h2>
          <p className="text-xs text-slate-500">Access the secure clinical portal to inspect active patients and registered protocols.</p>
          <div className="pt-2">
            <Link 
              to="/workspace/dashboard" 
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-8 py-3.5 rounded-lg transition shadow-xs"
            >
              Enter Enterprise Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-8 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>AURA Clinical Agent v1.0.0</span>
        <span>RAISE Summit Hackathon 2026</span>
      </footer>
    </div>
  );
}
