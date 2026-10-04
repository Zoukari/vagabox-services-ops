import Link from "next/link";
import { AppLogo } from "@/components/Logo";

const apps = [
  { href: "/control", app: "control" as const, qui: "Administration", desc: "Dossiers, clients, compagnies, livreurs, comptabilité" },
  { href: "/go", app: "go" as const, qui: "Livreurs", desc: "Connexion PIN, scanner, workflow de livraison" },
  { href: "/track", app: "track" as const, qui: "Compagnies & aéroport", desc: "Déclaration des bagages et suivi des dossiers" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Vagabox Services</h1>
        <p className="mt-2 text-white/60">Livraison à domicile des bagages récupérés en compagnie — Djibouti.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {apps.map((a) => (
            <Link key={a.href} href={a.href}
              className="group flex flex-col items-center rounded-2xl border border-white/10 bg-black px-4 pb-5 pt-4 text-center transition hover:-translate-y-0.5 hover:border-accent">
              <AppLogo app={a.app} className="h-auto w-full max-w-[220px]" />
              <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">{a.qui}</div>
              <p className="mt-1 text-sm text-white/60">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
