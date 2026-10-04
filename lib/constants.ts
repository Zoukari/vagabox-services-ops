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

export const TYPES_INCIDENT: Record<"retarde" | "endommage" | "perdu" | "autre", string> = {
  retarde: "Bagage retardé (non arrivé avec le passager)",
  endommage: "Bagage endommagé",
  perdu: "Bagage perdu / introuvable",
  autre: "Autre",
};

/** Indicatifs téléphoniques — Djibouti et pays proches en tête, puis diaspora / A-Z */
export const PAYS: { code: string; nom: string; indicatif: string; drapeau: string }[] = [
  { code: "DJ", nom: "Djibouti", indicatif: "253", drapeau: "🇩🇯" },
  { code: "ET", nom: "Éthiopie", indicatif: "251", drapeau: "🇪🇹" },
  { code: "SO", nom: "Somalie", indicatif: "252", drapeau: "🇸🇴" },
  { code: "ER", nom: "Érythrée", indicatif: "291", drapeau: "🇪🇷" },
  { code: "YE", nom: "Yémen", indicatif: "967", drapeau: "🇾🇪" },
  { code: "FR", nom: "France", indicatif: "33", drapeau: "🇫🇷" },
  { code: "SA", nom: "Arabie saoudite", indicatif: "966", drapeau: "🇸🇦" },
  { code: "AE", nom: "Émirats arabes unis", indicatif: "971", drapeau: "🇦🇪" },
  { code: "TR", nom: "Turquie", indicatif: "90", drapeau: "🇹🇷" },
  { code: "KE", nom: "Kenya", indicatif: "254", drapeau: "🇰🇪" },
  { code: "ZA", nom: "Afrique du Sud", indicatif: "27", drapeau: "🇿🇦" },
  { code: "DZ", nom: "Algérie", indicatif: "213", drapeau: "🇩🇿" },
  { code: "DE", nom: "Allemagne", indicatif: "49", drapeau: "🇩🇪" },
  { code: "BE", nom: "Belgique", indicatif: "32", drapeau: "🇧🇪" },
  { code: "BH", nom: "Bahreïn", indicatif: "973", drapeau: "🇧🇭" },
  { code: "BJ", nom: "Bénin", indicatif: "229", drapeau: "🇧🇯" },
  { code: "BF", nom: "Burkina Faso", indicatif: "226", drapeau: "🇧🇫" },
  { code: "BI", nom: "Burundi", indicatif: "257", drapeau: "🇧🇮" },
  { code: "CM", nom: "Cameroun", indicatif: "237", drapeau: "🇨🇲" },
  { code: "CA", nom: "Canada", indicatif: "1", drapeau: "🇨🇦" },
  { code: "CN", nom: "Chine", indicatif: "86", drapeau: "🇨🇳" },
  { code: "KM", nom: "Comores", indicatif: "269", drapeau: "🇰🇲" },
  { code: "CG", nom: "Congo", indicatif: "242", drapeau: "🇨🇬" },
  { code: "CD", nom: "Congo (RDC)", indicatif: "243", drapeau: "🇨🇩" },
  { code: "CI", nom: "Côte d'Ivoire", indicatif: "225", drapeau: "🇨🇮" },
  { code: "EG", nom: "Égypte", indicatif: "20", drapeau: "🇪🇬" },
  { code: "ES", nom: "Espagne", indicatif: "34", drapeau: "🇪🇸" },
  { code: "US", nom: "États-Unis", indicatif: "1", drapeau: "🇺🇸" },
  { code: "GA", nom: "Gabon", indicatif: "241", drapeau: "🇬🇦" },
  { code: "GN", nom: "Guinée", indicatif: "224", drapeau: "🇬🇳" },
  { code: "IN", nom: "Inde", indicatif: "91", drapeau: "🇮🇳" },
  { code: "IT", nom: "Italie", indicatif: "39", drapeau: "🇮🇹" },
  { code: "JP", nom: "Japon", indicatif: "81", drapeau: "🇯🇵" },
  { code: "JO", nom: "Jordanie", indicatif: "962", drapeau: "🇯🇴" },
  { code: "KW", nom: "Koweït", indicatif: "965", drapeau: "🇰🇼" },
  { code: "LB", nom: "Liban", indicatif: "961", drapeau: "🇱🇧" },
  { code: "LU", nom: "Luxembourg", indicatif: "352", drapeau: "🇱🇺" },
  { code: "MG", nom: "Madagascar", indicatif: "261", drapeau: "🇲🇬" },
  { code: "ML", nom: "Mali", indicatif: "223", drapeau: "🇲🇱" },
  { code: "MA", nom: "Maroc", indicatif: "212", drapeau: "🇲🇦" },
  { code: "MU", nom: "Maurice", indicatif: "230", drapeau: "🇲🇺" },
  { code: "MR", nom: "Mauritanie", indicatif: "222", drapeau: "🇲🇷" },
  { code: "NE", nom: "Niger", indicatif: "227", drapeau: "🇳🇪" },
  { code: "NG", nom: "Nigeria", indicatif: "234", drapeau: "🇳🇬" },
  { code: "NO", nom: "Norvège", indicatif: "47", drapeau: "🇳🇴" },
  { code: "OM", nom: "Oman", indicatif: "968", drapeau: "🇴🇲" },
  { code: "UG", nom: "Ouganda", indicatif: "256", drapeau: "🇺🇬" },
  { code: "PK", nom: "Pakistan", indicatif: "92", drapeau: "🇵🇰" },
  { code: "NL", nom: "Pays-Bas", indicatif: "31", drapeau: "🇳🇱" },
  { code: "QA", nom: "Qatar", indicatif: "974", drapeau: "🇶🇦" },
  { code: "GB", nom: "Royaume-Uni", indicatif: "44", drapeau: "🇬🇧" },
  { code: "RU", nom: "Russie", indicatif: "7", drapeau: "🇷🇺" },
  { code: "RW", nom: "Rwanda", indicatif: "250", drapeau: "🇷🇼" },
  { code: "SN", nom: "Sénégal", indicatif: "221", drapeau: "🇸🇳" },
  { code: "SD", nom: "Soudan", indicatif: "249", drapeau: "🇸🇩" },
  { code: "SS", nom: "Soudan du Sud", indicatif: "211", drapeau: "🇸🇸" },
  { code: "SE", nom: "Suède", indicatif: "46", drapeau: "🇸🇪" },
  { code: "CH", nom: "Suisse", indicatif: "41", drapeau: "🇨🇭" },
  { code: "TZ", nom: "Tanzanie", indicatif: "255", drapeau: "🇹🇿" },
  { code: "TD", nom: "Tchad", indicatif: "235", drapeau: "🇹🇩" },
  { code: "TG", nom: "Togo", indicatif: "228", drapeau: "🇹🇬" },
  { code: "TN", nom: "Tunisie", indicatif: "216", drapeau: "🇹🇳" },
];
