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
  const cls = "h-10 rounded-lg border border-black/15 bg-white px-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
  return (
    <div className="flex gap-2">
      <select aria-label="Pays" value={value.indicatif} onChange={(e) => onChange({ ...value, indicatif: e.target.value })}
        className={cx(cls, "w-[8.5rem] shrink-0")}>
        {PAYS.map((p) => <option key={p.code} value={p.indicatif}>{p.drapeau} {p.nom} +{p.indicatif}</option>)}
      </select>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/50">+{value.indicatif}</span>
        <input type="tel" inputMode="tel" required={required} value={value.numero}
          onChange={(e) => onChange({ ...value, numero: e.target.value.replace(/[^\d\s]/g, "") })}
          placeholder={value.indicatif === "253" ? "77 12 34 56" : "Numéro"}
          className={cx(cls, "w-full")} style={{ paddingLeft: `${1.4 + value.indicatif.length * 0.55}rem` }} />
      </div>
    </div>
  );
}
