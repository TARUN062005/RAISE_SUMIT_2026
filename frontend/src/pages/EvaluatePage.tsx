import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
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

  // Pre-populate selections from search parameters
  useEffect(() => {
    const p = searchParams.get("patient");
    const t = searchParams.get("trial");
    if (p) setSelectedPatient(p);
    if (t) setSelectedTrial(t);
  }, [searchParams]);

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
      navigate(`/workspace/run/${data.run_id}`);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const currentPatient = patients?.find(p => p.id === selectedPatient);
  const currentTrial = trials?.find(t => t.id === selectedTrial);

  if (loadingPatients || loadingTrials) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider animate-pulse">
          Loading Clinical Data Registry...
        </p>
      </div>
    );
  }

  if (patientError || trialError) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-650 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">System Integration Error</h2>
        <p className="text-xs text-red-750">
          {(patientError as Error)?.message || (trialError as Error)?.message}
        </p>
        <button
          onClick={() => {
            refetchPatients();
            refetchTrials();
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition duration-150 inline-flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  if (!patients?.length || !trials?.length) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-sm">
        <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">No Patient Records Seeded</h2>
        <p className="text-xs text-slate-500">
          Please run the database seed script to populate clinical trials and records.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto w-full"
    >
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Clinical Match Workspace</h2>
        <p className="text-xs text-slate-500 mt-1">
          Initiate multi-agent ReAct workflows to deterministically verify clinical trial eligibility criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selectors */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleEvaluate} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="text-xs font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Parameters Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" /> Patient Target
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition duration-150"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-600" /> Study Protocol
                </label>
                <select
                  value={selectedTrial}
                  onChange={(e) => setSelectedTrial(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition duration-150"
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
              <div className="p-4 bg-red-50 border border-red-205 rounded-lg text-xs text-red-750 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedPatient || !selectedTrial}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-lg transition duration-150 shadow-xs flex items-center justify-center gap-2"
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Selected Patient Card
              </div>
              {currentPatient ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-slate-900">{currentPatient.name}</div>
                  <div className="text-xs text-slate-550">ID: <code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{currentPatient.id}</code></div>
                  <div className="text-xs text-slate-550">DOB: <span className="font-semibold text-slate-700">{currentPatient.dob.split("T")[0]}</span></div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No patient selected.</p>
              )}
            </div>

            {/* Trial Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Selected Trial Card
              </div>
              {currentTrial ? (
                <div className="space-y-2">
                  <div className="text-xs text-teal-600 font-bold uppercase tracking-wider">{currentTrial.id}</div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{currentTrial.title}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-500 border-t border-slate-100">
                    <div>PHASE: <span className="font-semibold text-slate-800">{currentTrial.phase}</span></div>
                    <div>STATUS: <span className="font-semibold text-slate-800">{currentTrial.status}</span></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No trial selected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Timeline (idle placeholder) */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs min-h-[400px]">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-650" /> Live Agent Timeline
            </h3>
            <span className="w-2.5 h-2.5 bg-slate-350 rounded-full border border-slate-200" />
          </div>
          <div className="p-6 flex-grow flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Timeline Standby</p>
              <p className="text-[10px] text-slate-450 max-w-[200px] mx-auto mt-1 leading-relaxed">
                Waiting for evaluation triggers. Step details, tool calls, and model outputs will stream here in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Evidence Report Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-2xs">
        <BriefcaseMedical className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Protocol Evidence Report</h3>
          <p className="text-xs text-slate-550 max-w-lg mx-auto mt-1 leading-relaxed">
            Upon agent execution, the final medical match decision, satisfied criteria checklist, concomitant drug conflict logs, and citation maps will build and render below in structured cards.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
