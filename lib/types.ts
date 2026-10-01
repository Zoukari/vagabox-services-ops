import { Statut } from "./constants";

export interface Compagnie { id: string; nom: string; code: string | null; contact_nom: string | null; contact_email: string | null; contact_telephone: string | null; created_at: string }
export interface Livreur { id: string; nom: string; telephone: string | null; auth_user_id: string | null; actif: boolean; created_at: string }
export interface Client { id: string; nom: string; prenom: string | null; telephone: string; quartier: string | null; adresse_detail: string | null; created_at: string }
export interface Tarif { id: string; compagnie_id: string; type: "par_dossier" | "forfait_mensuel"; prix_fdj: number; actif: boolean; date_debut: string }
export interface Compta { id: string; date: string; total_dossiers: number; total_fdj: number; notes: string | null; photo_facture_url: string | null; created_at: string }

export interface DossierVue {
  id: string; numero_dossier: string; tag_iata: string | null;
  compagnie_id: string; client_id: string; livreur_id: string | null;
  prix_fdj: number | null; statut: Statut; quartier: string | null; notes: string | null;
  en_livraison_depuis: string | null; date_livraison: string | null;
  created_at: string; updated_at: string; en_retard: boolean;
  client_nom: string; client_prenom: string | null; client_telephone: string; client_adresse: string | null;
  compagnie_nom: string; compagnie_code: string | null; livreur_nom: string | null;
}

export interface Historique { id: string; dossier_id: string; statut: Statut; livreur_id: string | null; commentaire: string | null; photo_url: string | null; timestamp: string }
