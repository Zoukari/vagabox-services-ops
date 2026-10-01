-- RLS : admin = tout ; livreur = ses dossiers ; compagnie = ses dossiers en lecture
alter table public.compagnies enable row level security;
alter table public.livreurs enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.dossiers enable row level security;
alter table public.historique_statuts enable row level security;
alter table public.photos enable row level security;
alter table public.tarification enable row level security;
alter table public.comptabilite enable row level security;
alter table public.pin_tentatives enable row level security; -- aucune policy : service_role seul

-- Le hash du PIN n'est jamais lisible côté client
revoke all on public.livreurs from anon, authenticated;
grant select (id, nom, telephone, auth_user_id, actif, created_at) on public.livreurs to authenticated;
grant update (nom, telephone, actif) on public.livreurs to authenticated;
grant delete on public.livreurs to authenticated;

revoke all on public.pin_tentatives from anon, authenticated;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

-- profiles
create policy profiles_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.est_admin());

-- compagnies
create policy compagnies_admin on public.compagnies for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy compagnies_self on public.compagnies for select to authenticated
  using (id = public.ma_compagnie());

-- livreurs
create policy livreurs_admin on public.livreurs for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy livreurs_self on public.livreurs for select to authenticated
  using (id = public.mon_livreur());
create policy livreurs_compagnie on public.livreurs for select to authenticated
  using (public.mon_role() = 'compagnie' and exists (
    select 1 from public.dossiers d where d.livreur_id = livreurs.id and d.compagnie_id = public.ma_compagnie()));

-- clients
create policy clients_admin on public.clients for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy clients_livreur on public.clients for select to authenticated
  using (exists (select 1 from public.dossiers d where d.client_id = clients.id and d.livreur_id = public.mon_livreur()));
create policy clients_compagnie on public.clients for select to authenticated
  using (exists (select 1 from public.dossiers d where d.client_id = clients.id and d.compagnie_id = public.ma_compagnie()));

-- dossiers (livreurs : lecture seule, écriture via changer_statut())
create policy dossiers_admin on public.dossiers for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy dossiers_livreur on public.dossiers for select to authenticated
  using (livreur_id = public.mon_livreur());
create policy dossiers_compagnie on public.dossiers for select to authenticated
  using (compagnie_id = public.ma_compagnie());

-- historique
create policy hist_admin on public.historique_statuts for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy hist_lecture on public.historique_statuts for select to authenticated
  using (exists (select 1 from public.dossiers d where d.id = historique_statuts.dossier_id
    and (d.livreur_id = public.mon_livreur() or d.compagnie_id = public.ma_compagnie())));

-- photos
create policy photos_admin on public.photos for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy photos_lecture on public.photos for select to authenticated
  using (exists (select 1 from public.dossiers d where d.id = photos.dossier_id
    and (d.livreur_id = public.mon_livreur() or d.compagnie_id = public.ma_compagnie())));

-- tarification / comptabilité : admin seul
create policy tarif_admin on public.tarification for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy compta_admin on public.comptabilite for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- Chemins : dossiers/{dossier_id}/... ; factures/...
create policy storage_admin on storage.objects for all to authenticated
  using (bucket_id = 'photos' and public.est_admin())
  with check (bucket_id = 'photos' and public.est_admin());

create policy storage_livreur_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = 'dossiers'
    and exists (select 1 from public.dossiers d
      where d.id::text = (storage.foldername(name))[2] and d.livreur_id = public.mon_livreur()));

create policy storage_lecture_dossier on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = 'dossiers'
    and exists (select 1 from public.dossiers d
      where d.id::text = (storage.foldername(name))[2]
      and (d.livreur_id = public.mon_livreur() or d.compagnie_id = public.ma_compagnie())));
