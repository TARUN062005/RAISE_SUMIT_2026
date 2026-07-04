import { Link } from "react-router-dom";
import { 
  ShieldCheck, Compass, AlertTriangle, ArrowRight, Layers 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" /> Hackathon Edition 2026
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
          Autonomous Clinical Trial Eligibility Matching Agent
        </h1>
        
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Evaluate complex EHR patient diagnostics against clinical trial criteria in real time.
        </p>

        {/* Essential Disclaimers (Task 9) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 bg-[#121626]/50 px-3 py-2 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Not a Diagnosis Tool</span>
          </div>
          <div className="flex items-center gap-2 bg-[#121626]/50 px-3 py-2 rounded-xl border border-slate-800/80">
            <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Not a Chatbot</span>
          </div>
          <div className="flex items-center gap-2 bg-[#121626]/50 px-3 py-2 rounded-xl border border-slate-800/80">
            <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>No Medical Advice</span>
          </div>
        </div>

        <div className="pt-6">
          <Link 
            to="/evaluate" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition duration-300 shadow-lg shadow-indigo-600/10 group"
          >
            Enter Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Difference / Innovation Section */}
      <section className="bg-[#0c101d]/60 border border-slate-850 rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-200">How is this different from standard tools?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-indigo-400">Autonomous Reasoning vs. Chat-with-PDF</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard AI systems act as search engines or document summarizers. AURA is an autonomous coordinator: it breaks down goals, queries specialist EHR databases, reviews criteria tables, cross-references concomitant drug interactions, and audits lab test dates without needing a human to prompt it step-by-step.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-indigo-400">Deterministic Rules vs. Model Guesses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instead of letting a language model guess if a patient is eligible, AURA utilizes its ReAct scratchpad to collect primary evidence. The final report is compiled deterministically in Python using strict criteria check rules, guaranteeing that the decision matches the logic verified in the logs.
            </p>
          </div>
        </div>
      </section>

      {/* Diagram of the Agent's Process */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-200">The Agent Workflow Execution Sequence</h2>
          <p className="text-xs text-slate-500 mt-1">Autonomous orchestration from request trigger to compiled citation report</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Card 1 */}
          <div className="bg-[#0f1422]/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
            <div className="text-indigo-400 text-xs font-black">01 / PLAN</div>
            <h4 className="font-bold text-xs text-slate-200">Formulates ReAct Plan</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The agent breaks down eligibility matching into logical steps based on the study criteria.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0f1422]/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
            <div className="text-indigo-400 text-xs font-black">02 / RETRIEVE</div>
            <h4 className="font-bold text-xs text-slate-200">Queries EHR Data</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Issues queries in parallel to pull demographics, conditions, medications, and labs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0f1422]/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
            <div className="text-indigo-400 text-xs font-black">03 / CHECK</div>
            <h4 className="font-bold text-xs text-slate-200">Audits Constraints</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Checks patient's active drug list against exclusions and analyzes lab date expiration.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#0f1422]/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
            <div className="text-indigo-400 text-xs font-black">04 / DECIDE</div>
            <h4 className="font-bold text-xs text-slate-200">Verifies Evidence</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Assesses the collected data points to decide if eligibility is eligible, conditional, or ineligible.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-[#0f1422]/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
            <div className="text-indigo-400 text-xs font-black">05 / REPORT</div>
            <h4 className="font-bold text-xs text-slate-200">Builds Citation Map</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Outputs a summary and satisfied criteria checklist mapped to source references.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
