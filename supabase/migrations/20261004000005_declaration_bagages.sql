alter table public.profiles
  add column if not exists type_track text not null default 'lecture'
  check (type_track in ('lecture', 'saisie'));

alter table public.clients
  add column if not exists email text;

alter table public.dossiers
  add column if not exists nb_valises integer not null default 1 check (nb_valises between 1 and 20),
  add column if not exists tags_iata text[] not null default '{}',
  add column if not exists numero_pir text,
  add column if not exists numero_vol text,
  add column if not exists date_vol date,
  add column if not exists provenance text,
  add column if not exists type_incident text check (type_incident in ('retarde', 'endommage', 'perdu', 'autre')),
  add column if not exists description_bagages text,
  add column if not exists contenu text,
  add column if not exists declare_par uuid references auth.users(id),
  add column if not exists declare_le timestamptz;

create index if not exists dossiers_declare_par_idx on public.dossiers (declare_par);
create index if not exists dossiers_tags_iata_idx on public.dossiers using gin (tags_iata);

create or replace function public.est_saisie()
returns boolean language sql stable security definer set search_path to '' as $$
  select coalesce((select role = 'compagnie' and type_track = 'saisie' from public.profiles where id = auth.uid()), false)
$$;
revoke all on function public.est_saisie() from public, anon;
grant execute on function public.est_saisie() to authenticated;

drop policy if exists compagnies_saisie on public.compagnies;
create policy compagnies_saisie on public.compagnies for select using (public.est_saisie());

drop policy if exists dossiers_saisie on public.dossiers;
create policy dossiers_saisie on public.dossiers for select using (declare_par = auth.uid());

drop policy if exists clients_saisie on public.clients;
create policy clients_saisie on public.clients for select using (
  exists (select 1 from public.dossiers d where d.client_id = clients.id and d.declare_par = auth.uid()));

drop policy if exists hist_saisie on public.historique_statuts;
create policy hist_saisie on public.historique_statuts for select using (
  exists (select 1 from public.dossiers d where d.id = historique_statuts.dossier_id and d.declare_par = auth.uid()));

drop policy if exists photos_saisie on public.photos;
create policy photos_saisie on public.photos for select using (
  exists (select 1 from public.dossiers d where d.id = photos.dossier_id and d.declare_par = auth.uid()));

drop policy if exists livreurs_saisie on public.livreurs;
create policy livreurs_saisie on public.livreurs for select using (
  exists (select 1 from public.dossiers d where d.livreur_id = livreurs.id and d.declare_par = auth.uid()));

drop policy if exists storage_lecture_saisie on storage.objects;
create policy storage_lecture_saisie on storage.objects for select using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = 'dossiers'
  and exists (select 1 from public.dossiers d where d.id::text = (storage.foldername(objects.name))[2] and d.declare_par = auth.uid()));

drop view if exists public.dossiers_vue;
create view public.dossiers_vue with (security_invoker = true) as
select d.*,
  (d.statut = 'en_livraison' and d.en_livraison_depuis < now() - interval '1 hour') as en_retard,
  c.nom as client_nom, c.prenom as client_prenom, c.telephone as client_telephone,
  c.adresse_detail as client_adresse, c.email as client_email,
  co.nom as compagnie_nom, co.code as compagnie_code,
  l.nom as livreur_nom
from public.dossiers d
join public.clients c on c.id = d.client_id
join public.compagnies co on co.id = d.compagnie_id
left join public.livreurs l on l.id = d.livreur_id;
grant select on public.dossiers_vue to authenticated;

create or replace function public.definir_type_track(p_user uuid, p_type text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l''admin'; end if;
  if p_type not in ('lecture', 'saisie') then raise exception 'Type de compte invalide'; end if;
  update public.profiles set type_track = p_type where id = p_user and role = 'compagnie';
end $$;
revoke all on function public.definir_type_track(uuid, text) from public, anon;
grant execute on function public.definir_type_track(uuid, text) to authenticated;

create or replace function public.declarer_bagage(p jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_client uuid;
  v_tel text := regexp_replace(coalesce(p->>'telephone', ''), '[^0-9+]', '', 'g');
  v_tags text[] := coalesce(array(select trim(x) from jsonb_array_elements_text(coalesce(p->'tags_iata', '[]'::jsonb)) x where trim(x) <> ''), '{}');
  d public.dossiers;
begin
  if not (public.est_saisie() or public.est_admin()) then
    raise exception 'Compte non autorisé à déclarer des bagages';
  end if;
  if coalesce(trim(p->>'nom'), '') = '' then raise exception 'Nom du passager obligatoire'; end if;
  if length(v_tel) < 8 then raise exception 'Numéro de téléphone invalide'; end if;
  if (p->>'compagnie_id') is null then raise exception 'Compagnie obligatoire'; end if;

  select id into v_client from public.clients where telephone = v_tel limit 1;
  if v_client is null then
    insert into public.clients (nom, prenom, telephone, email, quartier, adresse_detail)
    values (trim(p->>'nom'), nullif(trim(p->>'prenom'), ''), v_tel, nullif(trim(p->>'email'), ''),
            nullif(p->>'quartier', ''), nullif(trim(p->>'adresse_detail'), ''))
    returning id into v_client;
  else
    update public.clients set
      nom = trim(p->>'nom'),
      prenom = coalesce(nullif(trim(p->>'prenom'), ''), prenom),
      email = coalesce(nullif(trim(p->>'email'), ''), email),
      quartier = coalesce(nullif(p->>'quartier', ''), quartier),
      adresse_detail = coalesce(nullif(trim(p->>'adresse_detail'), ''), adresse_detail)
    where id = v_client;
  end if;

  insert into public.dossiers (
    compagnie_id, client_id, tag_iata, tags_iata, nb_valises, numero_pir, numero_vol, date_vol,
    provenance, type_incident, description_bagages, contenu, notes, quartier, declare_par, declare_le)
  values (
    (p->>'compagnie_id')::uuid, v_client, v_tags[1], v_tags,
    greatest(1, coalesce((p->>'nb_valises')::int, 1)),
    nullif(trim(p->>'numero_pir'), ''), nullif(upper(trim(p->>'numero_vol')), ''),
    nullif(p->>'date_vol', '')::date, nullif(upper(trim(p->>'provenance')), ''),
    nullif(p->>'type_incident', ''), nullif(trim(p->>'description_bagages'), ''),
    nullif(trim(p->>'contenu'), ''), nullif(trim(p->>'notes'), ''),
    nullif(p->>'quartier', ''), auth.uid(), now())
  returning * into d;

  return jsonb_build_object('id', d.id, 'numero_dossier', d.numero_dossier);
end $$;
revoke all on function public.declarer_bagage(jsonb) from public, anon;
grant execute on function public.declarer_bagage(jsonb) to authenticated;
