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
  const pays = PAYS.find((p) => p.indicatif === value.indicatif) ?? PAYS[0];
  return (
    <div className="flex gap-2" dir="ltr">
      <div className={cx(cls, "relative flex w-[6.75rem] shrink-0 items-center gap-1.5 pr-7 focus-within:border-accent focus-within:shadow-glow")}>
        <span className="text-lg leading-none">{pays.drapeau}</span>
        <span className="font-semibold tabular-nums" data-no-i18n>+{pays.indicatif}</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 h-3 w-3 text-ink/40" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
        <select aria-label="Pays" value={value.indicatif} onChange={(e) => onChange({ ...value, indicatif: e.target.value })}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          {PAYS.map((p) => <option key={p.code} value={p.indicatif}>{p.drapeau} {p.nom} +{p.indicatif}</option>)}
        </select>
      </div>
      <input type="tel" inputMode="tel" size={8} required={required} value={value.numero}
        onChange={(e) => onChange({ ...value, numero: e.target.value.replace(/[^\d\s]/g, "") })}
        placeholder={value.indicatif === "253" ? "77 12 34 56" : "Numéro"}
        className={cx(cls, "min-w-0 flex-1 px-3.5 tracking-wide")} />
    </div>
  );
}
