"use client";
import { useState } from "react";
import { Statut } from "@/lib/constants";
import { cx, messageWhatsApp, nomComplet, telWa } from "@/lib/utils";
import { DossierVue } from "@/lib/types";

/** Bouton wa.me pré-rempli + fallback « Copier le message ». */
export default function WhatsAppButton({ dossier, statut, compact }: { dossier: DossierVue; statut?: Statut; compact?: boolean }) {
  const [copie, setCopie] = useState(false);
  const st = statut ?? dossier.statut;
  const msg = messageWhatsApp(st, {
    nom_client: nomComplet(dossier.client_nom, dossier.client_prenom) || "client",
    numero_dossier: dossier.numero_dossier,
    livreur: dossier.livreur_nom,
  });
  if (!msg) return null;
  const tel = telWa(dossier.client_telephone);
  const href = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : undefined;

  async function copier() {
    try { await navigator.clipboard.writeText(msg!); }
    catch {
      const t = document.createElement("textarea"); t.value = msg!; document.body.appendChild(t); t.select();
      document.execCommand("copy"); t.remove();
    }
    setCopie(true); setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className={cx("rounded-xl border border-green-200 bg-green-50 p-3", compact && "p-2")}>
      {!compact && <p className="mb-2 text-sm text-green-900">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-snow hover:brightness-95">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>
            WhatsApp
          </a>
        )}
        <button onClick={copier}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-green-300 bg-white px-4 text-sm font-semibold text-green-800 hover:bg-green-100">
          {copie ? "✓ Copié" : "Copier le message"}
        </button>
      </div>
      {!tel && <p className="mt-1 text-xs text-red-700">Numéro client invalide — utilisez la copie.</p>}
    </div>
  );
}
