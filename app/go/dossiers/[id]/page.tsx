"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import InfosDeclaration from "@/components/InfosDeclaration";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { errMsg, sb } from "@/lib/supabase";
import { Statut, STATUTS } from "@/lib/constants";
import { DossierVue } from "@/lib/types";
import { nomComplet } from "@/lib/utils";
import { Alert, Button, Loading, Modal, StatutBadge, Textarea } from "@/components/ui";
import StatusTimeline from "@/components/StatusTimeline";
import WhatsAppButton from "@/components/WhatsAppButton";
import PhotoUpload from "@/components/PhotoUpload";
import BarcodeScanner from "@/components/BarcodeScanner";
import Timer from "@/components/Timer";

type Action = "recupere" | "en_livraison" | "livre" | "non_trouve" | "signalement";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [d, setD] = useState<DossierVue | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [notif, setNotif] = useState<Statut | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb("go").from("dossiers_vue").select("*").eq("id", id).single();
    setD(data as DossierVue);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function demarrer() {
    const { error } = await sb("go").rpc("changer_statut", { p_dossier: id, p_statut: "en_livraison" });
    if (error) return alert(errMsg(error));
    navigator.vibrate?.(60);
    await load(); setRefresh((r) => r + 1); setNotif("en_livraison");
  }

  if (!d) return <Loading />;
  const tel = d.client_telephone?.replace(/\D/g, "");

  return (
    <div className="space-y-4">
      <Link href="/go" className="text-sm text-ink/60">← Mes dossiers</Link>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-2">
          <div className="font-mono text-lg font-bold">{d.numero_dossier}</div>
          <StatutBadge statut={d.statut} retard={d.en_retard} />
        </div>
        <div className="mt-2 text-xl font-semibold">{nomComplet(d.client_nom, d.client_prenom)}</div>
        <div className="text-ink/70">📍 {d.quartier ?? "—"}</div>
        {d.client_adresse && <div className="text-sm text-ink/60">{d.client_adresse}</div>}
        <div className="mt-1 text-sm text-ink/50">{d.compagnie_nom}{d.tag_iata && <> · Tag <span className="font-mono">{d.tag_iata}</span></>}</div>
        {d.notes && <div className="mt-2 rounded-lg bg-amber-50 p-2 text-sm">{d.notes}</div>}
        <div className="mt-2"><InfosDeclaration d={d} compact /></div>
        {tel && (
          <a href={`tel:${tel.length === 8 ? "+253" + tel : "+" + tel}`}
            className="mt-3 flex h-11 items-center justify-center rounded-xl border border-black/15 font-semibold">📞 Appeler {d.client_telephone}</a>
        )}
      </div>

      {d.statut === "en_livraison" && (
        <div className="flex flex-col items-center rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Temps restant</div>
          <Timer depuis={d.en_livraison_depuis} big />
        </div>
      )}

      {notif && (
        <div>
          <div className="mb-1 text-sm font-semibold">Prévenir le client — {STATUTS[notif].label}</div>
          <WhatsAppButton dossier={d} statut={notif} />
        </div>
      )}

      {/* Actions selon le statut */}
      <div className="space-y-2">
        {d.statut === "a_recuperer" && <Button size="lg" className="w-full" onClick={() => setAction("recupere")}>📦 Récupérer le bagage</Button>}
        {(d.statut === "recupere" || d.statut === "replanifie") && (
          <Button size="lg" className="w-full" variant="dark" onClick={demarrer}>🛵 Démarrer la livraison (timer 1h)</Button>
        )}
        {d.statut === "en_livraison" && (
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" variant="success" className="whitespace-nowrap px-3" onClick={() => setAction("livre")}>✓ Livré</Button>
            <Button size="lg" variant="danger" className="whitespace-nowrap px-3" onClick={() => setAction("non_trouve")}>✕ Non trouvé</Button>
          </div>
        )}
        {d.statut !== "livre" && (
          <Button variant="outline" className="w-full" onClick={() => setAction("signalement")}>⚠ Signalement</Button>
        )}
        {!notif && ["recupere", "en_livraison", "livre", "non_trouve"].includes(d.statut) && (
          <button onClick={() => setNotif(d.statut)} className="w-full py-2 text-sm font-semibold text-green-700">💬 Message WhatsApp client</button>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <h2 className="mb-3 font-bold">Chronologie</h2>
        <StatusTimeline app="go" dossierId={d.id} refresh={refresh} />
      </div>

      {action && (
        <ActionModal action={action} dossier={d} scanInitial={params.get("scan")} onClose={() => setAction(null)}
          onDone={async (st) => { setAction(null); await load(); setRefresh((r) => r + 1); setNotif(st === "signalement" ? null : st); }} />
      )}
    </div>
  );
}

const TITRES: Record<Action, string> = {
  recupere: "Récupérer le bagage", en_livraison: "Démarrer", livre: "Confirmer la livraison",
  non_trouve: "Client non trouvé", signalement: "Signalement",
};

function ActionModal({ action, dossier, scanInitial, onClose, onDone }: {
  action: Action; dossier: DossierVue; scanInitial: string | null; onClose: () => void; onDone: (s: Action) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [verifManuelle, setVerifManuelle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Un tag par valise : on scanne chaque valise déclarée
  const normal = (x: string) => x.replace(/\D/g, "").slice(-6) || x.toUpperCase();
  const tagsAttendus = Array.from(new Set([dossier.tag_iata, ...(dossier.tags_iata ?? [])].filter(Boolean) as string[]));
  const nbValises = Math.max(dossier.nb_valises ?? 1, tagsAttendus.length, 1);
  const [scans, setScans] = useState<(string | null)[]>(() => Array.from({ length: nbValises }, (_, i) => (i === 0 ? scanInitial : null)));
  const [scanIdx, setScanIdx] = useState<number | null>(null);
  const [doublon, setDoublon] = useState("");
  const correspond = (c: string) => !tagsAttendus.length || tagsAttendus.some((t) => c === t || normal(c) === normal(t));
  const slotOk = (c: string | null) => !!c && correspond(c);
  const tousOk = scans.every(slotOk);
  const nbOk = scans.filter(slotOk).length;

  const onScan = useCallback((c: string) => {
    setDoublon("");
    const idx = scanIdx ?? 0;
    if (scans.some((x, i) => i !== idx && x && normal(x) === normal(c))) { setDoublon(c); return; }
    const next = scans.map((x, i) => (i === idx ? c : x));
    setScans(next);
    const vide = next.findIndex((x) => !x);
    setScanIdx(vide >= 0 ? vide : null);   // enchaîne sur la valise suivante
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanIdx, scans]);
  const tagOk = tousOk;
  const photoRequise = action === "recupere" || action === "livre";
  const commentRequis = action === "non_trouve" || action === "signalement";
  const pret = (!photoRequise || photo) && (!commentRequis || commentaire.trim()) && (action !== "recupere" || tagOk || verifManuelle);

  async function valider() {
    setLoading(true); setErr("");
    let com = commentaire.trim() || null;
    if (action === "recupere") {
      const lus = scans.filter(Boolean) as string[];
      if (lus.length) com = [`Tags scannés (${lus.length}/${nbValises}) : ${lus.join(", ")}`, com].filter(Boolean).join(" — ");
      if (!tagOk && verifManuelle) com = ["Tags vérifiés manuellement", com].filter(Boolean).join(" — ");
    }
    const { error } = await sb("go").rpc("changer_statut", { p_dossier: dossier.id, p_statut: action, p_commentaire: com, p_photo_url: photo });
    setLoading(false);
    if (error) return setErr(errMsg(error));
    navigator.vibrate?.(60);
    onDone(action);
  }

  return (
    <Modal open onClose={onClose} title={TITRES[action]}>
      <div className="space-y-4">
        {action === "recupere" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>1. Scanner les tags ({nbValises} valise{nbValises > 1 ? "s" : ""})</span>
              <span className={tagOk ? "text-green-600" : "text-ink/50"} data-no-i18n>{nbOk}/{nbValises}</span>
            </div>
            {scanIdx !== null && (
              <div className="rounded-2xl border border-accent/30 p-2">
                <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-accent">Valise {scanIdx + 1}</div>
                <BarcodeScanner actif onResult={onScan} />
                <button onClick={() => setScanIdx(null)} className="mt-2 w-full py-1 text-sm font-semibold text-ink/50">Fermer le scanner</button>
              </div>
            )}
            {doublon && <Alert kind="warn">Tag déjà scanné : {doublon}</Alert>}
            <div className="space-y-2">
              {scans.map((c, i) => (
                <button key={i} onClick={() => setScanIdx(i)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 p-3 text-left transition ${slotOk(c) ? "border-green-400 bg-green-50" : c ? "border-red-400 bg-red-50" : scanIdx === i ? "border-accent" : "border-dashed border-black/20"}`}>
                  <span className="min-w-0 text-sm font-semibold">
                    <span className="mr-2 text-ink/50">Valise {i + 1}</span>
                    {c ? <span className="font-mono" data-no-i18n>{c}</span> : <span>📷 Scanner le code-barres</span>}
                  </span>
                  <span className="shrink-0 text-sm">{c ? (slotOk(c) ? "✓" : "≠ dossier") : ""}</span>
                </button>
              ))}
            </div>
            {tagsAttendus.length > 0 && !tagOk && (
              <label className="flex items-start gap-2 text-sm text-ink/70">
                <input type="checkbox" className="mt-0.5" checked={verifManuelle} onChange={(e) => setVerifManuelle(e.target.checked)} />
                <span>J&apos;ai vérifié les tags visuellement <span className="font-mono" data-no-i18n>({tagsAttendus.join(", ")})</span></span>
              </label>
            )}
            <div className="pt-2 text-sm font-semibold">2. Photo des valises</div>
          </div>
        )}
        {photoRequise && (
          <PhotoUpload app="go" dossier={dossier.id} onUploaded={setPhoto}
            label={action === "livre" ? "📷 Photo client + valise (obligatoire)" : nbValises > 1 ? "📷 Photo des valises (obligatoire)" : "📷 Photo valise (obligatoire)"} />
        )}
        {action === "signalement" && <PhotoUpload app="go" dossier={dossier.id} onUploaded={setPhoto} label="📷 Photo (optionnelle)" />}
        {(commentRequis || action === "livre") && (
          <Textarea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder={action === "non_trouve" ? "Que s'est-il passé ? (injoignable, absent, adresse introuvable…)" : action === "signalement" ? "Décrivez le problème (bagage abîmé, client refuse…)" : "Commentaire (optionnel)"} />
        )}
        <Alert>{err}</Alert>
        <Button size="lg" className="w-full" disabled={!pret} loading={loading} onClick={valider}
          variant={action === "non_trouve" ? "danger" : action === "livre" ? "success" : "primary"}>
          Valider — {STATUTS[action].label}
        </Button>
      </div>
    </Modal>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }
