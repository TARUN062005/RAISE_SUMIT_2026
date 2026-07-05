import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
  { label: "Documentation", href: "#features" },
  { label: "Workspace", href: "/workspace/dashboard" },
  { label: "GitHub", href: "https://github.com/TARUN062005/RAISE_SUMIT_2026" },
  { label: "Privacy", href: "#security" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary">
        <div>
          <span className="text-text-primary">RAISE Summit 2026</span>
          <span className="mx-2 opacity-60">/</span>
          <span>Powered by Vultr Serverless Inference</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {footerLinks.map((item) =>
            item.href.startsWith("http") ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">
                {item.label}
              </a>
            ) : item.href.startsWith("/") ? (
              <Link key={item.label} to={item.href} className="hover:text-text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="hover:text-text-primary transition-colors">
                {item.label}
              </a>
            )
          )}
        </div>
      </div>
    </footer>
  );
}