"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/Logo";
import Icon from "@/components/Icon";
import { Loading } from "@/components/ui";
import { sb } from "@/lib/supabase";
import { TrackCtx, estSaisie } from "@/lib/trackContext";
import { deconnexion, useProfil } from "@/lib/useSession";
import { cx } from "@/lib/utils";

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/track/login")) return <>{children}</>;
  return <Shell path={path}>{children}</Shell>;
}

function Shell({ children, path }: { children: React.ReactNode; path: string }) {
  const profil = useProfil("track", "compagnie");
  const [cie, setCie] = useState<string>("");
  useEffect(() => {
    if (profil?.compagnie_id) sb("track").from("compagnies").select("nom").eq("id", profil.compagnie_id).single().then(({ data }) => setCie(data?.nom ?? ""));
  }, [profil]);
  if (!profil) return <Loading />;
  const nav = [
    ...(estSaisie(profil) ? [{ href: "/track/declarer", label: "Déclarer un bagage", court: "Déclarer", cta: true, icon: "plus" }] : []),
    { href: "/track", label: "Dashboard", icon: "dashboard" },
    { href: "/track/dossiers", label: "Dossiers", icon: "folder" },
  ] as { href: string; label: string; court?: string; icon: string; cta?: boolean }[];
  const actif = (h: string) => (h === "/track" ? path === h : path.startsWith(h));
  return (
    <TrackCtx.Provider value={profil}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
            <Link href="/track" className="flex min-w-0 items-center gap-3">
              <AppLogo app="track" className="h-12 w-auto shrink-0 sm:h-14" />
              {cie && <span className="truncate rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy dark:bg-white/5 dark:text-navy-200" data-no-i18n>{cie}</span>}
            </Link>
            <div className="flex items-center gap-1.5">
              <nav className="hidden items-center gap-1.5 md:flex">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href}
                    className={cx("flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                      n.cta
                        ? "shine bg-gradient-to-r from-brand-blue to-navy-800 text-snow shadow-md hover:-translate-y-px"
                        : actif(n.href) ? "bg-navy text-snow dark:bg-navy-600" : "text-ink/65 hover:bg-black/5 hover:text-ink")}>
                    <Icon name={n.icon} className="h-4 w-4" />{n.label}
                  </Link>
                ))}
              </nav>
              <button onClick={() => deconnexion("track")} className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-ink/60 transition hover:text-red-600" aria-label="Déconnexion">
                <Icon name="logout" className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </header>
        <main key={path} className="mx-auto max-w-6xl animate-fade-up px-4 pb-32 pt-6 md:pb-10 lg:pt-8">{children}</main>

        {/* Barre d'onglets mobile */}
        <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md gap-1 rounded-2xl border border-black/10 bg-white/90 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-lift backdrop-blur-xl md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={cx("flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-bold transition-all duration-300",
                actif(n.href) ? "bg-gradient-to-r from-navy-600 to-navy-900 text-snow shadow-md"
                  : n.cta ? "text-brand-blue" : "text-ink/55 hover:bg-black/5")}>
              <Icon name={n.icon} className="h-5 w-5" /><span className="max-w-full truncate">{n.court ?? n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </TrackCtx.Provider>
  );
}
