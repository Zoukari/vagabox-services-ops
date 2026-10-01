"use client";
import { useEffect, useMemo, useState } from "react";
import { sb } from "@/lib/supabase";
import { Tarif } from "@/lib/types";
import { aujourdhui, fdj, moisLabel } from "@/lib/utils";
import { Button, Card, Empty, Input, Kpi, Loading, PageHeader } from "@/components/ui";

interface Row { id: string; statut: string; prix_fdj: number | null; compagnie_id: string; livreur_id: string | null; created_at: string; date_livraison: string | null }

const moisDe = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Africa/Djibouti" }).slice(0, 7);

export default function Rapports() {
  const [mois, setMois] = useState(() => aujourdhui().slice(0, 7));
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cies, setCies] = useState<Record<string, string>>({});
  const [livs, setLivs] = useState<Record<string, string>>({});
  const [forfaits, setForfaits] = useState<Tarif[]>([]);

  useEffect(() => {
    const c = sb("control");
    const debut12 = new Date(); debut12.setMonth(debut12.getMonth() - 11, 1); debut12.setHours(0, 0, 0, 0);
    Promise.all([
      c.from("dossiers").select("id, statut, prix_fdj, compagnie_id, livreur_id, created_at, date_livraison").gte("created_at", debut12.toISOString()).limit(20000),
      c.from("compagnies").select("id, nom"),
      c.from("livreurs").select("id, nom"),
      c.from("tarification").select("*").eq("type", "forfait_mensuel").eq("actif", true),
    ]).then(([d, co, l, t]) => {
      setRows((d.data as Row[]) ?? []);
      setCies(Object.fromEntries((co.data ?? []).map((x) => [x.id, x.nom])));
      setLivs(Object.fromEntries((l.data ?? []).map((x) => [x.id, x.nom])));
      setForfaits(t.data ?? []);
    });
  }, []);

  const stats = useMemo(() => {
    if (!rows) return null;
    // CA = dossiers livrés (mois de livraison) + forfaits mensuels actifs
    const livres = rows.filter((r) => r.statut === "livre" && r.date_livraison);
    const forfaitTotal = (m: string) => forfaits.filter((f) => f.date_debut.slice(0, 7) <= m).reduce((s, f) => s + f.prix_fdj, 0);

    const mois12: string[] = [];
    const d = new Date(); d.setDate(1);
    for (let i = 0; i < 12; i++) { mois12.unshift(d.toLocaleDateString("sv-SE").slice(0, 7)); d.setMonth(d.getMonth() - 1); }
    const parMois = mois12.map((m) => {
      const l = livres.filter((r) => moisDe(r.date_livraison!) === m);
      const dossiers = l.reduce((s, r) => s + (r.prix_fdj ?? 0), 0);
      return { m, n: l.length, dossiers, forfait: forfaitTotal(m), ca: dossiers + forfaitTotal(m) };
    });

    const duMois = rows.filter((r) => moisDe(r.created_at) === mois);
    const livresMois = livres.filter((r) => moisDe(r.date_livraison!) === mois);
    const agg = (key: "compagnie_id" | "livreur_id") => {
      const map: Record<string, { confies: number; livres: number; nonTrouves: number; ca: number }> = {};
      duMois.forEach((r) => {
        const k = r[key] ?? "—"; map[k] ??= { confies: 0, livres: 0, nonTrouves: 0, ca: 0 };
        map[k].confies++; if (r.statut === "non_trouve") map[k].nonTrouves++;
      });
      livresMois.forEach((r) => {
        const k = r[key] ?? "—"; map[k] ??= { confies: 0, livres: 0, nonTrouves: 0, ca: 0 };
        map[k].livres++; map[k].ca += r.prix_fdj ?? 0;
      });
      return map;
    };
    const parCie = agg("compagnie_id");
    forfaits.filter((f) => f.date_debut.slice(0, 7) <= mois).forEach((f) => {
      parCie[f.compagnie_id] ??= { confies: 0, livres: 0, nonTrouves: 0, ca: 0 };
      parCie[f.compagnie_id].ca += f.prix_fdj;
    });
    return { parMois, parCie, parLiv: agg("livreur_id"), courant: parMois.find((x) => x.m === mois), confies: duMois.length };
  }, [rows, forfaits, mois]);

  function exportCSV() {
    if (!stats) return;
    const lignes = [["Section", "Nom", "Confiés", "Livrés", "Non trouvés", "CA FDJ"]];
    Object.entries(stats.parCie).forEach(([k, v]) => lignes.push(["Compagnie", cies[k] ?? k, String(v.confies), String(v.livres), String(v.nonTrouves), String(v.ca)]));
    Object.entries(stats.parLiv).forEach(([k, v]) => lignes.push(["Livreur", livs[k] ?? "Non assigné", String(v.confies), String(v.livres), String(v.nonTrouves), String(v.ca)]));
    const csv = "﻿" + lignes.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `vagabox-services-rapport-${mois}.csv`; a.click();
  }

  if (!stats) return <Loading />;
  const max = Math.max(1, ...stats.parMois.map((x) => x.ca));

  return (
    <>
      <PageHeader title="Rapports" sub={moisLabel(mois)}>
        <Input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} className="w-44" />
        <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="CA du mois" value={<span className="text-2xl">{fdj(stats.courant?.ca ?? 0)}</span>} tone="text-green-700"
          sub={stats.courant?.forfait ? `dont forfaits ${fdj(stats.courant.forfait)}` : undefined} />
        <Kpi label="Dossiers livrés" value={stats.courant?.n ?? 0} />
        <Kpi label="Dossiers confiés" value={stats.confies} />
        <Kpi label="Prix moyen" value={<span className="text-2xl">{fdj(stats.courant?.n ? Math.round(stats.courant.dossiers / stats.courant.n) : 0)}</span>} />
      </div>

      <Card className="mt-5 p-5">
        <h2 className="mb-4 font-bold">CA par mois (12 mois)</h2>
        <div className="flex h-48 items-end gap-1.5">
          {stats.parMois.map((x) => (
            <button key={x.m} onClick={() => setMois(x.m)} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${moisLabel(x.m)} : ${fdj(x.ca)}`}>
              <span className="mb-1 hidden text-[10px] font-semibold text-ink/60 group-hover:block">{Math.round(x.ca / 1000)}k</span>
              <span className={`w-full rounded-t ${x.m === mois ? "bg-accent" : "bg-ink/20 group-hover:bg-ink/40"}`} style={{ height: `${Math.max(2, (x.ca / max) * 100)}%` }} />
              <span className="mt-1 text-[10px] text-ink/50">{x.m.slice(5)}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Table titre="Par compagnie" data={stats.parCie} noms={cies} />
        <Table titre="Par livreur" data={stats.parLiv} noms={livs} vide="Non assigné" />
      </div>
    </>
  );
}

function Table({ titre, data, noms, vide = "—" }: { titre: string; data: Record<string, { confies: number; livres: number; nonTrouves: number; ca: number }>; noms: Record<string, string>; vide?: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1].ca - a[1].ca);
  return (
    <Card className="overflow-x-auto">
      <div className="border-b border-black/5 px-4 py-3 font-bold">{titre}</div>
      {entries.length === 0 ? <Empty>Aucune donnée</Empty> : (
        <table className="tbl">
          <thead><tr><th>Nom</th><th className="text-right">Confiés</th><th className="text-right">Livrés</th><th className="text-right">Non trouvés</th><th className="text-right">CA</th></tr></thead>
          <tbody>{entries.map(([k, v]) => (
            <tr key={k}>
              <td className="font-semibold">{noms[k] ?? vide}</td>
              <td className="text-right tabular-nums">{v.confies}</td>
              <td className="text-right tabular-nums">{v.livres}</td>
              <td className="text-right tabular-nums">{v.nonTrouves}</td>
              <td className="text-right font-semibold tabular-nums">{fdj(v.ca)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </Card>
  );
}
