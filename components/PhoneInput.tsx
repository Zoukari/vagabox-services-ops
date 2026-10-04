"use client";
import { PAYS } from "@/lib/constants";
import { cx } from "@/lib/utils";

export interface Tel { indicatif: string; numero: string }

/** Numéro complet au format international : +25377123456 (zéros de tête retirés) */
export const telComplet = (t: Tel) => {
  const n = t.numero.replace(/\D/g, "").replace(/^0+/, "");
  return n ? `+${t.indicatif}${n}` : "";
};

/** Sélecteur de pays (indicatif, liste déroulante) + numéro */
export default function PhoneInput({ value, onChange, required }: { value: Tel; onChange: (t: Tel) => void; required?: boolean }) {
  const cls = "h-11 rounded-xl border border-black/10 bg-white px-2.5 text-sm text-ink outline-none transition hover:border-black/20 focus:border-accent focus:shadow-glow";
  return (
    <div className="flex gap-2" dir="ltr">
      <select aria-label="Pays" value={value.indicatif} onChange={(e) => onChange({ ...value, indicatif: e.target.value })}
        className={cx(cls, "w-[45%] max-w-[11.5rem] shrink-0 pr-8")}>
        {PAYS.map((p) => <option key={p.code} value={p.indicatif}>{p.drapeau} {p.nom} +{p.indicatif}</option>)}
      </select>
      <input type="tel" inputMode="tel" size={8} required={required} value={value.numero}
        onChange={(e) => onChange({ ...value, numero: e.target.value.replace(/[^\d\s]/g, "") })}
        placeholder={value.indicatif === "253" ? "77 12 34 56" : "Numéro"}
        className={cx(cls, "min-w-0 flex-1 px-3.5 tracking-wide")} />
    </div>
  );
}
