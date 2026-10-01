-- Vagabox Services — forfait 2 modes + comptabilité auto/manuelle
-- À exécuter dans Supabase > SQL Editor (projet vagabox-services-ops)

-- 1) Forfait mensuel : mode de répartition par dossier
--    'zero'    → chaque dossier = 0 FDJ, le forfait est compté une fois au niveau compagnie
--    'reparti' → forfait ÷ nb de dossiers livrés du mois (attribué aux dossiers / livreurs dans les rapports)
alter table public.tarification
  add column if not exists repartition text not null default 'zero'
  check (repartition in ('zero', 'reparti'));

-- 2) Comptabilité : chiffres système (calcul auto) stockés à côté de la saisie manuelle
alter table public.comptabilite
  add column if not exists total_dossiers_systeme integer,
  add column if not exists total_fdj_systeme integer,
  add column if not exists source text not null default 'manuel'
  check (source in ('auto', 'manuel'));

-- une seule saisie par jour
create unique index if not exists comptabilite_date_unique on public.comptabilite (date);

-- 3) Dossier d'une compagnie au forfait : prix = 0 si aucun tarif par dossier actif
create or replace function public.dossier_avant_insert()
returns trigger language plpgsql security definer set search_path to '' as $$
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
  if new.prix_fdj is null and exists (
    select 1 from public.tarification t
     where t.compagnie_id = new.compagnie_id and t.actif and t.type = 'forfait_mensuel') then
    new.prix_fdj := 0;
  end if;
  if new.quartier is null then
    select c.quartier into new.quartier from public.clients c where c.id = new.client_id;
  end if;
  return new;
end $$;
