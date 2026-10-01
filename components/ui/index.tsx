"use client";
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect } from "react";
import { cx } from "@/lib/utils";
import { QUARTIERS, STATUTS, Statut } from "@/lib/constants";

type BtnVariant = "primary" | "dark" | "ghost" | "danger" | "outline" | "success";
export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const v: Record<BtnVariant, string> = {
    primary: "bg-accent text-ink hover:bg-accent-dark",
    dark: "bg-ink text-white hover:bg-ink-2",
    ghost: "bg-transparent text-ink hover:bg-black/5",
    outline: "border border-black/15 bg-white text-ink hover:bg-black/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  };
  const s = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-14 px-5 text-base" }[size];
  return (
    <button {...p} disabled={disabled || loading}
      className={cx("inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed", v[variant], s, className)}>
      {loading && <Spinner className="h-4 w-4" />}{children}
    </button>
  );
}

const inputCls = "w-full rounded-lg border border-black/15 bg-white px-3 h-10 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cx(inputCls, className)} />;
});
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(inputCls, "pr-8", className)}>{children}</select>;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, "h-auto min-h-[80px] py-2", className)} />;
}
export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}
export function QuartierSelect(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select {...p}>
      <option value="">— Quartier —</option>
      {Object.entries(QUARTIERS).map(([zone, qs]) => (
        <optgroup key={zone} label={zone}>{qs.map((q) => <option key={q} value={q}>{q}</option>)}</optgroup>
      ))}
    </Select>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl border border-black/10 bg-white", className)}>{children}</div>;
}

export function StatutBadge({ statut, retard, className }: { statut: Statut; retard?: boolean; className?: string }) {
  const s = STATUTS[statut];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", s.bg, s.text, className)}>
      <span className={cx("h-2 w-2 rounded-full", s.dot)} />
      {s.label}
      {retard && <span className="ml-1 rounded bg-red-600 px-1.5 text-[10px] font-bold uppercase text-white">Retard</span>}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", className ?? "h-5 w-5")} />;
}
export function Loading() {
  return <div className="flex justify-center py-16 text-ink/40"><Spinner className="h-7 w-7" /></div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-ink/50">{children}</div>;
}
export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "warn"; children: ReactNode }) {
  if (!children) return null;
  const c = { error: "bg-red-50 text-red-800 border-red-200", ok: "bg-green-50 text-green-800 border-green-200", warn: "bg-amber-50 text-amber-900 border-amber-200" }[kind];
  return <div className={cx("rounded-lg border px-3 py-2 text-sm", c)}>{children}</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink/50 hover:bg-black/5" aria-label="Fermer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value, tone, sub }: { label: string; value: ReactNode; tone?: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</div>
      <div className={cx("mt-1 text-3xl font-bold tabular-nums", tone ?? "text-ink")}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink/50">{sub}</div>}
    </Card>
  );
}

export function PageHeader({ title, children, sub }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {sub && <p className="text-sm text-ink/60">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
