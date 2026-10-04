"use client";
import { useEffect, useRef, useState } from "react";
import { LANGS, useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cx } from "@/lib/utils";

/** Boutons flottants bas-droite : langue (au-dessus) + thème clair/sombre (rond). */
export default function FloatingControls() {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const btn = "flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-lift backdrop-blur transition hover:-translate-y-0.5 hover:border-accent/40 active:scale-95";
  const courant = LANGS.find((l) => l.code === lang)!;

  return (
    <div ref={ref} dir="ltr" data-no-i18n
      className="fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 rtl:left-4 rtl:right-auto rtl:items-start sm:rtl:left-6 print:hidden">
      <div className="relative">
        {open && (
          <div className="absolute bottom-14 right-0 rtl:left-0 rtl:right-auto w-40 animate-scale-in overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-lift">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                className={cx("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition",
                  l.code === lang ? "bg-navy text-snow" : "text-ink hover:bg-black/5")}>
                <span>{l.label}</span><span className="text-xs opacity-60">{l.court}</span>
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(!open)} className={cx(btn, "text-sm font-extrabold")}
          aria-label={lang === "fr" ? "Changer de langue" : lang === "en" ? "Change language" : "تغيير اللغة"}>
          {courant.court}
        </button>
      </div>
      <button onClick={toggle} className={cx(btn, "relative overflow-hidden")}
        aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
        <span className={cx("absolute transition-all duration-500", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        </span>
        <span className={cx("absolute transition-all duration-500", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
        </span>
      </button>
    </div>
  );
}
