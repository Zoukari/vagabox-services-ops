"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { errMsg, sb } from "@/lib/supabase";
import { STATUTS, STATUTS_ORDRE, Statut } from "@/lib/constants";
import { DossierVue, Livreur } from "@/lib/types";
import { dateHeure, fdj, nomComplet } from "@/lib/utils";
import { Alert, Button, Card, Field, Input, Loading, Modal, Select, StatutBadge, Textarea } from "@/components/ui";
import StatusTimeline from "@/components/StatusTimeline";
import WhatsAppButton from "@/components/WhatsAppButton";
import PhotoUpload from "@/components/PhotoUpload";
import Timer from "@/components/Timer";

export default function DossierDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<DossierVue | null>(null);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [modalStatut, setModalStatut] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb("control").from("dossiers_vue").select("*").eq("id", id).single();
    setD(data as DossierVue);
  }, [id]);

  useEffect(() => {
    load();
    sb("control").from("livreurs").select("id, nom, telephone, auth_user_id, actif, created_at").eq("actif", true).order("nom")
      .then(({ data }) => setLivreurs((data as Livreur[]) ?? []));
  }, [load]);

  async function assigner(livreur_id: string) {
    await sb("control").from("dossiers").update({ livreur_id: livreur_id || null }).eq("id", id);
    load();
  }

  async function supprimer() {
    if (!confirm(`Supprimer définitivement le dossier ${d?.numero_dossier} ?`)) return;
    const { error } = await sb("control").from("dossiers").delete().eq("id", id);
    if (error) return alert(errMsg(error));
    router.replace("/control/dossiers");
  }

  if (!d) return <Loading />;

  return (
    <>
      <Link href="/control/dossiers" className="text-sm text-ink/60 hover:text-ink">← Dossiers</Link>
      <div className="mt-2 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{d.numero_dossier}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatutBadge statut={d.statut} retard={d.en_retard} />
            {d.statut === "en_livraison" && <Timer depuis={d.en_livraison_depuis} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setModalEdit(true)}>Modifier</Button>
          <Button onClick={() => setModalStatut(true)}>Changer le statut</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Info label="Client" value={nomComplet(d.client_nom, d.client_prenom)} sub={d.client_telephone} />
            <Info label="Adresse" value={d.quartier ?? "—"} sub={d.client_adresse ?? undefined} />
            <Info label="Compagnie" value={d.compagnie_nom} sub={d.compagnie_code ?? undefined} />
            <Info label="Tag IATA" value={<span className="font-mono">{d.tag_iata ?? "—"}</span>} />
            <Info label="Prix" value={fdj(d.prix_fdj)} />
            <Info label="Créé le" value={dateHeure(d.created_at)} sub={d.date_livraison ? `Livré le ${dateHeure(d.date_livraison)}` : undefined} />
            <div className="sm:col-span-2">
              <Field label="Livreur assigné">
                <Select value={d.livreur_id ?? ""} onChange={(e) => assigner(e.target.value)}>
                  <option value="">— Non assigné —</option>
                  {livreurs.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </Select>
              </Field>
            </div>
            {d.notes && <div className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-sm"><b>Notes :</b> {d.notes}</div>}
          </Card>
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/60">Message client</h2>
            <WhatsAppButton dossier={d} />
            {!["recupere", "en_livraison", "livre", "non_trouve", "replanifie"].includes(d.statut) &&
              <p className="text-sm text-ink/50">Pas de message prévu pour ce statut.</p>}
          </div>
        </div>
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Chronologie</h2>
          <StatusTimeline app="control" dossierId={d.id} refresh={refresh} />
        </Card>
      </div>

      <button onClick={supprimer} className="mt-8 text-sm text-red-600 hover:underline">Supprimer ce dossier</button>

      <StatutModal open={modalStatut} onClose={() => setModalStatut(false)} dossier={d}
        onDone={() => { setModalStatut(false); load(); setRefresh((r) => r + 1); }} />
      <EditModal open={modalEdit} onClose={() => setModalEdit(false)} dossier={d} onDone={() => { setModalEdit(false); load(); }} />
    </>
  );
}

function Info({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</div>
      <div className="font-semibold">{value}</div>
      {sub && <div className="text-sm text-ink/60">{sub}</div>}
    </div>
  );
}

function StatutModal({ open, onClose, dossier, onDone }: { open: boolean; onClose: () => void; dossier: DossierVue; onDone: () => void }) {
  const [statut, setStatut] = useState<Statut>(dossier.statut === "non_trouve" ? "replanifie" : dossier.statut);
  const [commentaire, setCommentaire] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function valider() {
    setLoading(true); setErr("");
    const { error } = await sb("control").rpc("changer_statut", {
      p_dossier: dossier.id, p_statut: statut, p_commentaire: commentaire || null, p_photo_url: photo,
    });
    setLoading(false);
    if (error) return setErr(errMsg(error));
    setCommentaire(""); setPhoto(null); onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Changer le statut">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {STATUTS_ORDRE.map((s) => (
            <button key={s} type="button" onClick={() => setStatut(s)}
              className="rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold transition"
              style={{ borderColor: statut === s ? STATUTS[s].couleur : "transparent", background: statut === s ? `${STATUTS[s].couleur}18` : "#0000000a" }}>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUTS[s].couleur }} />{STATUTS[s].label}
            </button>
          ))}
        </div>
        {statut === "replanifie" && <Alert kind="warn">2e tentative : le livreur pourra redémarrer la livraison depuis VS Go.</Alert>}
        <Field label="Commentaire"><Textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} /></Field>
        <PhotoUpload app="control" dossier={dossier.id} label="Joindre une photo (optionnel)" onUploaded={setPhoto} />
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading} onClick={valider}>Valider : {STATUTS[statut].label}</Button>
      </div>
    </Modal>
  );
}

function EditModal({ open, onClose, dossier, onDone }: { open: boolean; onClose: () => void; dossier: DossierVue; onDone: () => void }) {
  const [f, setF] = useState({ numero_dossier: dossier.numero_dossier, tag_iata: dossier.tag_iata ?? "", prix_fdj: String(dossier.prix_fdj ?? ""), notes: dossier.notes ?? "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const { error } = await sb("control").from("dossiers").update({
      numero_dossier: f.numero_dossier.trim(), tag_iata: f.tag_iata.trim() || null,
      prix_fdj: f.prix_fdj ? Number(f.prix_fdj) : null, notes: f.notes || null,
    }).eq("id", dossier.id);
    setLoading(false);
    if (error) return setErr(errMsg(error));
    onDone();
  }
  return (
    <Modal open={open} onClose={onClose} title="Modifier le dossier">
      <form onSubmit={save} className="space-y-3">
        <Field label="N° dossier"><Input required className="font-mono" value={f.numero_dossier} onChange={(e) => setF({ ...f, numero_dossier: e.target.value })} /></Field>
        <Field label="Tag IATA"><Input className="font-mono" value={f.tag_iata} onChange={(e) => setF({ ...f, tag_iata: e.target.value })} /></Field>
        <Field label="Prix (FDJ)"><Input type="number" min={0} value={f.prix_fdj} onChange={(e) => setF({ ...f, prix_fdj: e.target.value })} /></Field>
        <Field label="Notes"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <Alert>{err}</Alert>
        <Button className="w-full" loading={loading}>Enregistrer</Button>
      </form>
    </Modal>
  );
}
