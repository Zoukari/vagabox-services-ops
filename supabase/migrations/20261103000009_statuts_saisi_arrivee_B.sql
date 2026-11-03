alter table public.dossiers alter column statut set default 'saisi';

create or replace function public.meme_equipe(p_user uuid)
returns boolean language sql stable security definer set search_path to '' as $$
  select p_user = auth.uid() or exists (
    select 1 from public.profiles p
     where p.id = p_user and p.compagnie_id is not null
       and p.compagnie_id = public.ma_compagnie() and public.est_saisie())
$$;
revoke all on function public.meme_equipe(uuid) from public, anon;
grant execute on function public.meme_equipe(uuid) to authenticated;

drop policy if exists dossiers_saisie on public.dossiers;
create policy dossiers_saisie on public.dossiers for select using (public.meme_equipe(declare_par));

drop policy if exists clients_saisie on public.clients;
create policy clients_saisie on public.clients for select using (
  exists (select 1 from public.dossiers d where d.client_id = clients.id and public.meme_equipe(d.declare_par)));

drop policy if exists hist_saisie on public.historique_statuts;
create policy hist_saisie on public.historique_statuts for select using (
  exists (select 1 from public.dossiers d where d.id = historique_statuts.dossier_id and public.meme_equipe(d.declare_par)));

drop policy if exists photos_saisie on public.photos;
create policy photos_saisie on public.photos for select using (
  exists (select 1 from public.dossiers d where d.id = photos.dossier_id and public.meme_equipe(d.declare_par)));

drop policy if exists livreurs_saisie on public.livreurs;
create policy livreurs_saisie on public.livreurs for select using (
  exists (select 1 from public.dossiers d where d.livreur_id = livreurs.id and public.meme_equipe(d.declare_par)));

drop policy if exists storage_lecture_saisie on storage.objects;
create policy storage_lecture_saisie on storage.objects for select using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = 'dossiers'
  and exists (select 1 from public.dossiers d where d.id::text = (storage.foldername(objects.name))[2] and public.meme_equipe(d.declare_par)));

create or replace function public.confirmer_arrivee(p_dossier uuid, p_commentaire text default null)
returns public.dossiers language plpgsql security definer set search_path to '' as $$
declare
  d public.dossiers;
begin
  select * into d from public.dossiers where id = p_dossier for update;
  if not found then raise exception 'Dossier introuvable'; end if;
  if not (public.est_admin() or (public.est_saisie() and public.meme_equipe(d.declare_par))) then
    raise exception 'Non autorisé à confirmer ce dossier';
  end if;
  if d.statut <> 'saisi' then
    raise exception 'Arrivée déjà confirmée (statut actuel : %)', d.statut;
  end if;

  insert into public.historique_statuts (dossier_id, statut, livreur_id, auteur_id, commentaire, "timestamp")
  values (p_dossier, 'valise_arrivee', d.livreur_id, auth.uid(),
          coalesce(nullif(trim(p_commentaire), ''), 'Valise arrivée à l''aéroport'), clock_timestamp());

  update public.dossiers set statut = 'a_recuperer' where id = p_dossier returning * into d;

  insert into public.historique_statuts (dossier_id, statut, livreur_id, auteur_id, commentaire, "timestamp")
  values (p_dossier, 'a_recuperer', d.livreur_id, auth.uid(), 'Prêt à être récupéré par le livreur', clock_timestamp() + interval '1 millisecond');

  return d;
end $$;
revoke all on function public.confirmer_arrivee(uuid, text) from public, anon;
grant execute on function public.confirmer_arrivee(uuid, text) to authenticated;
