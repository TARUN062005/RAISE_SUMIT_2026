import { useEffect, useState } from "react";

function AnimatedValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value.startsWith("<") ? value : "0");

  useEffect(() => {
    if (value.startsWith("<")) {
      setDisplay(value);
      return;
    }

    const numeric = Number(value.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(numeric)) {
      setDisplay(value);
      return;
    }

    const suffix = value.replace(/[\d.]/g, "").trim();
    const duration = 900;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const progress = Math.min((Date.now() - started) / duration, 1);
      const current = Math.round(numeric * progress);
      setDisplay(`${current}${suffix}`);
      if (progress >= 1) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [value]);

  return <>{display}</>;
}

const stats = [
  { value: "45 min", label: "Manual review" },
  { value: "<30 sec", label: "Agent evaluation" },
  { value: "18", label: "Collections" },
  { value: "6", label: "Specialist tools" },
  { value: "100%", label: "Evidence linked" },
];

export function StatsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-[2rem] border border-border-subtle bg-bg-surface p-6 md:p-8 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Demo statistics</div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-border-subtle bg-bg-base px-5 py-6 text-center">
                <div className="text-3xl font-black tracking-tight text-text-primary">
                  <AnimatedValue value={item.value} />
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}