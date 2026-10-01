"use client";
import { useCallback, useEffect, useState } from "react";
import { errMsg, sb, signedUrls } from "@/lib/supabase";
import { Compta } from "@/lib/types";
import { aujourdhui, dateCourte, debutJourISO, fdj, moisLabel } from "@/lib/utils";
import { Alert, Button, Card, Empty, Field, Input, Kpi, Loading, Modal, PageHeader, Textarea } from "@/components/ui";
import PhotoUpload from "@/components/PhotoUpload";

export default function Comptabilite() {
  const [mois, setMois] = useState(() => aujourdhui().slice(0, 7));
  const [rows, setRows] = useState<Compta[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Partial<Compta> | null>(null);

  const load = useCallback(async () => {
    const [y, m] = mois.split("-").map(Number);
    const fin = new Date(y, m, 1).toLocaleDateString("sv-SE");
    const { data } = await sb("control").from("comptabilite").select("*").gte("date", `${mois}-01`).lt("date", fin).order("date", { ascending: false });
    setRows(data ?? []);
    setUrls(await signedUrls("control", (data ?? []).map((r) => r.photo_facture_url!).filter(Boolean)));
  }, [mois]);
  useEffect(() => { setRows(null); load(); }, [load]);

  async function supprimer(r: Compta) {
    if (!confirm(`Supprimer la saisie du ${dateCourte(r.date)} ?`)) return;
    await sb("control").from("comptabilite").delete().eq("id", r.id); load();
  }

  const totD = rows?.reduce((s, r) => s + r.total_dossiers, 0) ?? 0;
  const totF = rows?.reduce((s, r) => s + r.total_fdj, 0) ?? 0;

  return (
    <>
      <PageHeader title="Comptabilité" sub="Saisie journalière + facture">
        <Input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} className="w-44" />
        <Button onClick={() => setEdit({ date: aujourdhui() })}>+ Saisie du jour</Button>
      </PageHeader>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label={`Dossiers — ${moisLabel(mois)}`} value={totD} />
        <Kpi label="Montant saisi" value={<span className="text-2xl">{fdj(totF)}</span>} tone="text-green-700" />
        <Kpi label="Jours saisis" value={rows?.length ?? 0} />
      </div>
      <Card className="overflow-x-auto">
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>Aucune saisie ce mois-ci</Empty> : (
          <table className="tbl">
            <thead><tr><th>Date</th><th className="text-right">Dossiers</th><th className="text-right">Montant</th><th>Notes</th><th>Facture</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{dateCourte(r.date)}</td>
                <td className="text-right tabular-nums">{r.total_dossiers}</td>
                <td className="text-right font-semibold tabular-nums">{fdj(r.total_fdj)}</td>
                <td className="max-w-xs truncate text-ink/70">{r.notes}</td>
                <td>{r.photo_facture_url && urls[r.photo_facture_url]
                  ? <a href={urls[r.photo_facture_url]} target="_blank" rel="noreferrer" className="font-semibold text-accent-dark">📎 Voir</a> : "—"}</td>
                <td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>Modifier</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => supprimer(r)}>Suppr.</Button>
                </td>
              </tr>
            ))}</tbody>
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

  // Chiffres système : dossiers livrés ce jour-là
  useEffect(() => {
    const debut = debutJourISO(f.date);
    const fin = new Date(new Date(debut).getTime() + 86400000).toISOString();
    sb("control").from("dossiers").select("prix_fdj").eq("statut", "livre").gte("date_livraison", debut).lt("date_livraison", fin)
      .then(({ data }) => setSysteme({ n: data?.length ?? 0, fdj: (data ?? []).reduce((s, d) => s + (d.prix_fdj ?? 0), 0) }));
  }, [f.date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const { data: u } = await sb("control").auth.getUser();
    const payload = { date: f.date, total_dossiers: Number(f.total_dossiers || 0), total_fdj: Number(f.total_fdj || 0), notes: f.notes || null, photo_facture_url: photo, created_by: u.user?.id };
    const { error } = initial.id
      ? await sb("control").from("comptabilite").update(payload).eq("id", initial.id)
      : await sb("control").from("comptabilite").insert(payload);
    setLoading(false);
    if (error) return setErr(errMsg(error));
    onDone();
  }

  return (
    <Modal open onClose={onClose} title={initial.id ? "Modifier la saisie" : "Saisie journalière"}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Date"><Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        {systeme && (
          <div className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-sm">
            <span>Système : <b>{systeme.n}</b> livrés · <b>{fdj(systeme.fdj)}</b></span>
            <button type="button" className="font-semibold text-accent-dark" onClick={() => setF({ ...f, total_dossiers: String(systeme.n), total_fdj: String(systeme.fdj) })}>Reprendre</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total dossiers"><Input type="number" min={0} required value={f.total_dossiers} onChange={(e) => setF({ ...f, total_dossiers: e.target.value })} /></Field>
          <Field label="Montant (FDJ)"><Input type="number" min={0} required value={f.total_fdj} onChange={(e) => setF({ ...f, total_fdj: e.target.value })} /></Field>
        </div>
        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <PhotoUpload app="control" prefix="factures" label={photo ? "Facture jointe — toucher pour remplacer" : "📎 Photo de la facture"} onUploaded={(p) => p && setPhoto(p)} />
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Enregistrer</Button>
      </form>
    </Modal>
  );
}
