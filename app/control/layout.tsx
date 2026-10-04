"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { Loading } from "@/components/ui";
import { deconnexion, useProfil } from "@/lib/useSession";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/control", label: "Dashboard", icon: "◧" },
  { href: "/control/dossiers", label: "Dossiers", icon: "▤" },
  { href: "/control/clients", label: "Clients", icon: "☺" },
  { href: "/control/compagnies", label: "Compagnies", icon: "✈" },
  { href: "/control/livreurs", label: "Livreurs", icon: "➜" },
  { href: "/control/comptabilite", label: "Comptabilité", icon: "₣" },
  { href: "/control/rapports", label: "Rapports", icon: "▥" },
];

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/control/login") || path.startsWith("/control/setup")) return <>{children}</>;
  return <Shell path={path}>{children}</Shell>;
}

function Shell({ children, path }: { children: React.ReactNode; path: string }) {
  const profil = useProfil("control", "admin");
  const [menu, setMenu] = useState(false);
  if (!profil) return <Loading />;
  const actif = (h: string) => (h === "/control" ? path === h : path.startsWith(h));

  const nav = (
    <nav className="space-y-0.5">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setMenu(false)}
          className={cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
            actif(n.href) ? "bg-accent text-ink" : "text-white/70 hover:bg-white/5 hover:text-white")}>
          <span className="w-4 text-center">{n.icon}</span>{n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-black p-4 lg:flex lg:fixed lg:inset-y-0">
        <Logo app="control" className="justify-center" />
        <div className="mt-6 flex-1">{nav}</div>
        <div className="border-t border-white/10 pt-3 text-xs text-white/50">
          {profil.nom}
          <button onClick={() => deconnexion("control")} className="mt-1 block text-white/70 hover:text-accent">Déconnexion</button>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-black px-4 py-2 lg:hidden">
        <Logo app="control" />
        <button onClick={() => setMenu(!menu)} className="rounded-lg px-3 py-1.5 text-white ring-1 ring-white/20">☰</button>
      </header>
      {menu && (
        <div className="fixed inset-x-0 top-[72px] z-30 bg-black p-4 shadow-xl lg:hidden">
          {nav}
          <button onClick={() => deconnexion("control")} className="mt-3 px-3 text-sm text-white/70">Déconnexion</button>
        </div>
      )}
      <main className="min-w-0 flex-1 px-4 py-6 lg:ml-60 lg:px-8">{children}</main>
    </div>
  );
}
