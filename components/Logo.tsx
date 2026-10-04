import { cx } from "@/lib/utils";

export type AppLogo = "control" | "go" | "track" | "global" | "mark";
const ALT: Record<AppLogo, string> = {
  control: "VS Control", go: "VS Go", track: "VS Track", global: "Vagabox Services", mark: "Vagabox Services",
};

/** Logos officiels (PNG/WebP transparents) */
export function AppLogo({ app, className }: { app: AppLogo; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logos/vs-${app}.webp`} alt={ALT[app]} data-no-i18n
    className={cx("select-none", className ?? "h-12 w-auto")} draggable={false} />;
}

export default function Logo({ className, app = "global", sub }: { className?: string; app?: AppLogo; sub?: string; dark?: boolean }) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <AppLogo app={app} />
      {sub && <span className="hidden text-xs font-semibold uppercase tracking-widest text-ink/50 sm:block">{sub}</span>}
    </div>
  );
}
