"use client";
import { useState } from "react";
import { App, errMsg, sb } from "@/lib/supabase";
import { Alert, Button } from "./ui";

/** Confirme l'arrivée de la valise → le dossier passe directement « À récupérer » (livreur). */
export default function ConfirmerArrivee({ app, dossierId, nb, onDone }: { app: App; dossierId: string; nb?: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (!confirm(nb && nb > 1 ? `Confirmer l'arrivée des ${nb} valises ?` : "Confirmer l'arrivée de la valise ?")) return;
    setLoading(true); setErr("");
    const { error } = await sb(app).rpc("confirmer_arrivee", { p_dossier: dossierId });
    setLoading(false);
    if (error) return setErr(errMsg(error));
    navigator.vibrate?.(60);
    onDone();
  }
  return (
    <div className="space-y-2">
      <Button size="lg" variant="success" className="w-full" loading={loading} onClick={go}>
        ✈️ Confirmer l&apos;arrivée {nb && nb > 1 ? "des valises" : "de la valise"}
      </Button>
      <Alert>{err}</Alert>
    </div>
  );
}
