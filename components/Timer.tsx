"use client";
import { useEffect, useState } from "react";
import { TIMER_LIVRAISON_MS } from "@/lib/constants";
import { cx, dureeRestante } from "@/lib/utils";

/** Compte à rebours 1h depuis le passage en en_livraison ; passe en rouge « Retard » au-delà. */
export default function Timer({ depuis, big }: { depuis: string | null; big?: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(i); }, []);
  const d = dureeRestante(depuis, TIMER_LIVRAISON_MS);
  if (!d) return null;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-lg font-mono font-bold tabular-nums",
      big ? "px-3 py-2 text-3xl" : "px-2 py-0.5 text-xs",
      d.retard ? "bg-red-600 text-white" : "bg-orange-100 text-orange-800")}>
      ⏱ {d.retard ? `Retard ${d.texte}` : d.texte}
    </span>
  );
}
