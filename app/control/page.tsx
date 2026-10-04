"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { DossierVue } from "@/lib/types";
import { debutJourISO, fdj, nomComplet } from "@/lib/utils";
import { Button, Card, Empty, Kpi, Loading, PageHeader, StatutBadge } from "@/components/ui";
import Timer from "@/components/Timer";

export default function Dashboard() {
  const [actifs, setActifs] = useState<DossierVue[] | null>(null);
  const [jour, setJour] = useState({ crees: 0, livres: 0, ca: 0, nonTrouves: 0 });

  const load = useCallback(async () => {
    const client = sb("control");
    const debut = debutJourISO();
    const [a, crees, livres] = await Promise.all([
      client.from("dossiers_vue").select("*").in("statut", ["a_recuperer", "recupere", "en_livraison", "replanifie", "signalement", "non_trouve"])
        .order("created_at", { ascending: false }),
      client.from("dossiers").select("id", { count: "exact", head: true }).gte("created_at", debut),
      client.from("dossiers").select("prix_fdj").eq("statut", "livre").gte("date_livraison", debut),
    ]);
    const rows = (a.data as DossierVue[]) ?? [];
    setActifs(rows);
    setJour({
      crees: crees.count ?? 0,
      livres: livres.data?.length ?? 0,
      ca: (livres.data ?? []).reduce((s, d) => s + (d.prix_fdj ?? 0), 0),
      nonTrouves: rows.filter((d) => d.statut === "non_trouve").length,
    });
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  if (!actifs) return <Loading />;
  const retard = actifs.filter((d) => d.en_retard);
  const enLivraison = actifs.filter((d) => d.statut === "en_livraison");
  const aRecup = actifs.filter((d) => d.statut === "a_recuperer");
  const nonAssignes = actifs.filter((d) => !d.livreur_id && d.statut !== "non_trouve");
  const signalements = actifs.filter((d) => d.statut === "signalement" || d.statut === "non_trouve");

  return (
    <>
      <PageHeader title="Dashboard" sub="Aujourd'hui — actualisé toutes les 30 s">
        <Link href="/control/dossiers/nouveau"><Button>+ Nouveau dossier</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="En cours" value={actifs.length - jour.nonTrouves} sub={`${aRecup.length} à récupérer`} />
        <Kpi label="En livraison" value={enLivraison.length} tone="text-orange-600" />
        <Kpi label="En retard" value={retard.length} tone={retard.length ? "text-red-600" : "text-ink"} sub="> 1h en livraison" />
        <Kpi label="Livrés aujourd'hui" value={jour.livres} tone="text-green-600" sub={`${jour.crees} créés aujourd'hui`} />
        <Kpi label="CA du jour" value={<span className="text-2xl">{fdj(jour.ca)}</span>} />
      </div>

      {retard.length > 0 && (
        <Card className="mt-5 border-red-300 bg-red-50 p-4">
          <h2 className="mb-2 font-bold text-red-800">⚠ Alertes retard ({retard.length})</h2>
          <ul className="space-y-1.5">
            {retard.map((d) => (
              <li key={d.id}>
                <Link href={`/control/dossiers/${d.id}`} className="flex flex-wrap items-center gap-2 text-sm hover:underline">
                  <span className="font-mono font-semibold">{d.numero_dossier}</span>
                  <span>{nomComplet(d.client_nom, d.client_prenom)} · {d.quartier}</span>
                  <span className="text-ink/60">— {d.livreur_nom}</span>
                  <Timer depuis={d.en_livraison_depuis} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Bloc titre="En livraison" items={enLivraison} timer />
        <Bloc titre="Non assignés" items={nonAssignes} vide="Tous les dossiers ont un livreur" />
        <Bloc titre="Signalements / non trouvés" items={signalements} vide="Rien à signaler" />
        <Bloc titre="À récupérer" items={aRecup} />
      </div>
    </>
  );
}

function Bloc({ titre, items, timer, vide = "Aucun dossier" }: { titre: string; items: DossierVue[]; timer?: boolean; vide?: string }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
        <h2 className="font-bold">{titre}</h2><span className="text-sm text-ink/50">{items.length}</span>
      </div>
      {items.length === 0 ? <Empty>{vide}</Empty> : (
        <ul className="max-h-80 divide-y divide-black/5 overflow-y-auto">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/control/dossiers/${d.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-black/[0.02]">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm font-semibold">{d.numero_dossier}</div>
                  <div className="truncate text-xs text-ink/60">{nomComplet(d.client_nom, d.client_prenom)} · {d.quartier} · {d.compagnie_code ?? d.compagnie_nom}{d.livreur_nom && ` · ${d.livreur_nom}`}</div>
                </div>
                <span className="shrink-0">{timer ? <Timer depuis={d.en_livraison_depuis} /> : <StatutBadge statut={d.statut} />}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
