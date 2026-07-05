import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Play, Loader2, AlertCircle, Search, ArrowUpDown } from "lucide-react";
import { apiFetch } from "../lib/api";

interface Trial {
  id: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
}

type SortField = "id" | "title" | "condition" | "phase" | "status";
type SortOrder = "asc" | "desc";

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [filteredTrials, setFilteredTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/trials")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load trial protocols");
        return res.json();
      })
      .then((data) => {
        setTrials(data);
        setFilteredTrials(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle Search, Filters and Sorting together
  useEffect(() => {
    let result = [...trials];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) => 
          t.id.toLowerCase().includes(query) || 
          t.title.toLowerCase().includes(query) || 
          (t.condition && t.condition.toLowerCase().includes(query))
      );
    }

    // Phase Filter
    if (phaseFilter !== "all") {
      result = result.filter((t) => t.phase.toLowerCase() === phaseFilter.toLowerCase());
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      let fieldA = a[sortField]?.toString().toLowerCase() || "";
      let fieldB = b[sortField]?.toString().toLowerCase() || "";

      if (sortField === "phase") {
        // Custom order for clinical phases: Phase I < Phase II < Phase III < Phase IV
        const phaseOrder: Record<string, number> = { "phase i": 1, "phase ii": 2, "phase iii": 3, "phase iv": 4 };
        const orderA = phaseOrder[fieldA] || 0;
        const orderB = phaseOrder[fieldB] || 0;
        return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
      }

      if (sortOrder === "asc") {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });

    setFilteredTrials(result);
  }, [searchQuery, phaseFilter, statusFilter, sortField, sortOrder, trials]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="rounded-[2rem] border border-border-subtle bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-900 text-white p-6 md:p-7 shadow-[0_24px_80px_rgba(15,118,110,0.22)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-50">
              <ClipboardList className="w-3.5 h-3.5" /> Trial Registry
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Clinical Trial Protocols</h2>
            <p className="text-sm text-teal-50/90 max-w-2xl">FDA registered protocols, phase filters, and recruitment status in a cleaner review surface.</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur">
            <div className="text-2xl font-black">{trials.length}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-teal-50/80">Protocols</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Retrieving trial protocols...</span>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-750 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Failed to retrieve protocols</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls: Search, Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-bg-surface border border-border-subtle p-4 rounded-[1.5rem] shadow-2xs">
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-405">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Trial ID, title, or condition..."
                className="w-full pl-9 pr-4 py-2 border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-teal-550 focus:border-teal-550 bg-bg-base/80"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Phase:</span>
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="bg-bg-base border border-border-subtle rounded-lg text-xs py-1.5 px-3 focus:ring-teal-550 text-text-primary"
                >
                  <option value="all">All Phases</option>
                  <option value="Phase I">Phase I</option>
                  <option value="Phase II">Phase II</option>
                  <option value="Phase III">Phase III</option>
                  <option value="Phase IV">Phase IV</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Recruiting:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-bg-base border border-border-subtle rounded-lg text-xs py-1.5 px-3 focus:ring-teal-550 text-text-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="Recruiting">Recruiting</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trials Directory Table */}
          {filteredTrials.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-xl text-slate-400 italic text-xs">
              No matching trials found in the directory.
            </div>
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-[1.75rem] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] font-extrabold uppercase tracking-wider text-text-secondary bg-bg-base/80">
                      <th className="py-3.5 px-5 w-32 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("id")}>
                        <div className="flex items-center gap-1">Trial ID <ArrowUpDown className="w-3 h-3 text-slate-450" /></div>
                      </th>
                      <th className="py-3.5 px-5 w-[45%] cursor-pointer hover:bg-slate-100" onClick={() => handleSort("title")}>
                        <div className="flex items-center gap-1">Protocol Title <ArrowUpDown className="w-3 h-3 text-slate-450" /></div>
                      </th>
                      <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("condition")}>
                        <div className="flex items-center gap-1">Condition <ArrowUpDown className="w-3 h-3 text-slate-450" /></div>
                      </th>
                      <th className="py-3.5 px-5 w-24 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("phase")}>
                        <div className="flex items-center gap-1">Phase <ArrowUpDown className="w-3 h-3 text-slate-450" /></div>
                      </th>
                      <th className="py-3.5 px-5 w-32 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("status")}>
                        <div className="flex items-center gap-1">Recruitment <ArrowUpDown className="w-3 h-3 text-slate-450" /></div>
                      </th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTrials.map((trial) => (
                      <tr key={trial.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-5 font-bold text-slate-900">
                          {trial.id}
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-800 leading-normal">
                          {trial.title}
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-700">{trial.condition || "General Oncology"}</td>
                        <td className="py-4 px-5">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                            {trial.phase}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              trial.status.toLowerCase() === "recruiting" ? "bg-emerald-500" : "bg-amber-500"
                            }`} />
                            <span className="font-semibold text-slate-700 capitalize">{trial.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => navigate(`/workspace/evaluate?trial=${trial.id}`)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-teal-600 border border-slate-300 hover:border-teal-600 text-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-md transition duration-150 shadow-2xs"
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
      )}
    </div>
  );
}
