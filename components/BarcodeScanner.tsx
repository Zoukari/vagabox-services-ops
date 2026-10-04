"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

/**
 * Scanner codes-barres IATA (Interleaved 2 of 5 / Code 128).
 * 1. Vidéo en direct : détecteur natif du téléphone si dispo (Android/Chrome), sinon ZXing.
 * 2. « Photo du tag » : photo plein format (mise au point de l'appareil) décodée → fiable sur iPhone.
 * 3. Saisie manuelle toujours visible.
 */
const FORMATS_NATIFS = ["itf", "code_128", "code_39", "ean_13", "codabar"];

async function zxingHints() {
  const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13, BarcodeFormat.CODABAR]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

/** Décode un code-barres dans une image (plusieurs tailles + rotation 90°). */
async function decoderImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    // 1) Détecteur natif
    const BD = (window as any).BarcodeDetector;
    if (BD) {
      try {
        const r = await new BD({ formats: FORMATS_NATIFS }).detect(img);
        if (r?.[0]?.rawValue) return String(r[0].rawValue).trim();
      } catch { /* on continue avec ZXing */ }
    }
    // 2) ZXing sur canvas, à plusieurs échelles et orientations
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader(await zxingHints());
    for (const largeur of [1600, 2400, 1000]) {
      for (const rot of [0, 90]) {
        const s = Math.min(1, largeur / Math.max(img.width, img.height));
        const w = Math.round(img.width * s), h = Math.round(img.height * s);
        const c = document.createElement("canvas");
        c.width = rot ? h : w; c.height = rot ? w : h;
        const ctx = c.getContext("2d")!;
        if (rot) { ctx.translate(c.width / 2, c.height / 2); ctx.rotate(Math.PI / 2); ctx.drawImage(img, -w / 2, -h / 2, w, h); }
        else ctx.drawImage(img, 0, 0, w, h);
        try { return reader.decodeFromCanvas(c).getText().trim(); } catch { /* essai suivant */ }
      }
    }
    return null;
  } finally { URL.revokeObjectURL(url); }
}

export default function BarcodeScanner({ onResult, actif = true }: { onResult: (code: string) => void; actif?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const dernier = useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [manuel, setManuel] = useState("");
  const [lu, setLu] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState(false);
  const cb = useRef(onResult);
  cb.current = onResult;   // toujours la dernière version, sans redémarrer la caméra

  const trouve = useCallback((brut: string) => {
    const code = brut.replace(/\s+/g, "").trim();
    if (!code) return;
    const now = Date.now();
    if (code === dernier.current.code && now - dernier.current.t < 3000) return;
    dernier.current = { code, t: now };
    setLu(code); setInfo("");
    navigator.vibrate?.(80);
    cb.current(code);
  }, []);

  useEffect(() => {
    if (!actif) return;
    let stop = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const contraintes: MediaStreamConstraints = {
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        };
        const BD = (window as any).BarcodeDetector;
        const natifOk = BD && (await BD.getSupportedFormats?.().catch(() => []))?.some((f: string) => FORMATS_NATIFS.includes(f));
        if (natifOk) {
          // ── Détecteur natif (rapide et précis) ──
          stream = await navigator.mediaDevices.getUserMedia(contraintes);
          if (stop || !video.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          const track = stream.getVideoTracks()[0];
          try { await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] }); } catch { /* non supporté */ }
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
          const det = new BD({ formats: FORMATS_NATIFS });
          const boucle = async () => {
            if (stop || !video.current) return;
            try {
              if (video.current.readyState >= 2) {
                const r = await det.detect(video.current);
                if (r?.[0]?.rawValue) trouve(String(r[0].rawValue));
              }
            } catch { /* frame suivante */ }
            timer = setTimeout(boucle, 180);
          };
          boucle();
        } else {
          // ── ZXing (iPhone / Safari) ──
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader(await zxingHints(), { delayBetweenScanAttempts: 100 });
          if (stop || !video.current) return;
          controls.current = await reader.decodeFromConstraints(contraintes, video.current, (res) => { if (res) trouve(res.getText()); });
          setInfo("Si le scan ne réagit pas : rapprochez l'étiquette ou utilisez « Photo du tag ».");
        }
      } catch (e: any) {
        setErr(e?.name === "NotAllowedError"
          ? "Accès caméra refusé — autorisez la caméra ou saisissez le numéro."
          : "Caméra indisponible — saisissez le numéro ci-dessous.");
      }
    })();
    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
      controls.current?.stop(); controls.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [actif, trouve]);

  async function photo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setAnalyse(true); setInfo(""); setErr("");
    const code = await decoderImage(f).catch(() => null);
    setAnalyse(false);
    if (code) trouve(code);
    else setInfo("Code-barres illisible sur la photo — reprenez-la de plus près, bien à plat, ou saisissez le numéro.");
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-night">
        <video ref={video} className="h-full w-full object-cover" muted playsInline autoPlay />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-accent/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-red-500" />
        </div>
        {err && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-snow">{err}</div>}
        {lu && <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-night/70 px-3 py-1.5 text-center font-mono text-sm text-snow" data-no-i18n>✓ {lu}</div>}
      </div>

      <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-white font-semibold text-accent transition active:scale-[.98]">
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={photo} />
        {analyse ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <span>📸</span>}
        <span>{analyse ? "Analyse de la photo…" : "Photo du tag"}</span>
      </label>
      {info && <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">{info}</p>}

      <form onSubmit={(e) => { e.preventDefault(); if (manuel.trim()) onResult(manuel.trim()); }} className="flex gap-2">
        <input value={manuel} onChange={(e) => setManuel(e.target.value)} placeholder="Saisie manuelle : n° tag ou dossier"
          inputMode="text" autoCapitalize="characters"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 font-mono text-base outline-none transition focus:border-accent focus:shadow-glow" />
        <button className="h-12 shrink-0 rounded-xl bg-navy px-5 font-semibold text-snow">OK</button>
      </form>
    </div>
  );
}
