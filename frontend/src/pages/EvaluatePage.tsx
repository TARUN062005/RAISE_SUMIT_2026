import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, User, FlaskConical, AlertCircle, 
  RefreshCw, Play, Clock, Activity,
  BriefcaseMedical
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  dob: string;
}

interface Trial {
  id: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
}

export default function EvaluatePage() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTrial, setSelectedTrial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    data: patients,
    isLoading: loadingPatients,
    error: patientError,
    refetch: refetchPatients,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to load patients list");
      return res.json();
    },
  });

  const {
    data: trials,
    isLoading: loadingTrials,
    error: trialError,
    refetch: refetchTrials,
  } = useQuery<Trial[]>({
    queryKey: ["trials"],
    queryFn: async () => {
      const res = await fetch("/api/trials");
      if (!res.ok) throw new Error("Failed to load trials list");
      return res.json();
    },
  });

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedTrial) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient,
          trial_id: selectedTrial,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start evaluation agent run");
      }

      const data = await res.json();
      navigate(`/run/${data.run_id}`);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const currentPatient = patients?.find(p => p.id === selectedPatient);
  const currentTrial = trials?.find(t => t.id === selectedTrial);

  if (loadingPatients || loadingTrials) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider animate-pulse">
          Loading Clinical Data Registry...
        </p>
      </div>
    );
  }

  if (patientError || trialError) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-950/20 border border-rose-900/60 rounded-2xl text-center space-y-4 shadow-xl shadow-rose-950/10">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">System Integration Error</h2>
        <p className="text-sm text-rose-300">
          {(patientError as Error)?.message || (trialError as Error)?.message}
        </p>
        <button
          onClick={() => {
            refetchPatients();
            refetchTrials();
          }}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition duration-200 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  if (!patients?.length || !trials?.length) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">No Patient Records Seeded</h2>
        <p className="text-sm text-slate-400">
          Please run the database seed script to populate clinical trials and records.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          Clinical Match Workspace
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Initiate multi-agent ReAct workflows to deterministically verify clinical trial eligibility criteria.
        </p>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SELECTORS & SUMMARY */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleEvaluate} className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Parameters Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" /> Patient Target
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                  className="w-full bg-[#161c2e] border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition duration-200"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trial Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-400" /> Study Protocol
                </label>
                <select
                  value={selectedTrial}
                  onChange={(e) => setSelectedTrial(e.target.value)}
                  required
                  className="w-full bg-[#161c2e] border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition duration-200"
                >
                  <option value="">-- Choose Trial --</option>
                  {trials.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}: {t.title.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedPatient || !selectedTrial}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-indigo-800/40 disabled:to-violet-800/40 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Initializing Agent Orchestrator...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Run Autonomous Match Agent
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info */}
            <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                Selected Patient Card
              </div>
              {currentPatient ? (
                <div className="space-y-2">
                  <div className="text-base font-bold text-slate-200">{currentPatient.name}</div>
                  <div className="text-xs text-slate-400">ID: <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[10px]">{currentPatient.id}</code></div>
                  <div className="text-xs text-slate-400">DOB: <span className="font-semibold text-slate-300">{currentPatient.dob}</span></div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No patient selected.</p>
              )}
            </div>

            {/* Trial Info */}
            <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                Selected Trial Card
              </div>
              {currentTrial ? (
                <div className="space-y-2">
                  <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{currentTrial.id}</div>
                  <div className="text-sm font-bold text-slate-200 leading-snug">{currentTrial.title}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-400 border-t border-slate-850">
                    <div>PHASE: <span className="font-semibold text-slate-200">{currentTrial.phase}</span></div>
                    <div>STATUS: <span className="font-semibold text-slate-200">{currentTrial.status}</span></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No trial selected.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE EXECUTION TIMELINE (IDLE) */}
        <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-xl min-h-[400px]">
          <div className="bg-[#121828]/50 px-6 py-4 border-b border-slate-850 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Live Agent Timeline
            </h3>
            <span className="w-2.5 h-2.5 bg-slate-600 rounded-full border border-slate-500" />
          </div>
          <div className="p-6 flex-grow flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Standby</p>
              <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto mt-2 leading-relaxed">
                Waiting for evaluation triggers. Step details, tool calls, and model outputs will stream here in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: EVIDENCE REPORT (IDLE) */}
      <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <BriefcaseMedical className="w-10 h-10 text-slate-600 mx-auto animate-bounce" />
        <div>
          <h3 className="text-sm font-extrabold text-slate-350 uppercase tracking-wider">Protocol Evidence Report</h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
            Upon agent execution, the final medical match decision, satisfied criteria checklist, concomitant drug conflict logs, and citation maps will build and render below in structured cards.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
