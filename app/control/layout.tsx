"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/Logo";
import Icon from "@/components/Icon";
import { Loading } from "@/components/ui";
import { deconnexion, useProfil } from "@/lib/useSession";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/control", label: "Dashboard", icon: "dashboard" },
  { href: "/control/dossiers", label: "Dossiers", icon: "folder" },
  { href: "/control/clients", label: "Clients", icon: "users" },
  { href: "/control/compagnies", label: "Compagnies", icon: "plane" },
  { href: "/control/livreurs", label: "Livreurs", icon: "truck" },
  { href: "/control/comptabilite", label: "Comptabilité", icon: "wallet" },
  { href: "/control/rapports", label: "Rapports", icon: "chart" },
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
    <nav className="space-y-1">
      {NAV.map((n, i) => (
        <Link key={n.href} href={n.href} onClick={() => setMenu(false)} style={{ animationDelay: `${i * 0.04}s` }}
          className={cx("group relative flex animate-fade-up items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
            actif(n.href)
              ? "bg-gradient-to-r from-navy-600 to-navy-900 text-snow shadow-[0_10px_24px_-10px_rgb(11_42_91/0.7)]"
              : "text-ink/65 hover:bg-black/[0.04] hover:text-ink")}>
          <Icon name={n.icon} className={cx("transition-transform duration-200", !actif(n.href) && "group-hover:scale-110")} />
          {n.label}
          {actif(n.href) && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-brand-sun rtl:left-3 rtl:right-auto" />}
        </Link>
      ))}
    </nav>
  );

  const user = (
    <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 font-bold text-snow" data-no-i18n>
        {(profil.nom ?? "A").slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold" data-no-i18n>{profil.nom}</div>
        <button onClick={() => deconnexion("control")} className="flex items-center gap-1 text-xs font-semibold text-ink/50 transition hover:text-red-600">
          <Icon name="logout" className="h-3.5 w-3.5 rtl:rotate-180" />Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/[0.06] bg-white/80 p-4 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:flex rtl:border-l rtl:border-r-0 lg:rtl:right-0">
        <Link href="/control" className="mb-6 mt-1 flex justify-center"><AppLogo app="control" className="h-20 w-auto transition-transform hover:scale-105" /></Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {user}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/[0.06] bg-white/85 px-4 py-2 backdrop-blur-xl lg:hidden">
        <Link href="/control"><AppLogo app="control" className="h-12 w-auto" /></Link>
        <button onClick={() => setMenu(!menu)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition active:scale-95" aria-label="Menu">
          <Icon name={menu ? "close" : "menu"} />
        </button>
      </header>
      {menu && (
        <div className="fixed inset-x-0 top-[65px] z-40 animate-fade-in border-b border-black/10 bg-white p-4 shadow-lift lg:hidden">
          {nav}
          <div className="mt-4">{user}</div>
        </div>
      )}
      <main key={path} className="min-w-0 flex-1 animate-fade-up px-4 py-6 lg:ml-64 lg:px-10 lg:py-8 lg:rtl:ml-0 lg:rtl:mr-64">{children}</main>
    </div>
  );
}
