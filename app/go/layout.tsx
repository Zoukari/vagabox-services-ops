"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
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
  return (
    <Ctx.Provider value={profil}>
      <div className="mx-auto min-h-[100dvh] max-w-lg bg-paper pb-24">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-black px-4 py-2">
          <Logo app="go" />
          <span className="truncate px-2 text-sm font-semibold text-white/80">{profil.nom}</span>
          <button onClick={() => deconnexion("go")} className="text-sm text-white/60">Quitter</button>
        </header>
        <div className="px-4 py-4">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)]">
          {[
            { href: "/go", label: "Mes dossiers", icon: "▤" },
            { href: "/go/scanner", label: "Scanner", icon: "⌁" },
          ].map((n) => {
            const a = n.href === "/go" ? path === "/go" || path.startsWith("/go/dossiers") : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cx("flex flex-1 flex-col items-center py-2.5 text-xs font-semibold", a ? "text-accent-dark" : "text-ink/50")}>
                <span className="text-xl leading-none">{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </Ctx.Provider>
  );
}
