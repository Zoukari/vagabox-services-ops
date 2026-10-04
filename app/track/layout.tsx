"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
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
    ...(estSaisie(profil) ? [{ href: "/track/declarer", label: "+ Déclarer un bagage", cta: true }] : []),
    { href: "/track", label: "Dashboard" },
    { href: "/track/dossiers", label: "Dossiers" },
  ];
  return (
    <TrackCtx.Provider value={profil}>
      <div className="min-h-screen">
        <header className="bg-black">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
            <Logo app="track" sub={cie} />
            <div className="flex flex-wrap items-center gap-1">
              {nav.map((n) => {
                const a = n.href === "/track" ? path === n.href : path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href}
                    className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold",
                      a ? "bg-accent text-ink" : "cta" in n ? "bg-blue-600 text-white hover:bg-blue-500" : "text-white/70 hover:text-white")}>
                    {n.label}
                  </Link>
                );
              })}
              <button onClick={() => deconnexion("track")} className="ml-2 text-sm text-white/50 hover:text-white">Déconnexion</button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </TrackCtx.Provider>
  );
}
