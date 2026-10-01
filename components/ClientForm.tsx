"use client";
import { useState } from "react";
import { sb, errMsg } from "@/lib/supabase";
import { Client } from "@/lib/types";
import { Alert, Button, Field, Input, QuartierSelect, Textarea } from "./ui";

export default function ClientForm({ initial, onSaved, onCancel }: { initial?: Partial<Client>; onSaved: (c: Client) => void; onCancel?: () => void }) {
  const [f, setF] = useState({
    nom: initial?.nom ?? "", prenom: initial?.prenom ?? "", telephone: initial?.telephone ?? "",
    quartier: initial?.quartier ?? "", adresse_detail: initial?.adresse_detail ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); e.stopPropagation(); setLoading(true); setErr("");
    const payload = { ...f, prenom: f.prenom || null, quartier: f.quartier || null, adresse_detail: f.adresse_detail || null, telephone: f.telephone.replace(/\s/g, "") };
    const q = initial?.id
      ? sb("control").from("clients").update(payload).eq("id", initial.id).select().single()
      : sb("control").from("clients").insert(payload).select().single();
    const { data, error } = await q;
    setLoading(false);
    if (error) return setErr(errMsg(error));
    onSaved(data as Client);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom *"><Input required value={f.nom} onChange={set("nom")} /></Field>
        <Field label="Prénom"><Input value={f.prenom} onChange={set("prenom")} /></Field>
      </div>
      <Field label="Téléphone *" hint="Format Djibouti : 77 12 34 56"><Input required type="tel" inputMode="tel" value={f.telephone} onChange={set("telephone")} /></Field>
      <Field label="Quartier"><QuartierSelect value={f.quartier} onChange={set("quartier")} /></Field>
      <Field label="Adresse / repères"><Textarea rows={2} value={f.adresse_detail} onChange={set("adresse_detail")} /></Field>
      <Alert>{err}</Alert>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>}
        <Button loading={loading}>{initial?.id ? "Enregistrer" : "Créer le client"}</Button>
      </div>
    </form>
  );
}
