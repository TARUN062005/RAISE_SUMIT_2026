import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BriefcaseMedical,
  ClipboardCheck,
  Clock,
  FlaskConical,
  Play,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { apiFetch } from "../lib/api";

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

type MatchResult<T> = {
  matches: T[];
  ambiguous: boolean;
};

const consoleExamples = [
  "Evaluate John Williams for NSCLC eligibility",
  "Check if John Williams qualifies for Trial A",
  "Review Warfarin exclusion for John Williams",
  "Run John Williams against lung cancer protocol",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function levenshteinDistance(left: string, right: string) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0));

  for (let row = 0; row <= a.length; row += 1) matrix[row][0] = row;
  for (let col = 0; col <= b.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length, 1);
  return 1 - levenshteinDistance(normalizedLeft, normalizedRight) / maxLength;
}

function resolveCandidates<T extends { id: string }>(records: T[], query: string, getText: (record: T) => string): MatchResult<T> {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  const substringMatches = records.filter((record) => {
    const candidateText = normalizeText(getText(record));
    if (!normalizedQuery) return false;
    if (candidateText.includes(normalizedQuery)) return true;
    return queryTokens.some((token) => token.length > 2 && candidateText.includes(token));
  });

  if (substringMatches.length === 1) {
    return { matches: substringMatches, ambiguous: false };
  }

  if (substringMatches.length > 1) {
    return { matches: substringMatches, ambiguous: true };
  }

  const ranked = records
    .map((record) => ({ record, score: similarityScore(getText(record), query) }))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score < 0.45) {
    return { matches: [], ambiguous: true };
  }

  if (second && Math.abs(best.score - second.score) < 0.08) {
    return { matches: ranked.filter((item) => item.score >= best.score - 0.08).map((item) => item.record), ambiguous: true };
  }

  return { matches: [best.record], ambiguous: false };
}

