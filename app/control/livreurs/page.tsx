"use client";
import { useCallback, useEffect, useState } from "react";
import { callFn, errMsg, sb } from "@/lib/supabase";
import { Livreur } from "@/lib/types";
import { dateCourte } from "@/lib/utils";
import { Alert, Button, Card, Empty, Field, Input, Loading, Modal, PageHeader } from "@/components/ui";

type Row = Livreur & { en_cours: number };

export default function Livreurs() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [modal, setModal] = useState(false);
  const [pinFor, setPinFor] = useState<Livreur | null>(null);

  const load = useCallback(async () => {
    const client = sb("control");
    const [{ data: l }, { data: d }] = await Promise.all([
      client.from("livreurs").select("id, nom, telephone, auth_user_id, actif, created_at").order("nom"),
      client.from("dossiers").select("livreur_id").in("statut", ["a_recuperer", "recupere", "en_livraison", "replanifie"]),
    ]);
    const cnt: Record<string, number> = {};
    (d ?? []).forEach((x) => { if (x.livreur_id) cnt[x.livreur_id] = (cnt[x.livreur_id] ?? 0) + 1; });
    setRows(((l as Livreur[]) ?? []).map((x) => ({ ...x, en_cours: cnt[x.id] ?? 0 })));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(l: Livreur) {
    const { error } = await sb("control").from("livreurs").update({ actif: !l.actif }).eq("id", l.id);
    if (error) alert(errMsg(error)); else load();
  }
  async function supprimer(l: Livreur) {
    if (!confirm(`Supprimer ${l.nom} ? Ses dossiers seront désassignés.`)) return;
    try { await callFn("control", "admin-users", { action: "delete_livreur", livreur_id: l.id }); load(); } catch (e: any) { alert(e.message); }
  }

  return (
    <>
      <PageHeader title="Livreurs" sub="Connexion VS Go par PIN 6 chiffres (unique par livreur)">
        <Button onClick={() => setModal(true)}>+ Nouveau livreur</Button>
      </PageHeader>
      <Card className="overflow-x-auto overscroll-x-contain">
        {!rows ? <Loading /> : rows.length === 0 ? <Empty>Aucun livreur</Empty> : (
          <table className="tbl">
            <thead><tr><th>Nom</th><th>Téléphone</th><th>Dossiers en cours</th><th>Statut</th><th>Depuis</th><th /></tr></thead>
            <tbody>{rows.map((l) => (
              <tr key={l.id} className={l.actif ? "" : "opacity-50"}>
                <td className="font-semibold">{l.nom}</td>
                <td>{l.telephone ?? "—"}</td>
                <td className="tabular-nums">{l.en_cours}</td>
                <td>{l.actif ? <span className="font-semibold text-green-700">● Actif</span> : <span className="text-ink/50">○ Désactivé</span>}</td>
                <td className="text-xs text-ink/60">{dateCourte(l.created_at)}</td>
                <td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => setPinFor(l)}>Changer PIN</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(l)}>{l.actif ? "Désactiver" : "Activer"}</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => supprimer(l)}>Suppr.</Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
      <NouveauLivreur open={modal} onClose={() => setModal(false)} onDone={() => { setModal(false); load(); }} />
      <PinModal livreur={pinFor} onClose={() => setPinFor(null)} />
    </>
  );
}

const pinAleatoire = () => String(Math.floor(100000 + Math.random() * 900000));

function NouveauLivreur({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ nom: "", telephone: "", pin: pinAleatoire(), email: "", password: "" });
  const [avance, setAvance] = useState(false);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const [cree, setCree] = useState<{ nom: string; pin: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      await callFn("control", "admin-users", { action: "create_livreur", ...f, email: f.email || undefined, password: f.password || undefined });
      setCree({ nom: f.nom, pin: f.pin });
      setF({ nom: "", telephone: "", pin: pinAleatoire(), email: "", password: "" });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  const fermer = () => { if (cree) { setCree(null); onDone(); } else onClose(); };

  return (
    <Modal open={open} onClose={fermer} title="Nouveau livreur">
      {cree ? (
        <div className="space-y-4 text-center">
          <p>Livreur <b>{cree.nom}</b> créé. PIN de connexion VS Go :</p>
          <div className="font-mono text-4xl font-bold tracking-[0.3em]">{cree.pin}</div>
          <Alert kind="warn">Notez-le maintenant : le PIN est stocké chiffré et ne pourra plus être affiché.</Alert>
          <Button className="w-full" onClick={fermer}>Terminé</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nom *"><Input required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
          <Field label="Téléphone"><Input type="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} /></Field>
          <Field label="PIN (6 chiffres) *">
            <div className="flex gap-2">
              <Input required pattern="\d{6}" maxLength={6} inputMode="numeric" className="font-mono text-lg tracking-widest" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} />
              <Button type="button" variant="outline" onClick={() => setF({ ...f, pin: pinAleatoire() })}>↻</Button>
            </div>
          </Field>
          <button type="button" onClick={() => setAvance(!avance)} className="text-sm font-semibold text-accent-dark">{avance ? "−" : "+"} Login email / mot de passe (optionnel)</button>
          {avance && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Mot de passe"><Input minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            </div>
          )}
          <Alert>{err}</Alert>
          <Button className="w-full" loading={loading}>Créer</Button>
        </form>
      )}
    </Modal>
  );
}

function PinModal({ livreur, onClose }: { livreur: Livreur | null; onClose: () => void }) {
  const [pin, setPin] = useState(pinAleatoire());
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try { await callFn("control", "admin-users", { action: "update_livreur_pin", livreur_id: livreur!.id, pin }); setOk(true); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  const close = () => { setOk(false); setErr(""); setPin(pinAleatoire()); onClose(); };
  return (
    <Modal open={!!livreur} onClose={close} title={`Nouveau PIN — ${livreur?.nom ?? ""}`}>
      {ok ? (
        <div className="space-y-4 text-center">
          <div className="font-mono text-4xl font-bold tracking-[0.3em]">{pin}</div>
          <Alert kind="ok">PIN mis à jour. Transmettez-le au livreur.</Alert>
          <Button className="w-full" onClick={close}>Fermer</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <Input required pattern="\d{6}" maxLength={6} inputMode="numeric" className="font-mono text-lg tracking-widest" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
            <Button type="button" variant="outline" onClick={() => setPin(pinAleatoire())}>↻</Button>
          </div>
          <Alert>{err}</Alert>
          <Button className="w-full" loading={loading}>Enregistrer le PIN</Button>
        </form>
      )}
    </Modal>
  );
}
