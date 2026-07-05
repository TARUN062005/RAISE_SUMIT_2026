import { motion } from "framer-motion";
import { AlertTriangle, Clock3, Shield, Sparkles } from "lucide-react";

const problems = [
  {
    title: "Manual review is too slow",
    detail: "Research coordinators spend tens of minutes reading notes, labs, medication lists, and protocol documents one patient at a time.",
    icon: Clock3,
  },
  {
    title: "Safety misses are expensive",
    detail: "A single overlooked exclusion or stale lab can create avoidable risk, rework, and compliance pressure.",
    icon: AlertTriangle,
  },
  {
    title: "Evidence is hard to defend",
    detail: "Teams need a traceable explanation tied to records, policies, and tool output, not just a yes or no answer.",
    icon: Shield,
  },
];

export function ProblemSection({ id }: { id: string }) {
  return (
    <section id={id} className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Why traditional matching fails</div>
          <h3 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-text-primary">The manual workflow was never built for scale.</h3>
          <p className="mt-4 text-text-secondary text-base leading-relaxed">
            Clinical trial screening is not a document search problem. It is a multi-step evidence problem that spans patient records, protocol logic, drug rules, freshness constraints, and human review.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.article
                key={problem.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-[1.6rem] border border-border-subtle bg-bg-surface p-6 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="mt-5 text-lg font-extrabold tracking-tight text-text-primary">{problem.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{problem.detail}</p>
              </motion.article>
            );
          })}
        </div>

        <div className="rounded-[1.8rem] border border-border-subtle bg-bg-elevated p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" /> Built for enterprise teams
            </div>
            <p className="mt-4 text-xl font-black tracking-tight text-text-primary">Show the value, then show the controls.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Target</div>
              <div className="mt-1 font-extrabold text-text-primary">30 second review</div>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Evidence</div>
              <div className="mt-1 font-extrabold text-text-primary">Audit-ready output</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}