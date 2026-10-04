import { TYPES_INCIDENT } from "@/lib/constants";
import { DossierVue } from "@/lib/types";
import { dateCourte, dateHeure } from "@/lib/utils";

/** Infos de la déclaration bagage (saisie VS Track) — n'affiche rien si le dossier n'en a pas */
export default function InfosDeclaration({ d, compact }: { d: DossierVue; compact?: boolean }) {
  const tags = (d.tags_iata ?? []).filter(Boolean);
  const lignes: [string, React.ReactNode][] = [
    ["Valises", d.nb_valises ? <b>{d.nb_valises}</b> : null],
    ["Incident", d.type_incident ? TYPES_INCIDENT[d.type_incident] : null],
    ["Vol", [d.numero_vol, d.date_vol && dateCourte(d.date_vol)].filter(Boolean).join(" · ") || null],
    ["Provenance", d.provenance],
    ["N° PIR", d.numero_pir ? <span className="font-mono">{d.numero_pir}</span> : null],
    ["Tags IATA", tags.length > 1 ? <span className="font-mono">{tags.join(", ")}</span> : null],
    ["Description", d.description_bagages],
    ["Contenu", compact ? null : d.contenu],
    ["Email", compact ? null : d.client_email],
    ["Déclaré le", compact || !d.declare_le ? null : dateHeure(d.declare_le)],
  ];
  const visibles = lignes.filter(([, v]) => v != null && v !== "");
  if (!d.declare_par && visibles.length <= 1) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-800">🧳 Déclaration bagage</div>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        {visibles.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink/50">{k}</dt><dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
