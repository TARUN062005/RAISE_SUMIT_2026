import { motion } from "framer-motion";
import { ArrowRight, Brain, FlaskConical, ShieldCheck, Sparkles, Database } from "lucide-react";

const steps = [
  { title: "Patient", detail: "Retrieve", icon: Database },
  { title: "Planner", detail: "Reason", icon: Brain },
  { title: "Trial", detail: "Match", icon: FlaskConical },
  { title: "Drug", detail: "Check", icon: ShieldCheck },
  { title: "Freshness", detail: "Validate", icon: Sparkles },
];

export function WorkflowSection({ id }: { id: string }) {
  return (
    <section id={id} className="py-14 md:py-16 bg-bg-surface/70 border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Workflow</div>
          <h3 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-text-primary">Patient → Planner → Trial → Drug → Decision</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative rounded-[1.5rem] border border-border-subtle bg-bg-base p-5 shadow-2xs overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">0{index + 1}</span>
                </div>
                <h4 className="mt-4 font-extrabold text-text-primary">{step.title}</h4>
                <p className="mt-1 text-sm font-semibold text-text-secondary">{step.detail}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden xl:block absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}