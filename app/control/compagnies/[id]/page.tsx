"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { callFn, errMsg, sb } from "@/lib/supabase";
import { Compagnie, Tarif } from "@/lib/types";
import { dateCourte, fdj } from "@/lib/utils";
import { Alert, Button, Card, Empty, Field, Input, Loading, Modal, Select } from "@/components/ui";
import CompagnieForm from "@/components/CompagnieForm";

interface CieUser { id: string; nom: string | null; email: string }

export default function CompagnieDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Compagnie | null>(null);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [users, setUsers] = useState<CieUser[] | null>(null);
  const [edit, setEdit] = useState(false);
  const [modalTarif, setModalTarif] = useState(false);
  const [modalUser, setModalUser] = useState(false);

  const load = useCallback(async () => {
    const client = sb("control");
    const [{ data: cie }, { data: t }] = await Promise.all([
      client.from("compagnies").select("*").eq("id", id).single(),
      client.from("tarification").select("*").eq("compagnie_id", id).order("date_debut", { ascending: false }),
    ]);
    setC(cie as Compagnie); setTarifs(t ?? []);
    callFn("control", "admin-users", { action: "list_compagnie_users", compagnie_id: id }).then((r) => setUsers(r.users)).catch(() => setUsers([]));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggleTarif(t: Tarif) {
    await sb("control").from("tarification").update({ actif: !t.actif }).eq("id", t.id); load();
  }
  async function supprimerUser(u: CieUser) {
    if (!confirm(`Supprimer l'accès VS Track de ${u.email} ?`)) return;
    try { await callFn("control", "admin-users", { action: "delete_user", user_id: u.id }); load(); } catch (e: any) { alert(e.message); }
  }
  async function resetPwd(u: CieUser) {
    const p = prompt(`Nouveau mot de passe pour ${u.email} (8+ caractères)`);
    if (!p) return;
    try { await callFn("control", "admin-users", { action: "reset_password", user_id: u.id, password: p }); alert("Mot de passe modifié"); } catch (e: any) { alert(e.message); }
  }
  async function supprimer() {
    if (!confirm(`Supprimer ${c?.nom} ? (impossible si des dossiers existent)`)) return;
    const { error } = await sb("control").from("compagnies").delete().eq("id", id);
    if (error) return alert(errMsg(error));
    router.replace("/control/compagnies");
  }

  if (!c) return <Loading />;
  return (
    <>
      <Link href="/control/compagnies" className="text-sm text-ink/60 hover:text-ink">← Compagnies</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{c.nom} {c.code && <span className="ml-1 rounded bg-ink px-2 py-0.5 align-middle font-mono text-sm text-white">{c.code}</span>}</h1>
        <div className="flex gap-2">
          <Link href={`/control/dossiers?compagnie=${c.id}`}><Button variant="outline">Dossiers</Button></Link>
          <Button variant="outline" onClick={() => setEdit(true)}>Modifier</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <h2 className="font-bold">Tarification</h2>
            <Button size="sm" onClick={() => setModalTarif(true)}>+ Tarif</Button>
          </div>
          {tarifs.length === 0 ? <Empty>Aucun tarif — le prix sera saisi à chaque dossier</Empty> : (
            <table className="tbl">
              <thead><tr><th>Type</th><th>Prix</th><th>Depuis</th><th>Actif</th></tr></thead>
              <tbody>{tarifs.map((t) => (
                <tr key={t.id} className={t.actif ? "" : "opacity-50"}>
                  <td>{t.type === "par_dossier" ? "Par dossier" : "Forfait mensuel"}</td>
                  <td className="font-semibold">{fdj(t.prix_fdj)}</td>
                  <td>{dateCourte(t.date_debut)}</td>
                  <td><button onClick={() => toggleTarif(t)} className={t.actif ? "font-semibold text-green-700" : "text-ink/50"}>{t.actif ? "● Actif" : "○ Inactif"}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          <p className="px-4 py-3 text-xs text-ink/50">Le tarif « par dossier » actif est appliqué automatiquement à chaque nouveau dossier. Le forfait mensuel s&apos;ajoute au CA mensuel dans les rapports.</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <h2 className="font-bold">Accès VS Track</h2>
            <Button size="sm" onClick={() => setModalUser(true)}>+ Compte agent</Button>
          </div>
          {!users ? <Loading /> : users.length === 0 ? <Empty>Aucun compte agent</Empty> : (
            <ul className="divide-y divide-black/5">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <div><div className="font-semibold">{u.nom ?? "—"}</div><div className="text-sm text-ink/60">{u.email}</div></div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => resetPwd(u)}>Mot de passe</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => supprimerUser(u)}>Suppr.</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <button onClick={supprimer} className="mt-8 text-sm text-red-600 hover:underline">Supprimer cette compagnie</button>

      <Modal open={edit} onClose={() => setEdit(false)} title="Modifier la compagnie">
        {edit && <CompagnieForm initial={c} onSaved={() => { setEdit(false); load(); }} />}
      </Modal>
      <TarifModal open={modalTarif} onClose={() => setModalTarif(false)} compagnieId={id} onDone={() => { setModalTarif(false); load(); }} />
      <UserModal open={modalUser} onClose={() => setModalUser(false)} compagnieId={id} onDone={() => { setModalUser(false); load(); }} />
    </>
  );
}

function TarifModal({ open, onClose, compagnieId, onDone }: { open: boolean; onClose: () => void; compagnieId: string; onDone: () => void }) {
  const [f, setF] = useState({ type: "par_dossier", prix_fdj: "", date_debut: new Date().toISOString().slice(0, 10), desactiver: true });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const client = sb("control");
    if (f.desactiver) await client.from("tarification").update({ actif: false }).eq("compagnie_id", compagnieId).eq("type", f.type);
    const { error } = await client.from("tarification").insert({ compagnie_id: compagnieId, type: f.type, prix_fdj: Number(f.prix_fdj), date_debut: f.date_debut, actif: true });
    setLoading(false);
    if (error) return setErr(errMsg(error));
    onDone();
  }
  return (
    <Modal open={open} onClose={onClose} title="Nouveau tarif">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Type">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="par_dossier">Par dossier</option><option value="forfait_mensuel">Forfait mensuel</option>
          </Select>
        </Field>
        <Field label="Prix (FDJ)"><Input type="number" required min={0} value={f.prix_fdj} onChange={(e) => setF({ ...f, prix_fdj: e.target.value })} /></Field>
        <Field label="À partir du"><Input type="date" required value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.desactiver} onChange={(e) => setF({ ...f, desactiver: e.target.checked })} /> Désactiver l&apos;ancien tarif du même type</label>
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Ajouter</Button>
      </form>
    </Modal>
  );
}

function UserModal({ open, onClose, compagnieId, onDone }: { open: boolean; onClose: () => void; compagnieId: string; onDone: () => void }) {
  const [f, setF] = useState({ nom: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try { await callFn("control", "admin-users", { action: "create_compagnie_user", compagnie_id: compagnieId, ...f }); setF({ nom: "", email: "", password: "" }); onDone(); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Compte agent compagnie">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nom de l'agent"><Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
        <Field label="Email *"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Mot de passe *" hint="8 caractères min. — à transmettre à l'agent"><Input required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Créer l&apos;accès</Button>
      </form>
    </Modal>
  );
}
