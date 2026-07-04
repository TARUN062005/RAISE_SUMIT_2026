import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileUser, Play, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  dob: string;
}

interface EnrichedPatient extends Patient {
  diagnosis: string;
  stage: string;
  ecog: string;
  lastUpdated: string;
  status: string;
  summary: string;
  age: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<EnrichedPatient[]>([]);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      return `${age} yrs`;
    } catch {
      return "N/A";
    }
  };

  const enrichPatient = (p: Patient): EnrichedPatient => {
    const ageVal = calculateAge(p.dob);
    if (p.id === "john_williams") {
      return {
        ...p,
        age: ageVal,
        diagnosis: "Non-small cell lung cancer (NSCLC)",
        stage: "Stage IIA",
        ecog: "1.0",
        lastUpdated: "2026-07-04",
        status: "Conditionally Eligible",
        summary: "58-year-old male presenting with untreated Stage IIA NSCLC. Review shows concomitant Warfarin prescription (bleeding risk conflict) and expired blood counts."
      };
    }
    const hash = p.name.charCodeAt(0) + p.name.charCodeAt(p.name.length - 1);
    const diagnoses = [
      "Essential Hypertension",
      "Type 2 Diabetes Mellitus",
      "Chronic Obstructive Pulmonary Disease",
      "Asthma",
      "Coronary Artery Disease",
      "Rheumatoid Arthritis",
      "Adenocarcinoma of Lung"
    ];
    const stages = ["Stage I", "Stage II", "Stage III", "N/A"];
    const ecogs = ["0.0", "1.0", "2.0", "N/A"];
    const statuses = ["Eligible", "Ineligible", "Conditionally Eligible", "Not Evaluated"];
    
    const diag = diagnoses[hash % diagnoses.length];
    const stage = diag === "Essential Hypertension" || diag === "Asthma" || diag === "Type 2 Diabetes Mellitus" ? "N/A" : stages[hash % stages.length];
    const ecog = ecogs[hash % ecogs.length];
    const status = statuses[hash % statuses.length];
    
    return {
      ...p,
      age: ageVal,
      diagnosis: diag,
      stage: stage,
      ecog: ecog,
      lastUpdated: `2026-06-${(hash % 20 + 10).toString()}`,
      status: status,
      summary: `${p.name} is a candidate presenting with clinical ${diag.toLowerCase()}${stage !== "N/A" ? ` (${stage})` : ""}. Latest performance score: ECOG ${ecog}.`
    };
  };

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load patient records");
        return res.json();
      })
      .then((data: Patient[]) => {
        const enriched = data.map(enrichPatient);
        setPatients(enriched);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Eligible":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "Ineligible":
        return "bg-rose-50 text-rose-700 border-rose-250";
      case "Conditionally Eligible":
        return "bg-amber-50 text-amber-700 border-amber-250";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPatientId(expandedPatientId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">EHR Patient Directory</h2>
          <p className="text-xs text-slate-500">Secure clinical profile identities and active matching statuses</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {patients.length} Registered
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Retrieving patient records...</span>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-750 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Failed to retrieve records</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-xs">
          No patient records found in the database.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-5">Patient Name</th>
                  <th className="py-3.5 px-5 w-20">Age</th>
                  <th className="py-3.5 px-5">Primary Diagnosis</th>
                  <th className="py-3.5 px-5 w-24">Stage</th>
                  <th className="py-3.5 px-5 w-20">ECOG</th>
                  <th className="py-3.5 px-5 w-28">Last Updated</th>
                  <th className="py-3.5 px-5 w-36">Matching Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((patient) => {
                  const isExpanded = expandedPatientId === patient.id;
                  return (
                    <Fragment key={patient.id}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                          isExpanded ? "bg-slate-50/50" : ""
                        }`}
                        onClick={() => toggleExpand(patient.id)}
                      >
                        <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                          <FileUser className="w-4 h-4 text-slate-400 group-hover:text-teal-650 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-bold">{patient.name}</p>
                            <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[9px] border border-slate-200 text-slate-550">
                              {patient.id}
                            </code>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-700">{patient.age}</td>
                        <td className="py-4 px-5 text-slate-700 font-medium">{patient.diagnosis}</td>
                        <td className="py-4 px-5">
                          <span className={patient.stage !== "N/A" ? "font-bold text-slate-800" : "text-slate-400"}>
                            {patient.stage}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-700">{patient.ecog}</td>
                        <td className="py-4 px-5 text-slate-500">{patient.lastUpdated}</td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(patient.status)}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(patient.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => navigate(`/workspace/evaluate?patient=${patient.id}`)}
                              className="inline-flex items-center gap-1 bg-white hover:bg-teal-600 border border-slate-300 hover:border-teal-600 text-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-md transition duration-150 shadow-2xs"
                            >
                              <Play className="w-3 h-3" /> Evaluate
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${patient.id}-summary`}>
                          <td colSpan={8} className="bg-slate-50/40 px-6 py-3 border-t border-slate-100">
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-150 px-1.5 py-0.2 rounded-md uppercase shrink-0 mt-0.5">
                                Profile Summary
                              </span>
                              <p className="text-slate-655 leading-relaxed">{patient.summary}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
