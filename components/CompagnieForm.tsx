"use client";
import { useState } from "react";
import { errMsg, sb } from "@/lib/supabase";
import { Compagnie } from "@/lib/types";
import { Alert, Button, Field, Input } from "./ui";

export default function CompagnieForm({ initial, onSaved }: { initial?: Partial<Compagnie>; onSaved: () => void }) {
  const [f, setF] = useState({
    nom: initial?.nom ?? "", code: initial?.code ?? "", contact_nom: initial?.contact_nom ?? "",
    contact_email: initial?.contact_email ?? "", contact_telephone: initial?.contact_telephone ?? "",
  });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const payload: any = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null]));
    payload.code = (payload.code as string | null)?.toUpperCase() ?? null;
    const { error } = initial?.id
      ? await sb("control").from("compagnies").update(payload).eq("id", initial.id)
      : await sb("control").from("compagnies").insert(payload);
    setLoading(false);
    if (error) return setErr(errMsg(error));
    onSaved();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Nom *" className="col-span-2"><Input required value={f.nom} onChange={set("nom")} placeholder="Ethiopian Airlines" /></Field>
        <Field label="Code"><Input value={f.code} onChange={set("code")} placeholder="ET" maxLength={3} /></Field>
      </div>
      <Field label="Contact"><Input value={f.contact_nom} onChange={set("contact_nom")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><Input type="email" value={f.contact_email} onChange={set("contact_email")} /></Field>
        <Field label="Téléphone"><Input value={f.contact_telephone} onChange={set("contact_telephone")} /></Field>
      </div>
      <Alert>{err}</Alert>
      <Button className="w-full" loading={loading}>Enregistrer</Button>
    </form>
  );
}

