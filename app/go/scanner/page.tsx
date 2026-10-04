"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Alert } from "@/components/ui";
import { sb } from "@/lib/supabase";

/** Scan tag IATA → recherche dans les dossiers du livreur (tag ou n° dossier) → ouvre le dossier. */
export default function Scanner() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "error" | "warn"; text: string } | null>(null);
  const [actif, setActif] = useState(true);

  const onResult = useCallback(async (code: string) => {
    const c = code.trim().replace(/[,(){}"]/g, "");
    if (!c) return;
    setMsg(null);
    let { data, error } = await sb("go").from("dossiers").select("id")
      .or(`tag_iata.eq.${c},numero_dossier.ilike.${c},tags_iata.cs.{${c}}`).limit(1);
    if (error) ({ data } = await sb("go").from("dossiers").select("id").or(`tag_iata.eq.${c},numero_dossier.ilike.${c}`).limit(1));
    if (data?.length) { setActif(false); router.push(`/go/dossiers/${data[0].id}?scan=${encodeURIComponent(c)}`); return; }
    // Tag partiel (10 chiffres IATA vs saisie courte) : recherche par suffixe
    const { data: d2 } = await sb("go").from("dossiers").select("id").ilike("tag_iata", `%${c.slice(-6)}`).limit(2);
    if (d2?.length === 1) { setActif(false); router.push(`/go/dossiers/${d2[0].id}?scan=${encodeURIComponent(c)}`); return; }
    setMsg({ kind: "warn", text: `Aucun de vos dossiers ne correspond à « ${c} ». Vérifiez le numéro ou contactez l'admin pour l'assignation.` });
  }, [router]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Scanner un bagage</h1>
      <BarcodeScanner actif={actif} onResult={onResult} />
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <p className="text-center text-xs text-ink/50">Visez le code-barres de l&apos;étiquette bagage. Saisie manuelle possible ci-dessus.</p>
    </div>
  );
}
