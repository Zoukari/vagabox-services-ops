"use client";
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect } from "react";
import { cx } from "@/lib/utils";
import { QUARTIERS, STATUTS, Statut } from "@/lib/constants";

type BtnVariant = "primary" | "dark" | "ghost" | "danger" | "outline" | "success";
export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const v: Record<BtnVariant, string> = {
    primary: "shine bg-gradient-to-br from-navy-600 via-navy to-navy-900 text-snow shadow-[0_8px_20px_-8px_rgb(11_42_91/0.6)] hover:shadow-[0_12px_28px_-8px_rgb(11_42_91/0.7)] hover:-translate-y-px dark:from-navy-500 dark:via-navy-600 dark:to-navy-700",
    dark: "shine bg-night text-snow hover:bg-ink-2 dark:bg-white dark:text-ink dark:hover:bg-white/90 border border-black/10",
    ghost: "bg-transparent text-ink hover:bg-black/5",
    outline: "border border-black/15 bg-white text-ink hover:border-accent/50 hover:bg-navy-50 dark:hover:bg-white/5",
    danger: "shine bg-gradient-to-br from-red-500 to-red-700 text-snow hover:-translate-y-px",
    success: "shine bg-gradient-to-br from-emerald-500 to-green-700 text-snow hover:-translate-y-px",
  };
  const s = { sm: "h-8 px-3 text-xs", md: "h-11 px-5 text-sm", lg: "h-14 px-6 text-base" }[size];
  return (
    <button {...p} disabled={disabled || loading}
      className={cx("inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[.97] disabled:pointer-events-none disabled:opacity-50", v[variant], s, className)}>
      {loading && <Spinner className="h-4 w-4" />}{children}
    </button>
  );
}

const inputCls = "w-full rounded-xl border border-black/10 bg-white px-3.5 h-11 text-sm text-ink shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] outline-none transition placeholder:text-ink/35 hover:border-black/20 focus:border-accent focus:shadow-glow";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cx(inputCls, className)} />;
});
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(inputCls, "cursor-pointer pr-9", className)}>{children}</select>;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, "h-auto min-h-[84px] py-2.5", className)} />;
}
export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx("group block", className)}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/55 transition group-focus-within:text-accent">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}
export function QuartierSelect(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select {...p}>
      <option value="">— Quartier —</option>
      {Object.entries(QUARTIERS).map(([zone, qs]) => (
        <optgroup key={zone} label={zone} data-no-i18n>{qs.map((q) => <option key={q} value={q} data-no-i18n>{q}</option>)}</optgroup>
      ))}
    </Select>
  );
}

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div className={cx("rounded-2xl border border-black/[0.07] bg-white shadow-soft transition-all duration-300",
      hover && "hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lift", className)}>
      {children}
    </div>
  );
}

/** Titre de section dans une carte */
export function CardTitle({ children, icon, action }: { children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] px-5 py-3.5">
      <h2 className="flex items-center gap-2.5 font-bold">
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-base text-navy dark:bg-white/5 dark:text-navy-200">{icon}</span>}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function StatutBadge({ statut, retard, className }: { statut: Statut; retard?: boolean; className?: string }) {
  const s = STATUTS[statut];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", s.bg, s.text, className)}>
      <span className="relative flex h-2 w-2">
        {(statut === "en_livraison" || retard) && <span className={cx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", retard ? "bg-red-500" : s.dot)} />}
        <span className={cx("relative inline-flex h-2 w-2 rounded-full", s.dot)} />
      </span>
      {s.label}
      {retard && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold uppercase text-snow">Retard</span>}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", className ?? "h-5 w-5")} />;
}
export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-accent">
      <span className="relative flex h-10 w-10">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/30" />
        <Spinner className="relative h-10 w-10 border-[3px]" />
      </span>
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center text-sm text-ink/50">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] text-xl">∅</span>
      {children}
    </div>
  );
}
export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "warn"; children: ReactNode }) {
  if (!children) return null;
  const c = { error: "bg-red-50 text-red-800 border-red-200", ok: "bg-green-50 text-green-800 border-green-200", warn: "bg-amber-50 text-amber-900 border-amber-200" }[kind];
  const i = { error: "⚠", ok: "✓", warn: "!" }[kind];
  return (
    <div className={cx("flex animate-fade-up items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm", c)}>
      <span className="font-bold">{i}</span><div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex animate-fade-in items-end justify-center bg-night/45 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={cx("max-h-[88vh] max-h-[88dvh] w-full animate-slide-up overflow-y-auto overscroll-contain rounded-t-3xl border border-black/10 bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift [-webkit-overflow-scrolling:touch] sm:animate-scale-in sm:rounded-3xl", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10 sm:hidden" />
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:rotate-90 hover:bg-black/5 hover:text-ink" aria-label="Fermer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value, tone, sub, icon }: { label: string; value: ReactNode; tone?: string; sub?: string; icon?: ReactNode }) {
  return (
    <Card hover className="group relative overflow-hidden p-5">
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-navy-100 to-transparent opacity-70 transition-transform duration-500 group-hover:scale-150 dark:from-navy-700/40" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink/50">{label}</div>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <div className={cx("relative mt-2 font-display text-3xl font-extrabold tabular-nums", tone ?? "text-ink")}>{value}</div>
      {sub && <div className="relative mt-1 text-xs text-ink/50">{sub}</div>}
    </Card>
  );
}

export function PageHeader({ title, children, sub }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink/55">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
