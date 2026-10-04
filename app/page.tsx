"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/Logo";
import { cx } from "@/lib/utils";

const apps = [
  { href: "/control", app: "control" as const, qui: "Administration", desc: "Dossiers, clients, compagnies, livreurs, comptabilité" },
  { href: "/go", app: "go" as const, qui: "Livreurs", desc: "Connexion PIN, scanner, workflow de livraison" },
  { href: "/track", app: "track" as const, qui: "Compagnies & aéroport", desc: "Déclaration des bagages et suivi des dossiers" },
];

const SPLASH_MS = 3000;

export default function Home() {
  const [splash, setSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setSplash(false), SPLASH_MS); return () => clearTimeout(t); }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* ── Ouverture : logo global 3 s ── */}
      {splash && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-paper">
          <div className="overflow-hidden px-4 pb-2">
            <AppLogo app="global" className="h-auto w-[min(78vw,420px)] animate-splash-logo" />
          </div>
          <div className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-black/10">
            <div className="h-full origin-left animate-splash-bar rounded-full bg-gradient-to-r from-navy to-brand-blue rtl:origin-right" />
          </div>
        </div>
      )}

      {/* ── Les 3 espaces ── */}
      <div className={cx("mx-auto w-full max-w-5xl text-center", splash && "invisible")}>
        {!splash && (
          <>
            <AppLogo app="global" className="mx-auto h-28 w-auto animate-fade-up sm:h-32" />
            <p className="mx-auto mt-4 max-w-md animate-fade-up text-ink/60 [animation-delay:.1s]">Livraison à domicile des bagages récupérés en compagnie — Djibouti.</p>
            <div className="mt-3 animate-fade-up text-xs font-bold uppercase tracking-[0.25em] text-accent [animation-delay:.15s]">Choisissez votre espace</div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {apps.map((a, i) => (
                <Link key={a.href} href={a.href} style={{ animationDelay: `${0.2 + i * 0.12}s` }}
                  className="group relative flex animate-fade-up flex-col items-center overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-6 text-center shadow-soft transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-navy/30 hover:shadow-lift dark:hover:border-navy-400/40">
                  <div className="relative flex h-40 w-full items-center justify-center">
                    <AppLogo app={a.app} className="h-auto max-h-40 w-auto max-w-[85%]" />
                  </div>
                  <div className="relative mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{a.qui}</div>
                  <p className="relative mt-1.5 text-sm text-ink/60">{a.desc}</p>
                  <span className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-snow transition-colors duration-300 group-hover:bg-navy-700 dark:bg-navy-600 dark:group-hover:bg-navy-500">
                    <span>Accéder</span><span className="rtl:rotate-180">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
