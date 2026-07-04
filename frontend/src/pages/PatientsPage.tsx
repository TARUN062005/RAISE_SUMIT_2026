import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileUser, Play, Loader2, AlertCircle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  dob: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load patient records");
        return res.json();
      })
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const calculateAge = (dobString: string) => {
    if (!dobString) return "N/A";
    try {
      const birthDate = new Date(dobString.split("T")[0]);
      const referenceDate = new Date("2026-07-04");
      let age = referenceDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return "N/A";
    }
  };

  const formatDOB = (dobString: string) => {
    if (!dobString) return "N/A";
    return dobString.split("T")[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-200">Clinical Patient Profiles</h2>
          <p className="text-xs text-slate-500 mt-1">EHR patient identity registry and diagnostics access dashboard</p>
        </div>
        <div className="bg-[#121626]/50 border border-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {patients.length} Registered
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold">Retrieving EHR patient records...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Failed to retrieve records</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl text-slate-500 italic text-xs">
          No patient records found in the database.
        </div>
      ) : (
        <div className="bg-[#0f1422]/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#121828]/40">
                  <th className="py-4 px-6">Patient Name</th>
                  <th className="py-4 px-6">Demographic Identifier</th>
                  <th className="py-4 px-6">Date of Birth</th>
                  <th className="py-4 px-6">Reference Age</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-800/20 transition duration-150 group">
                    <td className="py-4 px-6 font-bold text-slate-200 flex items-center gap-2">
                      <FileUser className="w-4 h-4 text-indigo-400/80 shrink-0" />
                      {patient.name}
                    </td>
                    <td className="py-4 px-6">
                      <code className="bg-slate-900/60 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-850 text-slate-400">
                        {patient.id}
                      </code>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{formatDOB(patient.dob)}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{calculateAge(patient.dob)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/evaluate?patient=${patient.id}`)}
                        className="inline-flex items-center gap-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 group-hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition duration-200"
                      >
                        <Play className="w-3 h-3" /> Evaluate
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
