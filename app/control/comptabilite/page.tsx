"use client";
import { useCallback, useEffect, useState } from "react";
import { errMsg, sb, signedUrls } from "@/lib/supabase";
import { Compta } from "@/lib/types";
import { aujourdhui, cx, dateCourte, debutJourISO, fdj, moisLabel } from "@/lib/utils";
import { Alert, Button, Card, Empty, Field, Input, Kpi, Loading, Modal, PageHeader, Textarea } from "@/components/ui";
import PhotoUpload from "@/components/PhotoUpload";

type Systeme = Record<string, { n: number; fdj: number }>;
const jourDjib = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Africa/Djibouti" });

/** Chiffres système (dossiers livrés) par jour, sur une plage [debut, fin[ (YYYY-MM-DD) */
async function chiffresSysteme(debut: string, fin: string): Promise<Systeme> {
  const { data } = await sb("control").from("dossiers").select("prix_fdj, date_livraison")
    .eq("statut", "livre").gte("date_livraison", debutJourISO(debut)).lt("date_livraison", debutJourISO(fin)).limit(20000);
  const out: Systeme = {};
  (data ?? []).forEach((d) => {
    const j = jourDjib(d.date_livraison!);
    out[j] ??= { n: 0, fdj: 0 };
    out[j].n++; out[j].fdj += d.prix_fdj ?? 0;
  });
  return out;
}
const finDeMois = (mois: string) => { const [y, m] = mois.split("-").map(Number); return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); };

