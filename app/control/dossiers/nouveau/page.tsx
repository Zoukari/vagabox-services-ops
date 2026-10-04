"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { errMsg, sb } from "@/lib/supabase";
import { Client, Compagnie, Livreur, Tarif } from "@/lib/types";
import { nomComplet } from "@/lib/utils";
import { Alert, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import ClientForm from "@/components/ClientForm";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function NouveauDossier() {
  const router = useRouter();
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [f, setF] = useState({ numero_dossier: "", tag_iata: "", compagnie_id: "", livreur_id: "", prix_fdj: "", notes: "" });
  const [client, setClient] = useState<Client | null>(null);
  const [recherche, setRecherche] = useState("");
  const [modalClient, setModalClient] = useState(false);
  const [scan, setScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const c = sb("control");
    c.from("compagnies").select("*").order("nom").then(({ data }) => setCompagnies(data ?? []));
    c.from("livreurs").select("id, nom, telephone, auth_user_id, actif, created_at").eq("actif", true).order("nom").then(({ data }) => setLivreurs((data as Livreur[]) ?? []));
    c.from("tarification").select("*").eq("actif", true).then(({ data }) => setTarifs(data ?? []));
  }, []);

  useEffect(() => {
    const s = recherche.trim().replace(/[,()%*]/g, "");
    if (s.length < 2) { setClients([]); return; }
    const t = setTimeout(async () => {
      const { data } = await sb("control").from("clients").select("*")
        .or(`nom.ilike.%${s}%,prenom.ilike.%${s}%,telephone.ilike.%${s.replace(/\s/g, "")}%`).limit(8);
      setClients(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [recherche]);

  const tarifCompagnie = useMemo(() => tarifs.find((t) => t.compagnie_id === f.compagnie_id && t.type === "par_dossier"), [tarifs, f.compagnie_id]);
  const forfait = useMemo(() => tarifs.find((t) => t.compagnie_id === f.compagnie_id && t.type === "forfait_mensuel"), [tarifs, f.compagnie_id]);

  const onScan = useCallback((code: string) => { setF((p) => ({ ...p, tag_iata: code })); setScan(false); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return setErr("Sélectionnez ou créez un client");
    setLoading(true); setErr("");
    const { data, error } = await sb("control").from("dossiers").insert({
      numero_dossier: f.numero_dossier.trim() || null,
      tag_iata: f.tag_iata.trim() || null,
      compagnie_id: f.compagnie_id,
      client_id: client.id,
      livreur_id: f.livreur_id || null,
      prix_fdj: f.prix_fdj ? Number(f.prix_fdj) : null,
      quartier: client.quartier,
      notes: f.notes || null,
    } as any).select("id").single();
    setLoading(false);
    if (error) return setErr(errMsg(error));
    router.push(`/control/dossiers/${data!.id}`);
  }

  return (
    <>
      <PageHeader title="Nouveau dossier" />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="font-bold">Bagage</h2>
          <Field label="Tag IATA (code-barres)">
            <div className="flex gap-2">
              <Input value={f.tag_iata} onChange={(e) => setF({ ...f, tag_iata: e.target.value })} className="font-mono" placeholder="ex: 0071123456" />
              <Button type="button" variant="dark" className="shrink-0 whitespace-nowrap" onClick={() => setScan(true)}>📷 <span className="hidden sm:inline">Scanner</span></Button>
            </div>
          </Field>
          <Field label="N° dossier" hint="Laisser vide pour génération automatique (VS-AAMMJJ-0001)">
            <Input value={f.numero_dossier} onChange={(e) => setF({ ...f, numero_dossier: e.target.value })} className="font-mono" />
          </Field>
          <Field label="Compagnie *">
            <Select required value={f.compagnie_id} onChange={(e) => setF({ ...f, compagnie_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {compagnies.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.code ? ` (${c.code})` : ""}</option>)}
            </Select>
          </Field>
          <Field label="Prix (FDJ)" hint={tarifCompagnie ? `Tarif compagnie : ${tarifCompagnie.prix_fdj} FDJ — appliqué si vide` : forfait ? "Compagnie au forfait mensuel" : undefined}>
            <Input type="number" min={0} value={f.prix_fdj} onChange={(e) => setF({ ...f, prix_fdj: e.target.value })} placeholder={tarifCompagnie ? String(tarifCompagnie.prix_fdj) : ""} />
          </Field>
          <Field label="Livreur">
            <Select value={f.livreur_id} onChange={(e) => setF({ ...f, livreur_id: e.target.value })}>
              <option value="">— Non assigné —</option>
              {livreurs.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </Select>
          </Field>
          <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Client</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => setModalClient(true)}>+ Nouveau client</Button>
          </div>
          {client ? (
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-4">
              <div className="font-semibold">{nomComplet(client.nom, client.prenom)}</div>
              <div className="text-sm text-ink/70">{client.telephone}</div>
              <div className="text-sm text-ink/70">{client.quartier}{client.adresse_detail && ` — ${client.adresse_detail}`}</div>
              <button type="button" onClick={() => setClient(null)} className="mt-2 text-sm font-semibold text-accent-dark">Changer</button>
            </div>
          ) : (
            <>
              <Input placeholder="Rechercher par nom ou téléphone…" value={recherche} onChange={(e) => setRecherche(e.target.value)} autoFocus />
              <ul className="divide-y divide-black/5 rounded-lg border border-black/10">
                {clients.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setClient(c)} className="w-full px-3 py-2 text-left hover:bg-black/5">
                      <div className="text-sm font-semibold">{nomComplet(c.nom, c.prenom)}</div>
                      <div className="text-xs text-ink/60">{c.telephone} · {c.quartier}</div>
                    </button>
                  </li>
                ))}
                {recherche.length >= 2 && clients.length === 0 && <li className="px-3 py-3 text-sm text-ink/50">Aucun client — créez-le.</li>}
              </ul>
            </>
          )}
          <Alert>{err}</Alert>
          <Button className="w-full" size="lg" loading={loading}>Créer le dossier</Button>
        </Card>
      </form>

      <Modal open={modalClient} onClose={() => setModalClient(false)} title="Nouveau client">
        <ClientForm initial={{ telephone: /^\d/.test(recherche) ? recherche : "", nom: /^\d/.test(recherche) ? "" : recherche }}
          onSaved={(c) => { setClient(c); setModalClient(false); }} onCancel={() => setModalClient(false)} />
      </Modal>
      <Modal open={scan} onClose={() => setScan(false)} title="Scanner le tag IATA">
        <BarcodeScanner actif={scan} onResult={onScan} />
      </Modal>
    </>
  );
}
