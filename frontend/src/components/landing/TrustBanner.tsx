import { motion } from "framer-motion";

export function TrustBanner({
  id,
  trustedBy,
}: {
  id: string;
  trustedBy: string[];
}) {
  return (
    <section id={id} className="border-y border-border-subtle bg-bg-surface/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr] items-center">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Powered By</div>
            <div className="mt-2 text-lg md:text-xl font-black tracking-tight text-text-primary">Enterprise-grade stack built for clinical operations</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustedBy.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 text-center shadow-2xs"
              >
                <div className="text-sm font-extrabold text-text-primary">{item}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}