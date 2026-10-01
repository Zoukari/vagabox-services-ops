export type Statut =
  | "a_recuperer" | "recupere" | "en_livraison" | "livre" | "non_trouve" | "replanifie" | "signalement";

export const STATUTS: Record<Statut, { label: string; couleur: string; bg: string; text: string; dot: string }> = {
  a_recuperer:  { label: "À récupérer",  couleur: "#EAB308", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-400" },
  recupere:     { label: "Récupéré",     couleur: "#3B82F6", bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  en_livraison: { label: "En livraison", couleur: "#F97316", bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  livre:        { label: "Livré",        couleur: "#22C55E", bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
  non_trouve:   { label: "Non trouvé",   couleur: "#EF4444", bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500" },
  replanifie:   { label: "Replanifié",   couleur: "#A855F7", bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  signalement:  { label: "Signalement",  couleur: "#6B7280", bg: "bg-gray-200",   text: "text-gray-800",   dot: "bg-gray-500" },
};
export const STATUTS_ORDRE = Object.keys(STATUTS) as Statut[];
export const STATUTS_ACTIFS: Statut[] = ["a_recuperer", "recupere", "en_livraison", "replanifie", "signalement"];

export const TIMER_LIVRAISON_MS = 60 * 60 * 1000;

export const QUARTIERS: Record<string, string[]> = {
  "Centre / Ras-Dika": [
    "Héron", "Héron Extension", "Plateau", "Plateau du Serpent", "Marabout", "République", "Salines Ouest", "Riyad",
  ],
  Boulaos: [
    "Quartier 1", "Quartier 2", "Quartier 3", "Quartier 4", "Quartier 5", "Quartier 6", "Quartier 7", "Quartier 7 bis",
    "Stade", "Arhiba", "Ambouli", "Djebel", "Gabode 1", "Gabode 2 / Gabode Coopérant", "Gachamaleh", "Guelleh Batal",
    "Aviation", "Haramous", "Haramous Sud",
  ],
  Balbala: [
    "Balbala 4", "Balbala 5", "PK12", "PK20", "Hayabley / Hablayeh", "Doraleh", "Cité Cheikh Osman", "Cheikh Moussa",
    "Cité Luxembourg", "Cité Sharaf", "Jab-Jab", "Barwaqo 1", "Barwaqo 2", "Dogley", "440 logements", "540 logements",
    "840 appartements", "Secteur Université / FSD2",
  ],
};

export const MESSAGES_WHATSAPP: Partial<Record<Statut, string>> = {
  recupere:
    "Bonjour {nom_client}, votre colis référence {numero_dossier} a été récupéré. Vagabox Services vous contactera pour la livraison.",
  en_livraison:
    "Bonjour {nom_client}, votre colis {numero_dossier} est en route ! Notre livreur {livreur} arrive dans environ 1 heure.",
  livre:
    "Bonjour {nom_client}, votre colis {numero_dossier} a bien été livré. Merci de faire confiance à Vagabox Services !",
  non_trouve:
    "Bonjour {nom_client}, notre livreur n'a pas pu vous joindre pour livrer votre colis {numero_dossier}. Nous allons replanifier.",
  replanifie:
    "Bonjour {nom_client}, une nouvelle tentative de livraison de votre colis {numero_dossier} est programmée. Nous vous recontactons très vite.",
};

export const FN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
