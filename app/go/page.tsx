"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { DossierVue } from "@/lib/types";
import { debutJourISO, nomComplet } from "@/lib/utils";
import { Empty, Loading, StatutBadge } from "@/components/ui";
import Timer from "@/components/Timer";
import { cx } from "@/lib/utils";

const ONGLETS = [
  { k: "afaire", label: "À faire", statuts: ["a_recuperer", "recupere", "replanifie"] },
  { k: "route", label: "En route", statuts: ["en_livraison"] },
  { k: "fini", label: "Terminés", statuts: ["livre", "non_trouve", "signalement"] },
] as const;

export default function MesDossiers() {
  const [rows, setRows] = useState<DossierVue[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["k"]>("afaire");

  const load = useCallback(async () => {
    const { data } = await sb("go").from("dossiers_vue").select("*")
      .or(`statut.in.(a_recuperer,recupere,replanifie,en_livraison),updated_at.gte.${debutJourISO()}`)
      .order("created_at", { ascending: true });
    setRows((data as DossierVue[]) ?? []);
  }, []);
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  if (!rows) return <Loading />;
  const tab = ONGLETS.find((o) => o.k === onglet)!;
  const liste = rows.filter((d) => (tab.statuts as readonly string[]).includes(d.statut));
  const compte = (o: (typeof ONGLETS)[number]) => rows.filter((d) => (o.statuts as readonly string[]).includes(d.statut)).length;

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-black/5 p-1">
        {ONGLETS.map((o) => (
          <button key={o.k} onClick={() => setOnglet(o.k)}
            className={cx("rounded-lg py-2 text-sm font-semibold", onglet === o.k ? "bg-white shadow-sm" : "text-ink/60")}>
            {o.label} <span className="text-ink/40">{compte(o)}</span>
          </button>
        ))}
      </div>
      {liste.length === 0 ? <Empty>Aucun dossier</Empty> : (
        <ul className="space-y-2.5">
          {liste.map((d) => (
            <li key={d.id}>
              <Link href={`/go/dossiers/${d.id}`}
                className={cx("block rounded-2xl border bg-white p-4 active:scale-[0.99]", d.en_retard ? "border-red-400" : "border-black/10")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-bold">{d.numero_dossier}</div>
                    <div className="text-lg font-semibold leading-tight">{nomComplet(d.client_nom, d.client_prenom)}</div>
                  </div>
                  <StatutBadge statut={d.statut} retard={d.en_retard} />
                </div>
                <div className="mt-2 text-sm text-ink/70">📍 {d.quartier ?? "—"}{d.client_adresse && ` — ${d.client_adresse}`}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-ink/50">
                  <span>{d.compagnie_nom}{d.tag_iata && ` · ${d.tag_iata}`}</span>
                  {d.statut === "en_livraison" && <Timer depuis={d.en_livraison_depuis} />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
