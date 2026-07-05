import { motion } from "framer-motion";
import { Activity, ArrowRightLeft, BadgeCheck, Brain, FileText, Radar } from "lucide-react";

const features = [
  { title: "Autonomous planning", detail: "Creates a reasoned execution plan before touching the clinical records.", icon: Brain },
  { title: "Evidence retrieval", detail: "Queries structured patient and trial records with specialist tools.", icon: Activity },
  { title: "Freshness validation", detail: "Rejects stale evidence and surfaces missing labs or outdated findings.", icon: Radar },
  { title: "Drug interaction analysis", detail: "Detects protocol conflicts and medication exclusions before recommendation.", icon: ArrowRightLeft },
  { title: "Policy engine", detail: "Applies hospital policies and criteria constraints as first-class inputs.", icon: BadgeCheck },
  { title: "Explainable decision", detail: "Produces an audit-ready report with record citations and a recommendation.", icon: FileText },
];

export function FeaturesSection({ id }: { id: string }) {
  return (
    <section id={id} className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Features</div>
          <h3 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-text-primary">Premium capabilities for clinical operations teams.</h3>
          <p className="mt-4 text-text-secondary text-base leading-relaxed">
            Each capability is designed to make the agent feel like part of a production research workflow, not a demo script.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="group rounded-[1.5rem] border border-border-subtle bg-bg-surface p-6 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-bg-elevated border border-border-subtle text-teal-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="mt-5 text-lg font-extrabold tracking-tight text-text-primary">{feature.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{feature.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}