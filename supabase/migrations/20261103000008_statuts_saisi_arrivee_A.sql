alter type public.statut_dossier add value if not exists 'saisi' before 'a_recuperer';
alter type public.statut_dossier add value if not exists 'valise_arrivee' after 'saisi';
