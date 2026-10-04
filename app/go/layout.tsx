"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/Logo";
import Icon from "@/components/Icon";
import { Loading } from "@/components/ui";
import { deconnexion, useProfil } from "@/lib/useSession";
import { LivreurCtx as Ctx } from "@/lib/goContext";
import { cx } from "@/lib/utils";

export default function GoLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/go/login")) return <>{children}</>;
  return <Shell path={path}>{children}</Shell>;
}

function Shell({ children, path }: { children: React.ReactNode; path: string }) {
  const profil = useProfil("go", "livreur");
  if (!profil) return <Loading />;
  const nav = [
    { href: "/go", label: "Mes dossiers", icon: "folder" },
    { href: "/go/scanner", label: "Scanner", icon: "scan" },
  ];
  return (
    <Ctx.Provider value={profil}>
      <div className="mx-auto min-h-[100dvh] max-w-lg pb-28">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white/85 px-4 py-2 backdrop-blur-xl">
          <Link href="/go"><AppLogo app="go" className="h-12 w-auto" /></Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold" data-no-i18n>{profil.nom}</span>
            <button onClick={() => deconnexion("go")} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink/60 transition hover:text-red-600 active:scale-95" aria-label="Quitter">
              <Icon name="logout" className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </header>
        <div key={path} className="animate-fade-up px-4 py-4">{children}</div>
        <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md gap-1 rounded-2xl border border-black/10 bg-white/90 p-1.5 shadow-lift backdrop-blur-xl pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
          {nav.map((n) => {
            const a = n.href === "/go" ? path === "/go" || path.startsWith("/go/dossiers") : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={cx("flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300",
                  a ? "bg-gradient-to-r from-navy-600 to-navy-900 text-snow shadow-md" : "text-ink/55 hover:bg-black/5")}>
                <Icon name={n.icon} className="h-5 w-5" />{n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </Ctx.Provider>
  );
}
