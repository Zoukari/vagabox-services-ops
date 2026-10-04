# Vagabox Services — Plateforme Opérations

Livraison à domicile des bagages récupérés en compagnie aérienne — Djibouti.

| Interface | URL | Utilisateurs | Accès |
|---|---|---|---|
| **VS Control** | `/control` | Admin Vagabox | Email + mot de passe |
| **VS Go** | `/go` | Livreurs (mobile) | PIN 6 chiffres |
| **VS Track** | `/track` | Agents compagnies / aéroport | Email + mot de passe (créé par l'admin). Type **Lecture** (suivi) ou **Saisie** (ex. Air Djibouti : déclare les bagages, toutes compagnies) |

## Stack
Next.js 14 (App Router) · Supabase (Postgres, Auth, Storage, Edge Functions) · `@zxing/browser` (scan IATA) · Tailwind · Vercel

## Supabase
Projet `vagabox-services-ops` (`ntpxobakaprkmfiiiokr`, eu-central-1) — déjà provisionné.

- `supabase/migrations/` — schéma, RLS, durcissement (déjà appliqués)
- **`20261004000005_declaration_bagages.sql` — À EXÉCUTER dans le SQL Editor** : comptes VS Track « saisie », formulaire de déclaration, RPC `declarer_bagage` / `definir_type_track`
- `20261001000004_forfait_compta.sql` — appliqué.  dans le SQL Editor** : mode forfait (`zero` / `reparti`), colonnes système + source dans `comptabilite`, une saisie par jour
- `supabase/functions/livreur-auth` — PIN → session (4h côté app, anti brute-force 8 essais / 15 min / IP)
- `supabase/functions/admin-users` — création admin / livreurs / comptes compagnie, reset PIN & mot de passe

### Rôles (RLS)
- **admin** : accès total
- **livreur** : lecture de *ses* dossiers ; changements de statut uniquement via `changer_statut()` (transitions contrôlées, photo obligatoire pour récupéré/livré, commentaire pour non trouvé/signalement). Le hash PIN n'est jamais lisible.
- **compagnie** : lecture seule des dossiers de sa compagnie

### Statuts
`a_recuperer` → `recupere` → `en_livraison` → `livre` | `non_trouve` → (admin) `replanifie` → `en_livraison`…
`signalement` possible à tout moment. **Retard** = `en_livraison` depuis > 1h (calculé dans la vue `dossiers_vue`, alerte sur le dashboard).

## Démarrage
```bash
cp .env.example .env.local
npm install
npm run dev
```
Premier lancement : ouvrir `/control/setup` (lien « Première utilisation ? Créer le compte administrateur » sous le formulaire de `/control/login`). Fonctionne une seule fois : refusé côté serveur dès qu'un admin existe.

## Thème & langues
- Thème clair/sombre (bouton rond bas-droite, mémorisé par navigateur).
- FR / EN / AR (bouton au-dessus). Traduction par dictionnaire `lib/i18n-dict.ts` appliquée au texte affiché (`lib/i18n.tsx`) ; arabe en RTL. Pour un nouveau texte : ajouter l'entrée FR → [EN, AR]. `data-no-i18n` exclut un élément.

## Déploiement Vercel
Importer le repo, ajouter les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (voir `.env.example`). Aucune clé secrète côté Vercel : tout ce qui est privilégié passe par les Edge Functions.

## Note sur la structure
Le plan prévoyait des route groups `(admin)/(livreur)/(compagnie)` ; ils ont été remplacés par de vrais segments `/control`, `/go`, `/track` car des groupes partageant `dossiers/` entreraient en collision d'URL. Chaque interface a sa propre session (clés de stockage séparées).
