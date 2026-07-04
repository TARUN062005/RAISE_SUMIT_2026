import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Play, Loader2, AlertCircle } from "lucide-react";

interface Trial {
  id: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/trials")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load trial protocols");
        return res.json();
      })
      .then((data) => {
        setTrials(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-200">Clinical Trial Protocols</h2>
          <p className="text-xs text-slate-500 mt-1">FDA registered protocols, stage eligibility criteria and enrollment status</p>
        </div>
        <div className="bg-[#121626]/50 border border-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" /> {trials.length} Protocols
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold">Retrieving clinical protocol registries...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Failed to retrieve protocols</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : trials.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl text-slate-500 italic text-xs">
          No trial protocols found in the database.
        </div>
      ) : (
        <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#121828]/40">
                  <th className="py-4 px-6 w-28">Trial ID</th>
                  <th className="py-4 px-6 w-[40%]">Protocol Title</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Phase</th>
                  <th className="py-4 px-6">Recruitment</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {trials.map((trial) => (
                  <tr key={trial.id} className="hover:bg-slate-800/20 transition duration-150 group">
                    <td className="py-4 px-6 font-bold text-indigo-400">
                      {trial.id}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-200 leading-normal">
                      {trial.title}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-350">{trial.condition || "General Oncology"}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-300">
                        {trial.phase}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-300 capitalize">{trial.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/evaluate?trial=${trial.id}`)}
                        className="inline-flex items-center gap-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 group-hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition duration-200"
                      >
                        <Play className="w-3 h-3" /> Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
