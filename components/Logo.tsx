import { cx } from "@/lib/utils";

export default function Logo({ dark, sub, className }: { dark?: boolean; sub?: string; className?: string }) {
  return (
    <div className={cx("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-ink">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M9 12h6" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={cx("block text-base font-extrabold tracking-tight", dark ? "text-white" : "text-ink")}>Vagabox Services</span>
        {sub && <span className={cx("block text-[11px] font-semibold uppercase tracking-widest", dark ? "text-accent" : "text-accent-dark")}>{sub}</span>}
      </span>
    </div>
  );
}