export default function Comptabilite() {
  const [mois, setMois] = useState(() => aujourdhui().slice(0, 7));
  const [rows, setRows] = useState<Compta[] | null>(null);
  const [sys, setSys] = useState<Systeme>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Partial<Compta> | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const fin = finDeMois(mois);
    const [{ data }, s] = await Promise.all([
      sb("control").from("comptabilite").select("*").gte("date", `${mois}-01`).lt("date", fin).order("date", { ascending: false }),
      chiffresSysteme(`${mois}-01`, fin),
    ]);
    setRows(data ?? []); setSys(s);
    setUrls(await signedUrls("control", (data ?? []).map((r) => r.photo_facture_url!).filter(Boolean)));
  }, [mois]);
  useEffect(() => { setRows(null); setMsg(""); load(); }, [load]);

  /** Calcul auto : crée les jours manquants, met à jour les chiffres système,
   *  et recopie dans la saisie les jours en source « auto » (les saisies manuelles ne sont jamais écrasées). */
  async function calculAuto() {
    if (!rows) return;
    setAutoBusy(true); setMsg("");
    const c = sb("control");
    const { data: u } = await c.auth.getUser();
    const parDate = Object.fromEntries(rows.map((r) => [r.date, r]));
    const jours = new Set([...Object.keys(sys), ...rows.map((r) => r.date)]);
    let crees = 0, maj = 0;
    for (const j of Array.from(jours)) {
      if (j > aujourdhui()) continue;
      const s = sys[j] ?? { n: 0, fdj: 0 };
      const r = parDate[j];
      if (!r) {
        if (!s.n) continue;
        const { error } = await c.from("comptabilite").insert({
          date: j, total_dossiers: s.n, total_fdj: s.fdj, total_dossiers_systeme: s.n, total_fdj_systeme: s.fdj, source: "auto", created_by: u.user?.id,
        });
        if (error) { setMsg(errMsg(error)); break; }
        crees++;
      } else {
        const patch: Partial<Compta> = { total_dossiers_systeme: s.n, total_fdj_systeme: s.fdj };
        if (r.source !== "manuel") Object.assign(patch, { total_dossiers: s.n, total_fdj: s.fdj });
        const { error } = await c.from("comptabilite").update(patch).eq("id", r.id);
        if (error) { setMsg(errMsg(error)); break; }
        maj++;
      }
    }
    setAutoBusy(false);
    setMsg((m) => m || `Calcul auto : ${crees} jour(s) créé(s), ${maj} mis à jour. Les saisies manuelles sont conservées.`);
    load();
  }

  async function supprimer(r: Compta) {
    if (!confirm(`Supprimer la saisie du ${dateCourte(r.date)} ?`)) return;
    await sb("control").from("comptabilite").delete().eq("id", r.id); load();
  }

  const totD = rows?.reduce((s, r) => s + r.total_dossiers, 0) ?? 0;
  const totF = rows?.reduce((s, r) => s + r.total_fdj, 0) ?? 0;
  const sysF = Object.values(sys).reduce((s, x) => s + x.fdj, 0);
  const ecart = totF - sysF;

  return (
    <>
      <PageHeader title="Comptabilité" sub="Calcul auto depuis les livraisons + saisie / correction manuelle">
        <Input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} className="w-44" />
        <Button variant="outline" loading={autoBusy} onClick={calculAuto}>⚡ Calcul auto du mois</Button>
        <Button onClick={() => setEdit({ date: aujourdhui() })}>+ Saisie manuelle</Button>
      </PageHeader>
      {msg && <div className="mb-4"><Alert kind={msg.startsWith("Calcul") ? "ok" : "error"}>{msg}</Alert></div>}
      <div className="mb-5 stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={`Dossiers saisis — ${moisLabel(mois)}`} value={totD} />
        <Kpi label="Montant saisi" value={<span className="text-2xl">{fdj(totF)}</span>} tone="text-green-700" />
        <Kpi label="Montant système" value={<span className="text-2xl">{fdj(sysF)}</span>} sub="dossiers livrés × prix" />
        <Kpi label="Écart saisi − système" value={<span className="text-2xl">{fdj(ecart)}</span>} tone={ecart === 0 ? "text-ink" : "text-amber-700"} />
      </div>
      <Card className="overflow-x-auto">
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>Aucune saisie ce mois-ci — lancez le calcul auto ou une saisie manuelle</Empty> : (
          <table className="tbl">
            <thead><tr>
              <th>Date</th><th className="text-right">Système</th><th className="text-right">Saisi</th><th className="text-right">Écart</th>
              <th>Source</th><th>Notes</th><th>Facture</th><th />
            </tr></thead>
            <tbody>{rows.map((r) => {
              const s = sys[r.date] ?? { n: 0, fdj: 0 };
              const e = r.total_fdj - s.fdj;
              return (
                <tr key={r.id}>
                  <td className="font-semibold">{dateCourte(r.date)}</td>
                  <td className="text-right tabular-nums text-ink/70">{s.n} · {fdj(s.fdj)}</td>
                  <td className="text-right font-semibold tabular-nums">{r.total_dossiers} · {fdj(r.total_fdj)}</td>
                  <td className={cx("text-right tabular-nums", e === 0 ? "text-ink/40" : "font-semibold text-amber-700")}>{e === 0 ? "✓" : fdj(e)}</td>
                  <td><span className={cx("rounded px-2 py-0.5 text-xs font-semibold", r.source === "manuel" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800")}>{r.source === "manuel" ? "Manuel" : "Auto"}</span></td>
                  <td className="max-w-xs truncate text-ink/70">{r.notes}</td>
                  <td>{r.photo_facture_url && urls[r.photo_facture_url]
                    ? <a href={urls[r.photo_facture_url]} target="_blank" rel="noreferrer" className="font-semibold text-accent-dark">📎 Voir</a> : "—"}</td>
                  <td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>Modifier</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => supprimer(r)}>Suppr.</Button>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </Card>
      {edit && <SaisieModal initial={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </>
  );
}

function SaisieModal({ initial, onClose, onDone }: { initial: Partial<Compta>; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    date: initial.date ?? aujourdhui(), total_dossiers: String(initial.total_dossiers ?? ""), total_fdj: String(initial.total_fdj ?? ""), notes: initial.notes ?? "",
  });
  const [photo, setPhoto] = useState<string | null>(initial.photo_facture_url ?? null);
  const [systeme, setSysteme] = useState<{ n: number; fdj: number } | null>(null);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSysteme(null);
    const lendemain = new Date(new Date(`${f.date}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
    chiffresSysteme(f.date, lendemain).then((s) => {
      const v = s[f.date] ?? { n: 0, fdj: 0 };
      setSysteme(v);
      // nouvelle saisie : pré-remplir avec le calcul auto
      if (!initial.id) setF((x) => (x.total_dossiers === "" && x.total_fdj === "" ? { ...x, total_dossiers: String(v.n), total_fdj: String(v.fdj) } : x));
    });
  }, [f.date, initial.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const { data: u } = await sb("control").auth.getUser();
    const td = Number(f.total_dossiers || 0), tf = Number(f.total_fdj || 0);
    const identique = systeme && systeme.n === td && systeme.fdj === tf;
    const payload = {
      date: f.date, total_dossiers: td, total_fdj: tf, notes: f.notes || null, photo_facture_url: photo,
      total_dossiers_systeme: systeme?.n ?? null, total_fdj_systeme: systeme?.fdj ?? null,
      source: identique ? "auto" : "manuel",
      ...(initial.id ? {} : { created_by: u.user?.id }),
    };
    const { error } = initial.id
      ? await sb("control").from("comptabilite").update(payload).eq("id", initial.id)
      : await sb("control").from("comptabilite").insert(payload);
    setLoading(false);
    if (error) return setErr(error.code === "23505" ? "Une saisie existe déjà pour cette date — modifiez-la dans la liste" : errMsg(error));
    onDone();
  }

  return (
    <Modal open onClose={onClose} title={initial.id ? "Modifier la saisie" : "Saisie journalière"}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Date"><Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <div className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-sm">
          {systeme ? <span>Calcul auto : <b>{systeme.n}</b> livrés · <b>{fdj(systeme.fdj)}</b></span> : <span className="text-ink/50">Calcul…</span>}
          {systeme && <button type="button" className="font-semibold text-accent-dark" onClick={() => setF({ ...f, total_dossiers: String(systeme.n), total_fdj: String(systeme.fdj) })}>Reprendre</button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total dossiers"><Input type="number" min={0} required value={f.total_dossiers} onChange={(e) => setF({ ...f, total_dossiers: e.target.value })} /></Field>
          <Field label="Montant (FDJ)"><Input type="number" min={0} required value={f.total_fdj} onChange={(e) => setF({ ...f, total_fdj: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-ink/50">Si vous modifiez les chiffres, la saisie passe en « Manuel » et ne sera plus écrasée par le calcul auto.</p>
        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <PhotoUpload app="control" prefix="factures" label={photo ? "Facture jointe — toucher pour remplacer" : "📎 Photo de la facture"} onUploaded={(p) => p && setPhoto(p)} />
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Enregistrer</Button>
      </form>
    </Modal>
  );
}
