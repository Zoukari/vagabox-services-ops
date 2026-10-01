"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Loading } from "@/components/ui";
import { sb } from "@/lib/supabase";
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
  const nav = [{ href: "/track", label: "Dashboard" }, { href: "/track/dossiers", label: "Dossiers" }];
  return (
    <div className="min-h-screen">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo dark sub={cie ? `VS Track · ${cie}` : "VS Track"} />
          <div className="flex items-center gap-1">
            {nav.map((n) => {
              const a = n.href === "/track" ? path === n.href : path.startsWith(n.href);
              return <Link key={n.href} href={n.href} className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", a ? "bg-accent text-ink" : "text-white/70 hover:text-white")}>{n.label}</Link>;
            })}
            <button onClick={() => deconnexion("track")} className="ml-2 text-sm text-white/50 hover:text-white">Déconnexion</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
