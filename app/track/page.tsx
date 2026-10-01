"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { STATUTS, Statut } from "@/lib/constants";
import { DossierVue } from "@/lib/types";
import { dateHeure, moisLabel, nomComplet } from "@/lib/utils";
import { Card, Empty, Input, Kpi, Loading, PageHeader, StatutBadge } from "@/components/ui";

export default function TrackDashboard() {
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<DossierVue[] | null>(null);

  useEffect(() => {
    setRows(null);
    const debut = new Date(`${mois}-01T00:00:00+03:00`);
    const fin = new Date(debut); fin.setMonth(fin.getMonth() + 1);
    sb("track").from("dossiers_vue").select("*").gte("created_at", debut.toISOString()).lt("created_at", fin.toISOString())
      .order("updated_at", { ascending: false }).then(({ data }) => setRows((data as DossierVue[]) ?? []));
  }, [mois]);

  if (!rows) return <Loading />;
  const n = (s: Statut[]) => rows.filter((d) => s.includes(d.statut)).length;
  const livres = n(["livre"]);
  const taux = rows.length ? Math.round((livres / rows.length) * 100) : 0;
  const parStatut = (Object.keys(STATUTS) as Statut[]).map((s) => ({ s, c: n([s]) })).filter((x) => x.c > 0);

  return (
    <>
      <PageHeader title="Tableau de bord" sub={`Statistiques de ${moisLabel(mois)}`}>
        <Input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} className="w-44" />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Dossiers confiés" value={rows.length} />
        <Kpi label="Livrés" value={livres} tone="text-green-600" sub={`${taux}% de réussite`} />
        <Kpi label="En cours" value={n(["a_recuperer", "recupere", "en_livraison", "replanifie"])} tone="text-orange-600" />
        <Kpi label="Non trouvés" value={n(["non_trouve"])} tone="text-red-600" sub={n(["signalement"]) ? `${n(["signalement"])} signalement(s)` : undefined} />
      </div>

      {parStatut.length > 0 && (
        <Card className="mt-5 p-4">
          <div className="flex h-3 overflow-hidden rounded-full">
            {parStatut.map(({ s, c }) => <div key={s} style={{ width: `${(c / rows.length) * 100}%`, background: STATUTS[s].couleur }} title={`${STATUTS[s].label} : ${c}`} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {parStatut.map(({ s, c }) => (
              <span key={s} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUTS[s].couleur }} />{STATUTS[s].label} <b>{c}</b></span>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-5">
        <div className="border-b border-black/5 px-4 py-3 font-bold">Dernières mises à jour</div>
        {rows.length === 0 ? <Empty>Aucun dossier ce mois-ci</Empty> : (
          <ul className="divide-y divide-black/5">
            {rows.slice(0, 15).map((d) => (
              <li key={d.id}>
                <Link href={`/track/dossiers/${d.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-black/[0.02]">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold">{d.numero_dossier} {d.tag_iata && <span className="font-normal text-ink/50">· {d.tag_iata}</span>}</div>
                    <div className="truncate text-xs text-ink/60">{nomComplet(d.client_nom, d.client_prenom)} · {d.quartier} · {dateHeure(d.updated_at)}</div>
                  </div>
                  <StatutBadge statut={d.statut} retard={d.en_retard} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
