import { MESSAGES_WHATSAPP, Statut } from "./constants";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const fdj = (n?: number | null) =>
  n == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(n)} FDJ`;

const TZ = "Africa/Djibouti";
export const dateHeure = (s?: string | null) =>
  s ? new Date(s).toLocaleString("fr-FR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
export const dateCourte = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("fr-FR", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Date du jour à Djibouti au format YYYY-MM-DD */
export const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
/** Début du jour (Djibouti, UTC+3) en ISO */
export const debutJourISO = (d = aujourdhui()) => new Date(`${d}T00:00:00+03:00`).toISOString();

export const nomComplet = (nom?: string | null, prenom?: string | null) => [prenom, nom].filter(Boolean).join(" ");

/** Numéro Djibouti → format wa.me (253XXXXXXXX) */
export function telWa(tel?: string | null): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 8) d = "253" + d;
  return d.length >= 10 ? d : null;
}

export function messageWhatsApp(statut: Statut, v: { nom_client: string; numero_dossier: string; livreur?: string | null }) {
  const tpl = MESSAGES_WHATSAPP[statut];
  if (!tpl) return null;
  return tpl
    .replaceAll("{nom_client}", v.nom_client)
    .replaceAll("{numero_dossier}", v.numero_dossier)
    .replaceAll("{livreur}", v.livreur || "Vagabox");
}

export function dureeRestante(depuis: string | null | undefined, totalMs: number) {
  if (!depuis) return null;
  const reste = new Date(depuis).getTime() + totalMs - Date.now();
  const abs = Math.abs(reste);
  const m = Math.floor(abs / 60000), s = Math.floor((abs % 60000) / 1000);
  return { retard: reste < 0, texte: `${reste < 0 ? "+" : ""}${m}:${String(s).padStart(2, "0")}` };
}

/** Compression d'image côté client (JPEG, 1600px max) avant upload */
export async function compresserImage(file: File, max = 1600, qualite = 0.8): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", qualite));
  } catch {
    return file;
  }
}

export function moisLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
