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
  if new.livreur_id is null then
    select l.id into new.livreur_id
      from public.livreurs l
     where l.actif
     order by (select count(*) from public.dossiers d
                where d.livreur_id = l.id and d.statut <> 'livre') asc,
              random()
     limit 1;
  end if;
  return new;
end $$;
