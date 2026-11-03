"use client";
import { useEffect, useState } from "react";
import InfosDeclaration from "@/components/InfosDeclaration";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { DossierVue } from "@/lib/types";
import { dateHeure, nomComplet } from "@/lib/utils";
import { Card, Loading, StatutBadge } from "@/components/ui";
import StatusTimeline from "@/components/StatusTimeline";
import ConfirmerArrivee from "@/components/ConfirmerArrivee";
import { estSaisie, useTrackProfil } from "@/lib/trackContext";

export default function TrackDossier() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<DossierVue | null>(null);
  const [refresh, setRefresh] = useState(0);
  const profil = useTrackProfil();
  const charger = () => sb("track").from("dossiers_vue").select("*").eq("id", id).single().then(({ data }) => setD(data as DossierVue));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [id]);
  if (!d) return <Loading />;
  return (
    <>
      <Link href="/track/dossiers" className="text-sm text-ink/60 hover:text-ink">← Dossiers</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{d.numero_dossier}</h1>
        <StatutBadge statut={d.statut} retard={d.en_retard} />
      </div>
      {d.statut === "saisi" && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-white/10">
          <p className="text-sm font-semibold text-sky-800">Dossier saisi — en attente de l&apos;arrivée de la valise à l&apos;aéroport.</p>
          {estSaisie(profil) && <div className="mt-3 max-w-md"><ConfirmerArrivee app="track" dossierId={d.id} nb={d.nb_valises} onDone={() => { charger(); setRefresh((r) => r + 1); }} /></div>}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="space-y-3 p-5">
          <Row l="Tag IATA" v={<span className="font-mono">{d.tag_iata ?? "—"}</span>} />
          <Row l="Passager" v={nomComplet(d.client_nom, d.client_prenom)} />
          <Row l="Compagnie" v={d.compagnie_nom} />
          <Row l="Quartier" v={d.quartier ?? "—"} />
          <Row l="Livreur" v={d.livreur_nom ?? "—"} />
          <Row l="Créé le" v={dateHeure(d.created_at)} />
          {d.date_livraison && <Row l="Livré le" v={dateHeure(d.date_livraison)} />}
          <InfosDeclaration d={d} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Chronologie</h2>
          <StatusTimeline app="track" dossierId={d.id} refresh={refresh} />
        </Card>
      </div>
    </>
  );
}
function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return <div><div className="text-xs font-semibold uppercase tracking-wide text-ink/50">{l}</div><div className="font-semibold">{v}</div></div>;
}
