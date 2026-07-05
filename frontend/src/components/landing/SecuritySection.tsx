import { CheckCircle2, ShieldCheck } from "lucide-react";

const securityItems = [
  "Audit trail for every decision",
  "Explainable evidence citations",
  "Human review before final action",
  "Data governance friendly workflow",
  "Secure API boundary",
  "Hospital policy checks",
];

export function SecuritySection({ id }: { id: string }) {
  return (
    <section id={id} className="py-16 md:py-20 bg-bg-surface/70 border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Security & compliance</div>
          <h3 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-text-primary">Hospital-ready by design.</h3>
          <p className="mt-4 text-text-secondary text-base leading-relaxed">
            The landing page should make enterprise buyers comfortable immediately. This section turns the product into a governed, explainable system instead of a flashy demo.
          </p>
        </div>

        <div className="grid xl:grid-cols-[0.75fr_1.25fr] gap-6 items-stretch">
          <div className="rounded-[1.8rem] border border-border-subtle bg-bg-base p-6 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="mt-4 text-xl font-black tracking-tight text-text-primary">Enterprise confidence</div>
            <div className="mt-2 text-sm leading-relaxed text-text-secondary">
              Every recommendation remains traceable, reviewable, and suitable for clinical operations and research leadership.
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Protected", value: "Secure API" },
                { label: "Visible", value: "Audit trail" },
                { label: "Reviewed", value: "Human in loop" },
                { label: "Citable", value: "Evidence links" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">{item.label}</div>
                  <div className="mt-1 font-extrabold text-text-primary">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {securityItems.map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-border-subtle bg-bg-surface p-5 shadow-2xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-text-primary">{item}</div>
                  <div className="mt-1 text-sm text-text-secondary">Designed to reassure hospital, research, and compliance stakeholders.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}