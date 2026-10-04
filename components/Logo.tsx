import { cx } from "@/lib/utils";

export type AppLogo = "control" | "go" | "track";
const ALT: Record<AppLogo, string> = { control: "Vagabox VS Control", go: "Vagabox VS Go", track: "Vagabox VS Track" };

/** Logo officiel d'une interface (fond noir intégré → à poser sur fond noir). */
export function AppLogo({ app, className }: { app: AppLogo; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logos/vs-${app}.webp`} alt={ALT[app]} className={cx("h-14 w-auto select-none", className)} draggable={false} />;
}

export default function Logo({ dark, sub, className, app }: { dark?: boolean; sub?: string; className?: string; app?: AppLogo }) {
  if (app) {
    return (
      <div className={cx("flex items-center gap-3", className)}>
        <AppLogo app={app} />
        {sub && <span className="hidden text-xs font-semibold uppercase tracking-widest text-white/60 sm:block">{sub}</span>}
      </div>
    );
  }
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
