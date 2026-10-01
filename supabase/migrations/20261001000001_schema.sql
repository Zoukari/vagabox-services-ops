-- Vagabox Services Ops — schéma principal
create extension if not exists pgcrypto with schema extensions;

-- ───────────── Types ─────────────
create type public.statut_dossier as enum (
  'a_recuperer', 'recupere', 'en_livraison', 'livre', 'non_trouve', 'replanifie', 'signalement'
);
create type public.role_utilisateur as enum ('admin', 'livreur', 'compagnie');
create type public.type_tarif as enum ('par_dossier', 'forfait_mensuel');

-- ───────────── Tables ─────────────
create table public.compagnies (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  code text,
  contact_nom text,
  contact_email text,
  contact_telephone text,
  created_at timestamptz not null default now()
);

create table public.livreurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  pin text not null,                     -- hash bcrypt (pgcrypto crypt/bf)
  auth_user_id uuid unique references auth.users(id) on delete set null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.role_utilisateur not null,
  nom text,
  compagnie_id uuid references public.compagnies(id) on delete cascade,
  livreur_id uuid references public.livreurs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_role_coherent check (
    (role = 'admin') or
    (role = 'compagnie' and compagnie_id is not null) or
    (role = 'livreur' and livreur_id is not null)
  )
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  telephone text not null,
  quartier text,
  adresse_detail text,
  created_at timestamptz not null default now()
);

create sequence public.dossier_seq;

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  numero_dossier text unique not null,
  tag_iata text,
  compagnie_id uuid not null references public.compagnies(id),
  client_id uuid not null references public.clients(id),
  livreur_id uuid references public.livreurs(id) on delete set null,
  prix_fdj integer,
  statut public.statut_dossier not null default 'a_recuperer',
  quartier text,
  notes text,
  en_livraison_depuis timestamptz,       -- démarrage timer 1h
  date_livraison timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.dossiers (statut);
create index on public.dossiers (compagnie_id);
create index on public.dossiers (livreur_id);
create index on public.dossiers (tag_iata);
create index on public.dossiers (created_at desc);

create table public.historique_statuts (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  statut public.statut_dossier not null,
  livreur_id uuid references public.livreurs(id) on delete set null,
  auteur_id uuid references auth.users(id) on delete set null,
  commentaire text,
  photo_url text,
  "timestamp" timestamptz not null default now()
);
create index on public.historique_statuts (dossier_id, "timestamp");

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  statut_evenement text,
  url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.photos (dossier_id);

create table public.tarification (
  id uuid primary key default gen_random_uuid(),
  compagnie_id uuid not null references public.compagnies(id) on delete cascade,
  type public.type_tarif not null,
  prix_fdj integer not null,
  actif boolean not null default true,
  date_debut date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.comptabilite (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  total_dossiers integer not null default 0,
  total_fdj integer not null default 0,
  notes text,
  photo_facture_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Anti brute-force PIN
create table public.pin_tentatives (
  id bigint generated always as identity primary key,
  ip text not null,
  succes boolean not null,
  created_at timestamptz not null default now()
);
create index on public.pin_tentatives (ip, created_at);

-- ───────────── Helpers rôle (security definer) ─────────────
create or replace function public.mon_role() returns public.role_utilisateur
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.ma_compagnie() returns uuid
language sql stable security definer set search_path = '' as $$
  select compagnie_id from public.profiles where id = auth.uid()
$$;
create or replace function public.mon_livreur() returns uuid
language sql stable security definer set search_path = '' as $$
  select livreur_id from public.profiles where id = auth.uid()
$$;
create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ───────────── Triggers dossiers ─────────────
create or replace function public.dossier_avant_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.numero_dossier is null or new.numero_dossier = '' then
    new.numero_dossier := 'VS-' || to_char(now() at time zone 'Africa/Djibouti', 'YYMMDD')
      || '-' || lpad(nextval('public.dossier_seq')::text, 4, '0');
  end if;
  if new.prix_fdj is null then
    select t.prix_fdj into new.prix_fdj from public.tarification t
     where t.compagnie_id = new.compagnie_id and t.actif and t.type = 'par_dossier'
     order by t.date_debut desc limit 1;
  end if;
  if new.quartier is null then
    select c.quartier into new.quartier from public.clients c where c.id = new.client_id;
  end if;
  return new;
end $$;
create trigger trg_dossier_avant_insert before insert on public.dossiers
  for each row execute function public.dossier_avant_insert();

create or replace function public.dossier_apres_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.historique_statuts (dossier_id, statut, livreur_id, auteur_id, commentaire)
  values (new.id, new.statut, new.livreur_id, auth.uid(), 'Dossier créé');
  return new;
end $$;
create trigger trg_dossier_apres_insert after insert on public.dossiers
  for each row execute function public.dossier_apres_insert();

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_dossier_updated before update on public.dossiers
  for each row execute function public.touch_updated_at();

-- ───────────── Vue avec retard calculé (timer 1h) ─────────────
create view public.dossiers_vue with (security_invoker = true) as
select d.*,
  (d.statut = 'en_livraison' and d.en_livraison_depuis < now() - interval '1 hour') as en_retard,
  c.nom as client_nom, c.prenom as client_prenom, c.telephone as client_telephone,
  c.adresse_detail as client_adresse,
  co.nom as compagnie_nom, co.code as compagnie_code,
  l.nom as livreur_nom
from public.dossiers d
join public.clients c on c.id = d.client_id
join public.compagnies co on co.id = d.compagnie_id
left join public.livreurs l on l.id = d.livreur_id;

-- ───────────── Changement de statut (seule voie pour livreurs) ─────────────
create or replace function public.changer_statut(
  p_dossier uuid, p_statut public.statut_dossier,
  p_commentaire text default null, p_photo_url text default null
) returns public.dossiers
language plpgsql security definer set search_path = '' as $$
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
      when p_statut = 'signalement'  then d.statut not in ('livre')
      else false end;
    if not ok then
      raise exception 'Transition non autorisée : % → %', d.statut, p_statut;
    end if;
    if p_statut in ('recupere', 'livre') and p_photo_url is null then
      raise exception 'Photo obligatoire pour ce statut';
    end if;
    if p_statut in ('non_trouve', 'signalement') and coalesce(trim(p_commentaire), '') = '' then
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
revoke all on function public.changer_statut from public, anon;
grant execute on function public.changer_statut to authenticated;

-- ───────────── PIN livreurs ─────────────
-- Vérifie un PIN (service_role uniquement — appelé par l'Edge Function)
create or replace function public.verifier_pin(p_pin text) returns uuid
language sql stable security definer set search_path = '' as $$
  select l.id from public.livreurs l
  where l.actif and l.pin = extensions.crypt(p_pin, l.pin) limit 1
$$;
revoke all on function public.verifier_pin from public, anon, authenticated;
grant execute on function public.verifier_pin to service_role;

-- PIN déjà utilisé ? (unicité nécessaire car login par PIN seul)
create or replace function public.pin_utilise(p_pin text, p_exclure uuid default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.livreurs l
    where l.pin = extensions.crypt(p_pin, l.pin) and l.id is distinct from p_exclure)
$$;
revoke all on function public.pin_utilise from public, anon, authenticated;
grant execute on function public.pin_utilise to service_role;

create or replace function public.hasher_pin(p_pin text) returns text
language sql volatile security definer set search_path = '' as $$
  select extensions.crypt(p_pin, extensions.gen_salt('bf', 8))
$$;
revoke all on function public.hasher_pin from public, anon, authenticated;
grant execute on function public.hasher_pin to service_role;
