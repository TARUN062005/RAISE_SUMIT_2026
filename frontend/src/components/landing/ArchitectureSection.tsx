import { motion } from "framer-motion";
import { ArrowRight, Brain, Database, FileText, FlaskConical, Layers3, Server } from "lucide-react";

const nodes = [
  { title: "React", detail: "Presentation and routing", icon: Layers3 },
  { title: "FastAPI", detail: "Secure API boundary", icon: Server },
  { title: "Planner", detail: "Creates execution strategy", icon: Brain },
  { title: "Tool Router", detail: "Specialist tool selection", icon: FlaskConical },
  { title: "MongoDB", detail: "Patient and trial records", icon: Database },
  { title: "Vultr", detail: "Inference and reasoning", icon: FileText },
];

export function ArchitectureSection({ id }: { id: string }) {
  return (
    <section id={id} className="py-14 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-[2rem] border border-border-subtle bg-bg-surface p-6 md:p-7 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Architecture</div>
              <h3 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-text-primary">React → FastAPI → Planner → Tools → MongoDB → Vultr</h3>
            </div>
            <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700">
              <Server className="w-3.5 h-3.5" /> Secure pipeline
            </div>
          </div>

          <div className="mt-6 grid gap-3 xl:grid-cols-6">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-[1.4rem] border border-border-subtle bg-bg-base p-4 shadow-2xs relative"
                >
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="mt-4 font-extrabold text-text-primary">{node.title}</div>
                  <div className="mt-1 text-[11px] font-medium text-text-secondary">{node.detail}</div>
                  {index < nodes.length - 1 && <ArrowRight className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}