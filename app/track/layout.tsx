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
    ...(estSaisie(profil) ? [{ href: "/track/declarer", label: "Déclarer un bagage", cta: true, icon: "plus" }] : []),
    { href: "/track", label: "Dashboard", icon: "dashboard" },
    { href: "/track/dossiers", label: "Dossiers", icon: "folder" },
  ];
  return (
    <TrackCtx.Provider value={profil}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
            <Link href="/track" className="flex items-center gap-3">
              <AppLogo app="track" className="h-14 w-auto" />
              {cie && <span className="hidden rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy dark:bg-white/5 dark:text-navy-200 sm:block" data-no-i18n>{cie}</span>}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5">
              {nav.map((n) => {
                const a = n.href === "/track" ? path === n.href : path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href}
                    className={cx("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                      "cta" in n
                        ? "shine bg-gradient-to-r from-brand-blue to-navy-800 text-snow shadow-md hover:-translate-y-px"
                        : a ? "bg-navy text-snow dark:bg-navy-600" : "text-ink/65 hover:bg-black/5 hover:text-ink")}>
                    {"icon" in n && <Icon name={n.icon as string} className="h-4 w-4" />}{n.label}
                  </Link>
                );
              })}
              <button onClick={() => deconnexion("track")} className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink/60 transition hover:text-red-600" aria-label="Déconnexion">
                <Icon name="logout" className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </header>
        <main key={path} className="mx-auto max-w-6xl animate-fade-up px-4 py-6 lg:py-8">{children}</main>
      </div>
    </TrackCtx.Provider>
  );
}
