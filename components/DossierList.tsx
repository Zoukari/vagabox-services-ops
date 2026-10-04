"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { App, sb } from "@/lib/supabase";
import { STATUTS, STATUTS_ORDRE } from "@/lib/constants";
import { DossierVue } from "@/lib/types";
import { dateHeure, debutJourISO, fdj, nomComplet } from "@/lib/utils";
import { Card, Empty, Input, Loading, Select, StatutBadge } from "./ui";
import Timer from "./Timer";

interface Props {
  app: App;
  basePath: string;           // /control/dossiers | /track/dossiers
  showCompagnie?: boolean;
  showLivreur?: boolean;
  showPrix?: boolean;
  initialStatut?: string;
  initialCompagnie?: string;
}

/** Liste filtrable (statut / compagnie / livreur / dates / recherche). RLS filtre déjà selon le rôle. */
export default function DossierList({ app, basePath, showCompagnie = true, showLivreur = true, showPrix = true, initialStatut = "", initialCompagnie = "" }: Props) {
  const [rows, setRows] = useState<DossierVue[] | null>(null);
  const [statut, setStatut] = useState(initialStatut);
  const [compagnie, setCompagnie] = useState(initialCompagnie);
  const [livreur, setLivreur] = useState("");
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [q, setQ] = useState("");
  const [compagnies, setCompagnies] = useState<{ id: string; nom: string }[]>([]);
  const [livreurs, setLivreurs] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    if (showCompagnie) sb(app).from("compagnies").select("id, nom").order("nom").then(({ data }) => setCompagnies(data ?? []));
    if (showLivreur) sb(app).from("livreurs").select("id, nom").order("nom").then(({ data }) => setLivreurs(data ?? []));
  }, [app, showCompagnie, showLivreur]);

  const load = useCallback(async () => {
    let req = sb(app).from("dossiers_vue").select("*").order("created_at", { ascending: false }).limit(500);
    if (statut === "retard") req = req.eq("en_retard", true);
    else if (statut) req = req.eq("statut", statut);
    if (compagnie) req = req.eq("compagnie_id", compagnie);
    if (livreur === "aucun") req = req.is("livreur_id", null);
    else if (livreur) req = req.eq("livreur_id", livreur);
    if (du) req = req.gte("created_at", debutJourISO(du));
    if (au) req = req.lt("created_at", new Date(new Date(debutJourISO(au)).getTime() + 86400000).toISOString());
    const { data } = await req;
    setRows((data as DossierVue[]) ?? []);
  }, [app, statut, compagnie, livreur, du, au]);

  useEffect(() => { setRows(null); load(); }, [load]);
  useEffect(() => { const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  const filtres = useMemo(() => {
    if (!rows) return null;
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((d) =>
      [d.numero_dossier, d.tag_iata, d.client_nom, d.client_prenom, d.client_telephone, d.quartier]
        .some((v) => v?.toLowerCase().includes(s)));
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <Input placeholder="Rechercher n°, tag, client, tél…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:col-span-2" />
        <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS_ORDRE.map((s) => <option key={s} value={s}>{STATUTS[s].label}</option>)}
          <option value="retard">⚠ En retard</option>
        </Select>
        {showCompagnie && (
          <Select value={compagnie} onChange={(e) => setCompagnie(e.target.value)}>
            <option value="">Toutes compagnies</option>
            {compagnies.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Select>
        )}
        {showLivreur && (
          <Select value={livreur} onChange={(e) => setLivreur(e.target.value)}>
            <option value="">Tous livreurs</option>
            <option value="aucun">Non assigné</option>
            {livreurs.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </Select>
        )}
        <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2">
          <Input type="date" value={du} onChange={(e) => setDu(e.target.value)} title="Du" />
          <Input type="date" value={au} onChange={(e) => setAu(e.target.value)} title="Au" />
        </div>
      </div>

      <Card className="overflow-hidden">
        {!filtres ? <Loading /> : filtres.length === 0 ? <Empty>Aucun dossier</Empty> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="tbl">
                <thead><tr>
                  <th>Dossier</th><th>Client</th><th>Quartier</th>
                  {showCompagnie && <th>Compagnie</th>}{showLivreur && <th>Livreur</th>}
                  <th>Statut</th>{showPrix && <th className="text-right">Prix</th>}<th>Créé</th>
                </tr></thead>
                <tbody>
                  {filtres.map((d) => (
                    <tr key={d.id} className="cursor-pointer" onClick={() => (window.location.href = `${basePath}/${d.id}`)}>
                      <td><Link href={`${basePath}/${d.id}`} className="font-mono font-semibold text-ink hover:text-accent-dark">{d.numero_dossier}</Link>
                        {d.tag_iata && <div className="font-mono text-xs text-ink/50">{d.tag_iata}</div>}</td>
                      <td>{nomComplet(d.client_nom, d.client_prenom)}<div className="text-xs text-ink/50">{d.client_telephone}</div></td>
                      <td className="text-ink/70">{d.quartier ?? "—"}</td>
                      {showCompagnie && <td>{d.compagnie_code ?? d.compagnie_nom}</td>}
                      {showLivreur && <td>{d.livreur_nom ?? <span className="text-ink/40">—</span>}</td>}
                      <td><div className="flex flex-wrap items-center gap-1"><StatutBadge statut={d.statut} retard={d.en_retard} />
                        {d.statut === "en_livraison" && <Timer depuis={d.en_livraison_depuis} />}</div></td>
                      {showPrix && <td className="text-right tabular-nums">{fdj(d.prix_fdj)}</td>}
                      <td className="whitespace-nowrap text-xs text-ink/60">{dateHeure(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-black/5 md:hidden">
              {filtres.map((d) => (
                <li key={d.id}>
                  <Link href={`${basePath}/${d.id}`} className="block p-3 active:bg-black/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{d.numero_dossier}</span>
                      <StatutBadge statut={d.statut} retard={d.en_retard} />
                    </div>
                    <div className="mt-1 text-sm">{nomComplet(d.client_nom, d.client_prenom)} · <span className="text-ink/60">{d.quartier}</span></div>
                    <div className="text-xs text-ink/50">{d.compagnie_nom}{d.livreur_nom && ` · ${d.livreur_nom}`} · {dateHeure(d.created_at)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      {filtres && <p className="text-xs text-ink/50">{filtres.length} dossier(s)</p>}
    </div>
  );
}
