create or replace function public.changer_statut(p_dossier uuid, p_statut public.statut_dossier, p_commentaire text default null, p_photo_url text default null)
returns public.dossiers language plpgsql security definer set search_path to '' as $$
declare
  v_role public.role_utilisateur := public.mon_role();
  v_livreur uuid := public.mon_livreur();
  d public.dossiers;
  ok boolean := false;
begin
  select * into d from public.dossiers where id = p_dossier for update;
  if not found then raise exception 'Dossier introuvable'; end if;

  if v_role = 'admin' then
    ok := true;
  elsif v_role = 'livreur' then
    if d.livreur_id is distinct from v_livreur then
      raise exception 'Dossier non assigné à ce livreur';
    end if;
    ok := case
      when p_statut = 'recupere'     then d.statut in ('a_recuperer')
      when p_statut = 'en_livraison' then d.statut in ('recupere', 'replanifie')
      when p_statut = 'livre'        then d.statut = 'en_livraison'
      when p_statut = 'non_trouve'   then d.statut = 'en_livraison'
      when p_statut = 'replanifie'   then d.statut in ('en_livraison', 'non_trouve')
      when p_statut = 'signalement'  then d.statut not in ('livre')
      else false end;
    if not ok then
      raise exception 'Transition non autorisée : % → %', d.statut, p_statut;
    end if;
    if p_statut in ('recupere', 'livre') and p_photo_url is null then
      raise exception 'Photo obligatoire pour ce statut';
    end if;
    if p_statut in ('non_trouve', 'signalement', 'replanifie') and coalesce(trim(p_commentaire), '') = '' then
      raise exception 'Commentaire obligatoire pour ce statut';
    end if;
  end if;

  if not ok then
    raise exception 'Transition non autorisée : % → %', d.statut, p_statut;
  end if;

  update public.dossiers set
    statut = p_statut,
    en_livraison_depuis = case when p_statut = 'en_livraison' then now()
                               when p_statut in ('a_recuperer','recupere','replanifie') then null
                               else en_livraison_depuis end,
    date_livraison = case when p_statut = 'livre' then now() else date_livraison end
  where id = p_dossier returning * into d;

  insert into public.historique_statuts (dossier_id, statut, livreur_id, auteur_id, commentaire, photo_url)
  values (p_dossier, p_statut, coalesce(v_livreur, d.livreur_id), auth.uid(), p_commentaire, p_photo_url);

  if p_photo_url is not null then
    insert into public.photos (dossier_id, statut_evenement, url, uploaded_by)
    values (p_dossier, p_statut::text, p_photo_url, auth.uid());
  end if;

  return d;
end $$;
