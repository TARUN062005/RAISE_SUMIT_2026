import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";

const cards = [
  {
    title: "Faster",
    detail: "From chart review to recommendation in seconds, not minutes.",
    icon: Zap,
  },
  {
    title: "Safer",
    detail: "Drug conflicts, freshness gaps, and missing evidence stay visible.",
    icon: ShieldCheck,
  },
  {
    title: "Explainable",
    detail: "Every result ties back to records, policies, and tool output.",
    icon: BadgeCheck,
  },
];

export function WhySection({ id }: { id: string }) {
  return (
    <section id={id} className="py-14 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Why AURA</div>
            <h3 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-text-primary">Built for speed, safety, and auditability.</h3>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-[1.8rem] border border-border-subtle bg-bg-surface p-6 shadow-2xs hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="mt-5 text-xl font-black tracking-tight text-text-primary">{card.title}</h4>
                <p className="mt-2 text-sm md:text-base leading-relaxed text-text-secondary">{card.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}