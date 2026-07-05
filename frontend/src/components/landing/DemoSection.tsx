import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, FlaskConical, UserRound } from "lucide-react";

const demoSteps = [
  { title: "Patient", detail: "John Williams", sub: "NSCLC Stage IIA", icon: UserRound },
  { title: "Agent", detail: "Evaluates the record", sub: "Patient + trial + policy", icon: FlaskConical },
  { title: "Finding", detail: "Conditionally eligible", sub: "Requires review", icon: CheckCircle2 },
  { title: "Gaps", detail: "CBC and LFT freshness", sub: "Evidence missing", icon: Clock3 },
  { title: "Warning", detail: "Warfarin conflict", sub: "Protocol exclusion", icon: AlertTriangle },
];

export function DemoSection({ id }: { id: string }) {
  return (
    <section id={id} className="py-16 md:py-20 bg-bg-surface/70 border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Interactive demo</div>
          <h3 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-text-primary">Judges should understand the story in one glance.</h3>
          <p className="mt-4 text-text-secondary text-base leading-relaxed">
            The agent preview below reads like a live case review: patient input, reasoning, evidence gaps, and safety warnings all appear in sequence.
          </p>
        </div>

        <div className="rounded-[2rem] border border-border-subtle bg-bg-base p-5 md:p-6 shadow-2xs">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] items-stretch">
            <div className="rounded-[1.6rem] border border-border-subtle bg-bg-surface p-6 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary">Live case</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">John Williams</div>
              <div className="mt-1 text-sm text-text-secondary">Non-small cell lung cancer, Stage IIA</div>

              <div className="mt-6 grid gap-3">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.28, delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center text-teal-600">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-text-primary">{step.title}</div>
                          <div className="text-[11px] text-text-secondary">{step.sub}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-text-primary">{step.detail}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-border-subtle bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-100 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                <span>Evidence summary</span>
                <span className="text-teal-300">Audit ready</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Condition", value: "Eligible with review" },
                  { label: "Missing", value: "CBC, LFT, ECG" },
                  { label: "Conflict", value: "Warfarin" },
                  { label: "Decision", value: "Proceed to human review" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-base font-extrabold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-teal-400/20 bg-teal-400/10 px-4 py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-200">Runtime target</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-white">&lt;30 seconds</div>
                <div className="mt-1 text-sm text-slate-300">Designed for rapid triage without sacrificing traceability.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}