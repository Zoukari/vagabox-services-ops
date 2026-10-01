"use client";
import { useRef, useState } from "react";
import { App, sb } from "@/lib/supabase";
import { compresserImage, cx } from "@/lib/utils";

/**
 * Prise de photo (caméra arrière sur mobile) → compression → upload Supabase Storage.
 * Renvoie le chemin Storage via onUploaded.
 */
export default function PhotoUpload({ app, dossier, prefix = "dossiers", label = "Prendre une photo", onUploaded, className }: {
  app: App; dossier?: string; prefix?: "dossiers" | "factures"; label?: string;
  onUploaded: (path: string | null) => void; className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [etat, setEtat] = useState<"idle" | "upload" | "ok" | "err">("idle");
  const [err, setErr] = useState("");

  async function onFile(f?: File) {
    if (!f) return;
    setPreview(URL.createObjectURL(f)); setEtat("upload"); setErr(""); onUploaded(null);
    const blob = await compresserImage(f);
    const path = prefix === "factures"
      ? `factures/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
      : `dossiers/${dossier}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await sb(app).storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
    if (error) { setEtat("err"); setErr(error.message); return; }
    setEtat("ok"); onUploaded(path);
  }

  return (
    <div className={className}>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" onClick={() => ref.current?.click()}
        className={cx("flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-3 text-left transition",
          etat === "ok" ? "border-green-400 bg-green-50" : etat === "err" ? "border-red-400 bg-red-50" : "border-black/20 hover:border-accent")}>
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
          : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-black/5 text-2xl">📷</span>}
        <span className="text-sm font-semibold text-ink">
          {etat === "upload" ? "Envoi…" : etat === "ok" ? "✓ Photo enregistrée — toucher pour reprendre" : etat === "err" ? `Échec : ${err}` : label}
        </span>
      </button>
    </div>
  );
}
