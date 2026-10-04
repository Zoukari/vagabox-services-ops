"use client";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

/**
 * Scanner codes-barres IATA (Interleaved 2 of 5 / Code 128) via caméra arrière.
 * Le champ de saisie manuelle reste toujours visible (fallback).
 */
export default function BarcodeScanner({ onResult, actif = true }: { onResult: (code: string) => void; actif?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const dernier = useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const [err, setErr] = useState("");
  const [manuel, setManuel] = useState("");
  const [lu, setLu] = useState<string | null>(null);

  useEffect(() => {
    if (!actif) return;
    let stop = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
        if (stop || !video.current) return;
        controls.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          video.current,
          (res) => {
            if (!res) return;
            const code = res.getText().trim();
            const now = Date.now();
            if (code === dernier.current.code && now - dernier.current.t < 3000) return;
            dernier.current = { code, t: now };
            setLu(code);
            navigator.vibrate?.(80);
            onResult(code);
          },
        );
      } catch (e: any) {
        setErr(e?.name === "NotAllowedError"
          ? "Accès caméra refusé — autorisez la caméra ou saisissez le numéro."
          : "Caméra indisponible — saisissez le numéro ci-dessous.");
      }
    })();
    return () => { stop = true; controls.current?.stop(); controls.current = null; };
  }, [actif, onResult]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-night">
        <video ref={video} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-accent/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-red-500" />
        </div>
        {err && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-snow">{err}</div>}
        {lu && <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-night/70 px-3 py-1.5 text-center font-mono text-sm text-snow">{lu}</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (manuel.trim()) onResult(manuel.trim()); }} className="flex gap-2">
        <input value={manuel} onChange={(e) => setManuel(e.target.value)} placeholder="Saisie manuelle : n° tag ou dossier"
          inputMode="text" autoCapitalize="characters"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 font-mono text-base outline-none transition focus:border-accent focus:shadow-glow" />
        <button className="h-12 shrink-0 rounded-xl bg-navy px-5 font-semibold text-snow">OK</button>
      </form>
    </div>
  );
}
