import Link from "next/link";
import Logo from "@/components/Logo";

const apps = [
  { href: "/control", nom: "VS Control", qui: "Administration", desc: "Dossiers, clients, compagnies, livreurs, comptabilité", icon: "🧭" },
  { href: "/go", nom: "VS Go", qui: "Livreurs", desc: "Connexion PIN, scanner, workflow de livraison", icon: "🛵" },
  { href: "/track", nom: "VS Track", qui: "Compagnies aériennes", desc: "Suivi en lecture seule de vos dossiers", icon: "✈️" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Logo dark />
        <h1 className="mt-10 text-3xl font-bold sm:text-4xl">Plateforme opérations</h1>
        <p className="mt-2 text-white/60">Livraison à domicile des bagages récupérés en compagnie — Djibouti.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {apps.map((a) => (
            <Link key={a.href} href={a.href}
              className="group rounded-2xl border border-white/10 bg-ink-2 p-5 transition hover:border-accent">
              <div className="text-3xl">{a.icon}</div>
              <div className="mt-3 text-lg font-bold group-hover:text-accent">{a.nom}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">{a.qui}</div>
              <p className="mt-2 text-sm text-white/70">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
