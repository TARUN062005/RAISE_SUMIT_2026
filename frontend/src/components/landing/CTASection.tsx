import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection({ id }: { id: string }) {
  return (
    <section id={id} className="py-14 md:py-16 bg-bg-elevated border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-[2rem] border border-border-subtle bg-bg-surface p-8 md:p-10 shadow-2xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Call to action</div>
          <h3 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-text-primary">Ready to run the workspace?</h3>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary text-base leading-relaxed">
            Open the portal and start evaluating patients against trial criteria.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/workspace/dashboard"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-contrast text-white font-bold text-sm px-7 py-3.5 rounded-xl transition shadow-xs"
            >
              Enter Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#hero"
              className="inline-flex items-center gap-2 bg-bg-base border border-border-subtle text-text-primary font-bold text-sm px-7 py-3.5 rounded-xl transition shadow-2xs"
            >
              Back to top
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}