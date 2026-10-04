"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { callFn, errMsg, sb } from "@/lib/supabase";
import { Compagnie, Tarif } from "@/lib/types";
import { dateCourte, fdj } from "@/lib/utils";
import { Alert, Button, Card, Empty, Field, Input, Loading, Modal, Select } from "@/components/ui";
import CompagnieForm from "@/components/CompagnieForm";

interface CieUser { id: string; nom: string | null; email: string; type_track?: "lecture" | "saisie" }

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
    Promise.all([
      callFn("control", "admin-users", { action: "list_compagnie_users", compagnie_id: id }),
      client.from("profiles").select("id, type_track").eq("compagnie_id", id),
    ]).then(([r, { data: p }]) => {
      const types = Object.fromEntries((p ?? []).map((x: any) => [x.id, x.type_track]));
      setUsers((r.users as CieUser[]).map((u) => ({ ...u, type_track: types[u.id] ?? "lecture" })));
    }).catch(() => setUsers([]));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggleTarif(t: Tarif) {
    await sb("control").from("tarification").update({ actif: !t.actif }).eq("id", t.id); load();
  }
  async function supprimerUser(u: CieUser) {
    if (!confirm(`Supprimer l'accès VS Track de ${u.email} ?`)) return;
    try { await callFn("control", "admin-users", { action: "delete_user", user_id: u.id }); load(); } catch (e: any) { alert(e.message); }
  }
  async function changerType(u: CieUser) {
    const t = u.type_track === "saisie" ? "lecture" : "saisie";
    const { error } = await sb("control").rpc("definir_type_track", { p_user: u.id, p_type: t });
    if (error) return alert(errMsg(error));
    load();
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
                  <td>{t.type === "par_dossier" ? "Par dossier" : <>Forfait mensuel<div className="text-xs text-ink/50">{t.repartition === "reparti" ? "Réparti sur les dossiers livrés" : "0 FDJ par dossier"}</div></>}</td>
                  <td className="font-semibold">{fdj(t.prix_fdj)}</td>
                  <td>{dateCourte(t.date_debut)}</td>
                  <td><button onClick={() => toggleTarif(t)} className={t.actif ? "font-semibold text-green-700" : "text-ink/50"}>{t.actif ? "● Actif" : "○ Inactif"}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          <p className="px-4 py-3 text-xs text-ink/50">Le tarif « par dossier » actif est appliqué automatiquement à chaque nouveau dossier. Forfait mensuel : soit 0 FDJ par dossier (forfait compté une fois par mois), soit réparti (forfait ÷ dossiers livrés du mois, attribué aux livreurs dans les rapports).</p>
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
                  <div>
                    <div className="font-semibold">{u.nom ?? "—"} <TypeBadge t={u.type_track} /></div>
                    <div className="text-sm text-ink/60">{u.email}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => changerType(u)}>{u.type_track === "saisie" ? "→ Lecture seule" : "→ Saisie"}</Button>
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
  const [f, setF] = useState({ type: "par_dossier", prix_fdj: "", date_debut: new Date().toISOString().slice(0, 10), desactiver: true, repartition: "zero" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const client = sb("control");
    if (f.desactiver) await client.from("tarification").update({ actif: false }).eq("compagnie_id", compagnieId).eq("type", f.type);
    const { error } = await client.from("tarification").insert({ compagnie_id: compagnieId, type: f.type, prix_fdj: Number(f.prix_fdj), date_debut: f.date_debut, actif: true, ...(f.type === "forfait_mensuel" ? { repartition: f.repartition } : {}) });
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
        {f.type === "forfait_mensuel" && (
          <Field label="Prix par dossier">
            <Select value={f.repartition} onChange={(e) => setF({ ...f, repartition: e.target.value })}>
              <option value="zero">0 FDJ par dossier — forfait compté une fois par mois</option>
              <option value="reparti">Forfait ÷ nb de dossiers livrés du mois</option>
            </Select>
          </Field>
        )}
        <Field label={f.type === "forfait_mensuel" ? "Montant du forfait mensuel (FDJ)" : "Prix (FDJ)"}><Input type="number" required min={0} value={f.prix_fdj} onChange={(e) => setF({ ...f, prix_fdj: e.target.value })} /></Field>
        <Field label="À partir du"><Input type="date" required value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.desactiver} onChange={(e) => setF({ ...f, desactiver: e.target.checked })} /> Désactiver l&apos;ancien tarif du même type</label>
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Ajouter</Button>
      </form>
    </Modal>
  );
}

function TypeBadge({ t }: { t?: string }) {
  return t === "saisie"
    ? <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 align-middle text-[11px] font-bold text-blue-800">SAISIE</span>
    : <span className="ml-1 rounded bg-black/5 px-1.5 py-0.5 align-middle text-[11px] font-bold text-ink/60">LECTURE</span>;
}

function UserModal({ open, onClose, compagnieId, onDone }: { open: boolean; onClose: () => void; compagnieId: string; onDone: () => void }) {
  const [f, setF] = useState({ nom: "", email: "", password: "" });
  const [type, setType] = useState<"lecture" | "saisie">("lecture");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      await callFn("control", "admin-users", { action: "create_compagnie_user", compagnie_id: compagnieId, ...f });
      if (type === "saisie") {
        const r = await callFn("control", "admin-users", { action: "list_compagnie_users", compagnie_id: compagnieId });
        const u = (r.users as CieUser[]).find((x) => x.email?.toLowerCase() === f.email.trim().toLowerCase());
        if (u) {
          const { error } = await sb("control").rpc("definir_type_track", { p_user: u.id, p_type: "saisie" });
          if (error) throw new Error(`Compte créé, mais type non appliqué : ${errMsg(error)}`);
        }
      }
      setF({ nom: "", email: "", password: "" }); setType("lecture"); onDone();
    }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Compte agent compagnie">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Type de compte">
          <Select value={type} onChange={(e) => setType(e.target.value as "lecture" | "saisie")}>
            <option value="lecture">Lecture seule — suit les dossiers de cette compagnie</option>
            <option value="saisie">Saisie (ex. Air Djibouti) — déclare les bagages, toutes compagnies</option>
          </Select>
        </Field>
        <Field label="Nom de l'agent"><Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
        <Field label="Email *"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Mot de passe *" hint="8 caractères min. — à transmettre à l'agent"><Input required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Créer l&apos;accès</Button>
      </form>
    </Modal>
  );
}
