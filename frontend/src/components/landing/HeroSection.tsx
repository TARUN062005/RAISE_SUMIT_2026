import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Shield, Workflow } from "lucide-react";

export function HeroSection({
  id,
  heroStats,
}: {
  id: string;
  heroStats: Array<{ value: string; label: string }>;
}) {
  return (
    <section id={id} className="relative overflow-hidden min-h-[calc(100vh-72px)] flex items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_30%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-12 items-center relative w-full">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700 shadow-2xs">
            <Shield className="w-3.5 h-3.5" /> Autonomous evidence-backed matching for oncology research teams
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="text-[11px] md:text-xs font-bold uppercase tracking-[0.34em] text-text-secondary">AURA</div>
            <h2 className="text-5xl md:text-[4.5rem] font-black tracking-tight leading-[0.96] text-text-primary">
              Clinical Trial Eligibility Agent
            </h2>
            <p className="text-lg md:text-[20px] text-text-secondary max-w-xl leading-relaxed">
              Reduce protocol review from 45 minutes to under 30 seconds with a live audit trail.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/workspace/dashboard"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-contrast text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition shadow-[0_18px_50px_rgba(15,118,110,0.28)] group"
            >
              Access Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 bg-bg-surface border border-border-subtle hover:border-teal-300 text-text-primary font-bold text-sm px-6 py-3.5 rounded-2xl transition shadow-2xs"
            >
              Watch Demo <Workflow className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-[1.6rem] border border-border-subtle bg-bg-surface/90 px-4 py-4 shadow-2xs">
                <div className="text-[26px] md:text-[32px] font-black text-text-primary tracking-tight">{item.value}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-border-subtle bg-bg-surface/90 p-4 shadow-2xs max-w-xl">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary">
              <span>Execution stream</span>
              <span className="text-teal-700">Auto-playing</span>
            </div>
            <div className="mt-4 grid gap-2">
              {[
                "Planner",
                "Retrieve Patient",
                "Retrieve Trial",
                "Drug Check",
                "Freshness",
                "Decision",
              ].map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.12, repeat: Infinity, repeatDelay: 4.5, repeatType: "reverse" }}
                  className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 flex items-center justify-between"
                >
                  <span className="font-semibold text-sm text-text-primary">{step}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Active</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
          style={{ perspective: 1800 }}
        >
          <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-teal-400/10 via-sky-400/10 to-transparent blur-3xl" />
          <div
            className="relative rounded-[2rem] border border-border-subtle bg-bg-surface/90 backdrop-blur-2xl shadow-[0_30px_80px_rgba(15,23,42,0.18)] overflow-hidden"
            style={{ transform: "perspective(1800px) rotateX(6deg) rotateY(-10deg)" }}
          >
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] min-h-[540px]">
              <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 md:p-6 flex flex-col justify-between">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),transparent_40%)]" />
                <div className="relative flex items-center justify-between text-[10px] uppercase tracking-[0.24em] font-bold text-slate-400">
                  <span>Hospital illustration</span>
                  <span>Clinical workspace</span>
                </div>
                <div className="relative flex-1 min-h-[340px] flex items-center justify-center py-6">
                  <img
                    src="/hospital_research_illustration.png"
                    alt="Hospital research illustration"
                    className="w-full max-w-[360px] md:max-w-[430px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
                  />
                </div>
                <div className="relative grid grid-cols-2 gap-3">
                  {[
                    { title: "Patient Loaded", value: "✓" },
                    { title: "Trial Retrieved", value: "✓" },
                    { title: "Drug Check", value: "✓" },
                    { title: "Decision", value: "Conditionally Eligible" },
                  ].map((card) => (
                    <motion.div
                      key={card.title}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-md p-4 shadow-lg text-slate-100"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.title}</div>
                      <div className="mt-2 text-lg font-black tracking-tight">{card.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative p-5 md:p-6 bg-bg-surface">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary">Dashboard preview</div>
                <div className="mt-4 rounded-[1.7rem] border border-border-subtle bg-bg-base shadow-2xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-text-primary">ReAct execution</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Live inference stream</div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                      <Cpu className="w-3.5 h-3.5" /> Online
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: "Planner", status: "Running", tone: "text-teal-700 bg-teal-50 border-teal-200" },
                      { label: "Drug Tool", status: "Completed", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                      { label: "Freshness", status: "Expired CBC", tone: "text-amber-700 bg-amber-50 border-amber-200" },
                      { label: "Evidence", status: "Ready", tone: "text-slate-700 bg-slate-50 border-slate-200" },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.12, repeat: Infinity, repeatDelay: 4.8, repeatType: "mirror" }}
                        className="flex items-center justify-between rounded-2xl border px-4 py-3 bg-white"
                      >
                        <div>
                          <div className="text-sm font-extrabold text-text-primary">{item.label}</div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">Clinical step</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border ${item.tone}`}>{item.status}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.div
                  animate={{ rotateZ: [-1.2, 1.2, -1.2] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-6 top-24 hidden xl:block rounded-2xl border border-border-subtle bg-white/90 backdrop-blur-xl shadow-[0_24px_60px_rgba(15,23,42,0.14)] px-4 py-3 w-44"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Planner</div>
                  <div className="mt-1 text-sm font-extrabold text-text-primary">Running...</div>
                </motion.div>

                <motion.div
                  animate={{ rotateZ: [1.2, -1.2, 1.2] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-5 top-40 hidden xl:block rounded-2xl border border-border-subtle bg-white/90 backdrop-blur-xl shadow-[0_24px_60px_rgba(15,23,42,0.14)] px-4 py-3 w-44"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Warfarin</div>
                  <div className="mt-1 text-sm font-extrabold text-amber-700">Conflict</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute right-8 bottom-8 hidden xl:block rounded-2xl border border-border-subtle bg-white/90 backdrop-blur-xl shadow-[0_24px_60px_rgba(15,23,42,0.14)] px-4 py-3 w-40"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">CBC</div>
                  <div className="mt-1 text-sm font-extrabold text-amber-700">Expired</div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}