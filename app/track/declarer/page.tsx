"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errMsg, sb } from "@/lib/supabase";
import { TYPES_INCIDENT } from "@/lib/constants";
import { estSaisie, useTrackProfil } from "@/lib/trackContext";
import { aujourdhui, cx } from "@/lib/utils";
import { Alert, Button, Card, Field, Input, Modal, PageHeader, QuartierSelect, Select, Textarea } from "@/components/ui";
import BarcodeScanner from "@/components/BarcodeScanner";
import PhoneInput, { Tel, telComplet } from "@/components/PhoneInput";

const VIDE = {
  nom: "", prenom: "", email: "", quartier: "", adresse_detail: "",
  compagnie_id: "", numero_vol: "", date_vol: "", provenance: "", numero_pir: "",
  type_incident: "retarde", description_bagages: "", contenu: "", notes: "",
};

export default function Declarer() {
  const profil = useTrackProfil();
  const router = useRouter();
  const [compagnies, setCompagnies] = useState<{ id: string; nom: string; code: string | null }[]>([]);
  const [f, setF] = useState({ ...VIDE, date_vol: aujourdhui() });
  const [tel, setTel] = useState<Tel>({ indicatif: "253", numero: "" });
  const [nb, setNb] = useState(1);
  const [tags, setTags] = useState<string[]>([""]);
  const [scanIdx, setScanIdx] = useState<number | null>(null);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<{ id: string; numero_dossier: string } | null>(null);

  useEffect(() => { if (!estSaisie(profil)) router.replace("/track"); }, [profil, router]);
  useEffect(() => {
    sb("track").from("compagnies").select("id, nom, code").order("nom").then(({ data }) => setCompagnies(data ?? []));
  }, []);
  useEffect(() => { setTags((t) => Array.from({ length: nb }, (_, i) => t[i] ?? "")); }, [nb]);

  const set = (k: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const onScan = useCallback((code: string) => {
    setTags((t) => t.map((v, i) => (i === scanIdx ? code : v))); setScanIdx(null);
  }, [scanIdx]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const telephone = telComplet(tel);
    if (telephone.replace(/\D/g, "").length < 8) return setErr("Numéro de téléphone invalide");
    setLoading(true);
    const { data, error } = await sb("track").rpc("declarer_bagage", {
      p: { ...f, telephone, nb_valises: nb, tags_iata: tags.map((t) => t.trim()).filter(Boolean) },
    });
    setLoading(false);
    if (error) return setErr(errMsg(error));
    setOk(data as { id: string; numero_dossier: string });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nouvelle() {
    setF({ ...VIDE, date_vol: aujourdhui(), compagnie_id: f.compagnie_id, numero_vol: f.numero_vol, provenance: f.provenance });
    setTel({ indicatif: "253", numero: "" }); setNb(1); setTags([""]); setOk(null);
  }

  if (ok) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-xl font-bold">Bagage déclaré</h1>
        <p className="mt-1 text-ink/60">Dossier transmis à Vagabox Services pour livraison.</p>
        <div className="mt-4 rounded-xl bg-black/5 py-3 font-mono text-2xl font-bold">{ok.numero_dossier}</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={nouvelle}>+ Nouvelle déclaration</Button>
          <Link href={`/track/dossiers/${ok.id}`}><Button variant="outline" className="w-full">Voir le dossier</Button></Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title="Déclarer un bagage" sub="Bagage à livrer à domicile par Vagabox Services" />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="font-bold">👤 Passager</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom *"><Input required value={f.nom} onChange={set("nom")} autoComplete="off" /></Field>
              <Field label="Prénom *"><Input required value={f.prenom} onChange={set("prenom")} autoComplete="off" /></Field>
            </div>
            <Field label="Téléphone (WhatsApp de préférence) *"><PhoneInput required value={tel} onChange={setTel} /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={set("email")} /></Field>
            <Field label="Quartier de livraison"><QuartierSelect value={f.quartier} onChange={set("quartier")} /></Field>
            <Field label="Adresse / repères"><Textarea rows={2} value={f.adresse_detail} onChange={set("adresse_detail")} placeholder="Ex : près de la mosquée, immeuble bleu, 2e étage" /></Field>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-bold">✈️ Vol</h2>
            <Field label="Compagnie aérienne *">
              <Select required value={f.compagnie_id} onChange={set("compagnie_id")}>
                <option value="">— Choisir —</option>
                {compagnies.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.code ? ` (${c.code})` : ""}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="N° de vol"><Input value={f.numero_vol} onChange={set("numero_vol")} placeholder="ET 3802" className="uppercase" /></Field>
              <Field label="Date du vol"><Input type="date" value={f.date_vol} onChange={set("date_vol")} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provenance"><Input value={f.provenance} onChange={set("provenance")} placeholder="ADD, CDG, IST…" className="uppercase" /></Field>
              <Field label="N° PIR / réf. dossier"><Input value={f.numero_pir} onChange={set("numero_pir")} placeholder="JIBET12345" className="font-mono uppercase" /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="font-bold">🧳 Bagages</h2>
            <Field label="Type d'incident">
              <div className="grid gap-2">
                {Object.entries(TYPES_INCIDENT).map(([k, v]) => (
                  <label key={k} className={cx("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm normal-case tracking-normal",
                    f.type_incident === k ? "border-accent bg-accent/10 font-semibold" : "border-black/10")}>
                    <input type="radio" name="type_incident" value={k} checked={f.type_incident === k} onChange={set("type_incident")} />{v}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Nombre de valises *">
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setNb(Math.max(1, nb - 1))}>−</Button>
                <span className="w-10 text-center text-2xl font-bold tabular-nums">{nb}</span>
                <Button type="button" variant="outline" onClick={() => setNb(Math.min(20, nb + 1))}>+</Button>
              </div>
            </Field>
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink/60">Tags IATA (un par valise)</span>
              {tags.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex w-8 items-center justify-center text-sm font-semibold text-ink/50">{i + 1}</span>
                  <Input value={t} onChange={(e) => setTags(tags.map((v, j) => (j === i ? e.target.value : v)))} className="font-mono" placeholder="0071123456" />
                  <Button type="button" variant="dark" onClick={() => setScanIdx(i)} title="Scanner">📷</Button>
                </div>
              ))}
            </div>
            <Field label="Description des valises" hint="Couleur, marque, taille, signes distinctifs">
              <Textarea rows={2} value={f.description_bagages} onChange={set("description_bagages")} placeholder="Valise rigide noire Samsonite 70 cm + sac bleu" />
            </Field>
            <Field label="Contenu déclaré"><Textarea rows={2} value={f.contenu} onChange={set("contenu")} /></Field>
            <Field label="Remarques"><Textarea rows={2} value={f.notes} onChange={set("notes")} /></Field>
            <Alert>{err}</Alert>
            <Button className="w-full" size="lg" loading={loading}>Enregistrer la déclaration</Button>
          </Card>
        </div>
      </form>
      <Modal open={scanIdx !== null} onClose={() => setScanIdx(null)} title={`Scanner le tag — valise ${(scanIdx ?? 0) + 1}`}>
        <BarcodeScanner actif={scanIdx !== null} onResult={onScan} />
      </Modal>
    </>
  );
}
