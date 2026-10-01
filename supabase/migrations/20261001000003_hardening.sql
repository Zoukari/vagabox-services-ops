-- Fonctions trigger : non appelables via l'API
revoke all on function public.dossier_avant_insert() from public, anon, authenticated;
revoke all on function public.dossier_apres_insert() from public, anon, authenticated;
-- Helpers de rôle : nécessaires aux policies RLS (authenticated), jamais pour anon
revoke all on function public.mon_role() from public, anon;
revoke all on function public.ma_compagnie() from public, anon;
revoke all on function public.mon_livreur() from public, anon;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.mon_role(), public.ma_compagnie(), public.mon_livreur(), public.est_admin() to authenticated;

-- Livreur : voit le nom des compagnies de ses dossiers (jointure dossiers_vue)
create policy compagnies_livreur on public.compagnies for select to authenticated
  using (exists (select 1 from public.dossiers d where d.compagnie_id = compagnies.id and d.livreur_id = public.mon_livreur()));