export default function EvaluatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTrial, setSelectedTrial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [consoleText, setConsoleText] = useState("");
  const [consolePreview, setConsolePreview] = useState<{ patient: Patient; trial: Trial } | null>(null);
  const [consoleMessage, setConsoleMessage] = useState("");
  const [consoleFocused, setConsoleFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [patientOptions, setPatientOptions] = useState<Patient[]>([]);
  const [trialOptions, setTrialOptions] = useState<Trial[]>([]);
  const [consolePhase, setConsolePhase] = useState<"idle" | "preview">("idle");

  const {
    data: patients = [],
    isLoading: loadingPatients,
    error: patientError,
    refetch: refetchPatients,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await apiFetch("/api/patients");
      if (!res.ok) throw new Error("Failed to load patients list");
      return res.json();
    },
  });

  const {
    data: trials = [],
    isLoading: loadingTrials,
    error: trialError,
    refetch: refetchTrials,
  } = useQuery<Trial[]>({
    queryKey: ["trials"],
    queryFn: async () => {
      const res = await apiFetch("/api/trials");
      if (!res.ok) throw new Error("Failed to load trials list");
      return res.json();
    },
  });

  useEffect(() => {
    const patient = searchParams.get("patient");
    const trial = searchParams.get("trial");
    if (patient) setSelectedPatient(patient);
    if (trial) setSelectedTrial(trial);
  }, [searchParams]);

  useEffect(() => {
    setPatientOptions(patients);
    setTrialOptions(trials);
  }, [patients, trials]);

  useEffect(() => {
    if (consoleFocused || consoleText.trim()) return;

    const timer = window.setInterval(() => {
      setExampleIndex((index) => (index + 1) % consoleExamples.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [consoleFocused, consoleText]);

  const currentPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatient),
    [patients, selectedPatient]
  );

  const currentTrial = useMemo(
    () => trials.find((trial) => trial.id === selectedTrial),
    [trials, selectedTrial]
  );

  const clearConsole = () => {
    setConsoleText("");
    setConsolePreview(null);
    setConsoleMessage("");
    setConsolePhase("idle");
    setPatientOptions(patients);
    setTrialOptions(trials);
  };

  const runEvaluation = async (patientId: string, trialId: string) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await apiFetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          trial_id: trialId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start evaluation agent run");
      }

      const data = await res.json();
      navigate(`/workspace/run/${data.run_id}`);
    } catch (error: any) {
      setSubmitError(error.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const resolveConsoleTask = () => {
    const text = consoleText.trim();
    if (!text) return;

    const patientMatches = resolveCandidates(patients, text, (patient) => `${patient.name} ${patient.id}`);
    const trialMatches = resolveCandidates(trials, text, (trial) => `${trial.title} ${trial.condition} ${trial.id}`);

    if (patientMatches.matches.length === 1 && trialMatches.matches.length === 1 && !patientMatches.ambiguous && !trialMatches.ambiguous) {
      setSelectedPatient(patientMatches.matches[0].id);
      setSelectedTrial(trialMatches.matches[0].id);
      setConsolePreview({ patient: patientMatches.matches[0], trial: trialMatches.matches[0] });
      setConsoleMessage("Task understood. Press Enter again to launch.");
      setConsolePhase("preview");
      return;
    }

    const narrowedPatients = patientMatches.matches.length > 0
      ? patients.filter((patient) => patientMatches.matches.some((match) => match.id === patient.id))
      : patients;
    const narrowedTrials = trialMatches.matches.length > 0
      ? trials.filter((trial) => trialMatches.matches.some((match) => match.id === trial.id))
      : trials;

    setConsolePreview(null);
    setConsolePhase("idle");
    setPatientOptions(narrowedPatients);
    setTrialOptions(narrowedTrials);

    if (patientMatches.matches.length === 0 || trialMatches.matches.length === 0) {
      setConsoleMessage(`No exact match found for ${patientMatches.matches.length === 0 ? "patient" : "trial"}. Use the selectors below.`);
      return;
    }

    if (patientMatches.matches.length > 1 && trialMatches.matches.length > 1) {
      setConsoleMessage("Multiple patients and trials matched. Narrow the selectors below.");
      return;
    }

    if (patientMatches.matches.length > 1) {
      setConsoleMessage(`Multiple patients matched \"${text}\". Please select below.`);
      return;
    }

    if (trialMatches.matches.length > 1) {
      setConsoleMessage(`Multiple trials matched \"${text}\". Please select below.`);
    }
  };

  const handleConsoleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (consolePhase === "preview" && consolePreview) {
      runEvaluation(consolePreview.patient.id, consolePreview.trial.id);
      return;
    }

    resolveConsoleTask();
  };

  const handleEvaluate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPatient || !selectedTrial) return;
    await runEvaluation(selectedPatient, selectedTrial);
  };

  if (loadingPatients || loadingTrials) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.24em]">Loading Clinical Data Registry</p>
      </div>
    );
  }

  if (patientError || trialError) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-650 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">System Integration Error</h2>
        <p className="text-xs text-red-750">{(patientError as Error)?.message || (trialError as Error)?.message}</p>
        <button
          onClick={() => {
            refetchPatients();
            refetchTrials();
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition duration-150 inline-flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  if (!patients.length || !trials.length) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
        <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">No Patient Records Seeded</h2>
        <p className="text-xs text-slate-500">Please run the database seed script to populate clinical trials and records.</p>
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
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700">
          <BriefcaseMedical className="w-3.5 h-3.5" /> Agent Console
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary">Clinical Match Workspace</h2>
        <p className="text-sm text-text-secondary max-w-3xl">
          Describe the evaluation task in one line or pick patient and trial directly. The same run path powers both entry modes.
        </p>
      </div>

      <form onSubmit={handleConsoleSubmit} className="rounded-[2rem] border border-border-subtle bg-bg-surface p-4 md:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary">Clinical Assistant</div>
            <h3 className="text-sm md:text-base font-extrabold text-text-primary">Describe the evaluation task</h3>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            {consolePhase === "preview" ? "Press Enter to run or Esc to cancel" : "Enter resolves selection"}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                value={consoleText}
                onChange={(event) => {
                  setConsoleText(event.target.value);
                  setConsoleMessage("");
                  if (consolePhase === "preview") {
                    setConsolePhase("idle");
                    setConsolePreview(null);
                  }
                }}
                onFocus={() => setConsoleFocused(true)}
                onBlur={() => setConsoleFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    clearConsole();
                  }
                }}
                placeholder={consoleFocused || consoleText ? consoleText : consoleExamples[exampleIndex]}
                aria-label="Agent Console input"
                className="w-full rounded-2xl border border-border-subtle bg-bg-base px-11 py-4 text-sm md:text-base text-text-primary placeholder:text-text-secondary shadow-inner focus:border-teal-300 focus:ring-2 focus:ring-teal-100 outline-none transition"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-accent-contrast transition"
              >
                {consolePhase === "preview" ? "Run Evaluation" : "Resolve Task"}
              </button>
              <button
                type="button"
                onClick={clearConsole}
                className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-bold text-text-primary shadow-2xs hover:bg-bg-elevated transition"
              >
                Clear
              </button>
            </div>

            {consoleMessage && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${consolePhase === "preview" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                {consolePhase === "preview" && consolePreview ? (
                  <div className="space-y-1 font-semibold">
                    <div>Task understood</div>
                    <div>Patient: {consolePreview.patient.name} ✓</div>
                    <div>Trial: {consolePreview.trial.title} ✓</div>
                    <div>Press Enter to run, or Esc to cancel</div>
                  </div>
                ) : (
                  <div>{consoleMessage}</div>
                )}
              </div>
            )}

            {submitError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-border-subtle bg-bg-base p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary mb-3">Current Selection</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
                  <span className="text-text-secondary">Patient</span>
                  <span className="font-bold text-text-primary">{currentPatient?.name || "None"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
                  <span className="text-text-secondary">Trial</span>
                  <span className="font-bold text-text-primary">{currentTrial?.title || "None"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-base p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary mb-3">Console Status</div>
              <div className="text-sm text-text-secondary leading-relaxed">
                {consolePhase === "preview"
                  ? "Preview ready. Press Enter again to launch the existing evaluation pipeline."
                  : "Type a task or use the selectors below. Ambiguous matches narrow the dropdowns instead of guessing."}
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleEvaluate} className="bg-bg-surface border border-border-subtle rounded-[1.75rem] p-6 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-700 border-b border-border-subtle pb-3">
              <Play className="w-4 h-4" /> Existing Dropdown Flow
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" /> Patient Target
                </label>
                <select
                  value={selectedPatient}
                  onChange={(event) => setSelectedPatient(event.target.value)}
                  required
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-3.5 py-3 text-sm text-text-primary focus:outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition"
                >
                  <option value="">-- Choose Patient --</option>
                  {patientOptions.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-600" /> Study Protocol
                </label>
                <select
                  value={selectedTrial}
                  onChange={(event) => setSelectedTrial(event.target.value)}
                  required
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-3.5 py-3 text-sm text-text-primary focus:outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition"
                >
                  <option value="">-- Choose Trial --</option>
                  {trialOptions.map((trial) => (
                    <option key={trial.id} value={trial.id}>
                      {trial.id}: {trial.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !selectedPatient || !selectedTrial}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 transition"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Autonomous Match Agent
              </button>
              <button
                type="button"
                onClick={clearConsole}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-5 py-3 text-sm font-bold text-text-primary shadow-2xs hover:bg-bg-elevated transition"
              >
                Reset Console
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[1.6rem] border border-border-subtle bg-bg-surface p-5 space-y-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary border-b border-border-subtle pb-2">Selected Patient Card</div>
              {currentPatient ? (
                <div className="space-y-2">
                  <div className="text-sm font-extrabold text-text-primary">{currentPatient.name}</div>
                  <div className="text-xs text-text-secondary">
                    ID: <code className="bg-bg-base border border-border-subtle px-1.5 py-0.5 rounded font-mono text-[10px]">{currentPatient.id}</code>
                  </div>
                  <div className="text-xs text-text-secondary">
                    DOB: <span className="font-semibold text-text-primary">{currentPatient.dob.split("T")[0]}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic">No patient selected.</p>
              )}
            </div>

            <div className="rounded-[1.6rem] border border-border-subtle bg-bg-surface p-5 space-y-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary border-b border-border-subtle pb-2">Selected Trial Card</div>
              {currentTrial ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">{currentTrial.id}</div>
                  <div className="text-sm font-extrabold text-text-primary leading-snug">{currentTrial.title}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-text-secondary border-t border-border-subtle">
                    <div>
                      PHASE: <span className="font-semibold text-text-primary">{currentTrial.phase}</span>
                    </div>
                    <div>
                      STATUS: <span className="font-semibold text-text-primary">{currentTrial.status}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic">No trial selected.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-border-subtle bg-bg-surface shadow-2xs overflow-hidden min-h-[360px] flex flex-col">
            <div className="bg-bg-base px-5 py-4 border-b border-border-subtle flex items-center justify-between shrink-0">
              <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> Live Agent Timeline
              </h3>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-emerald-200" />
            </div>
            <div className="p-6 flex-grow flex flex-col items-center justify-center text-center space-y-3 text-text-secondary">
              <Activity className="w-10 h-10 text-teal-600 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.24em]">Timeline Standby</p>
              <p className="text-sm max-w-[240px] leading-relaxed">
                The existing streaming timeline will appear here when the agent run starts.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border-subtle bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white shadow-[0_20px_60px_rgba(13,148,136,0.24)]">
            <BriefcaseMedical className="w-8 h-8 text-teal-100" />
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-black uppercase tracking-[0.24em]">Evidence Report Preview</h3>
              <p className="text-sm leading-relaxed text-teal-50">
                The final report is rendered in the existing run view with the same evidence trail, criteria, and drug checks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}