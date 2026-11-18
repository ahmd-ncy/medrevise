-- MedRevise, mise à jour 3 : profils visibles par l'administrateur, et sécurité renforcée.
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run (après supabase-maj-2.sql).
-- Le script peut être relancé sans risque.

-- ============ Profils (prénom, photo, filière, résumé de progression) ============
create table if not exists public.profils (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prenom text check (char_length(prenom) <= 60),
  nom text check (char_length(nom) <= 60),
  filiere text check (char_length(filiere) <= 30),
  fac text check (char_length(fac) <= 60),
  bio text check (char_length(bio) <= 160),
  photo text check (photo is null or (photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' and char_length(photo) <= 150000)),
  stats jsonb check (stats is null or pg_column_size(stats) <= 4000),
  maj timestamptz not null default now()
);
alter table public.profils enable row level security;
revoke all on public.profils from anon;
grant select, insert, update on public.profils to authenticated;
drop policy if exists "profils lecture" on public.profils;
drop policy if exists "profils ajout" on public.profils;
drop policy if exists "profils modification" on public.profils;
create policy "profils lecture" on public.profils for select to authenticated using (auth.uid() = user_id and public.est_membre());
create policy "profils ajout" on public.profils for insert to authenticated with check (auth.uid() = user_id and public.est_membre());
create policy "profils modification" on public.profils for update to authenticated using (auth.uid() = user_id and public.est_membre()) with check (auth.uid() = user_id and public.est_membre());

create or replace function public.profils_maj() returns trigger language plpgsql as $$
begin
  new.maj := now();
  return new;
end $$;
drop trigger if exists profils_maj on public.profils;
create trigger profils_maj before insert or update on public.profils for each row execute function public.profils_maj();

-- Vue d'ensemble des membres pour l'administrateur (profil, accès, connexion, volume de données)
drop function if exists public.admin_membres();
create function public.admin_membres()
returns table (
  user_id uuid, email text, role text, depuis timestamptz, expire timestamptz,
  derniere_connexion timestamptz, cree_le timestamptz,
  prenom text, nom text, filiere text, fac text, bio text, photo text, stats jsonb, maj timestamptz,
  taille_donnees bigint, nb_fichiers bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  return query
    select m.user_id, u.email::text, m.role, m.depuis, m.expire, u.last_sign_in_at, u.created_at,
           p.prenom, p.nom, p.filiere, p.fac, p.bio, p.photo, p.stats, p.maj,
           (select coalesce(sum(char_length(e.data)), 0)::bigint from public.etat e where e.user_id = m.user_id),
           (select count(*)::bigint from storage.objects o
             where o.bucket_id = 'fichiers' and (storage.foldername(o.name))[1] = m.user_id::text)
    from public.membres m
    join auth.users u on u.id = m.user_id
    left join public.profils p on p.user_id = m.user_id
    order by m.role, m.depuis;
end $$;
revoke all on function public.admin_membres() from public, anon;
grant execute on function public.admin_membres() to authenticated;

-- ============ Sécurité ============
-- Personne ne peut accéder aux tables sans être connecté
revoke all on public.etat, public.membres, public.invitations from anon;

-- Taille et forme des données envoyées : pas plus de 6 Mo par morceau, noms de morceaux contrôlés,
-- 3 000 morceaux au plus par utilisateur
do $$ begin
  alter table public.etat add constraint etat_taille check (char_length(data) <= 6000000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.etat add constraint etat_cle check (cle ~ '^[a-z]{2,12}(:[A-Za-z0-9_-]{1,40})?$') not valid;
exception when duplicate_object then null; end $$;
create or replace function public.etat_limite() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.etat where user_id = new.user_id) >= 3000 then
    raise exception 'Limite de données atteinte';
  end if;
  return new;
end $$;
drop trigger if exists etat_limite on public.etat;
create trigger etat_limite before insert on public.etat for each row execute function public.etat_limite();

-- Fichiers : seulement des PDF et des images de schémas (enregistrées en texte), 50 Mo au plus
update storage.buckets
   set allowed_mime_types = array['application/pdf', 'text/plain'], file_size_limit = 52428800, public = false
 where id = 'fichiers';

-- Codes d'invitation : 10 essais ratés au plus par heure et par compte (contre les essais au hasard)
create table if not exists public.tentatives (
  user_id uuid not null references auth.users (id) on delete cascade,
  t timestamptz not null default now()
);
create index if not exists tentatives_user_t on public.tentatives (user_id, t);
alter table public.tentatives enable row level security;
revoke all on public.tentatives from anon, authenticated;

create or replace function public.utiliser_invitation(p_code text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  h int;
begin
  if auth.uid() is null then return false; end if;
  if public.est_membre() then return true; end if;
  if (select count(*) from public.tentatives where user_id = auth.uid() and t > now() - interval '1 hour') >= 10 then
    raise exception 'Trop de tentatives : réessaie dans une heure';
  end if;
  update public.invitations
     set utilise_par = auth.uid(), utilise_le = now()
   where code = upper(trim(p_code)) and utilise_par is null and expire > now()
  returning acces_heures into h;
  if not found then
    insert into public.tentatives (user_id) values (auth.uid());
    delete from public.tentatives where t < now() - interval '1 day';
    return false;
  end if;
  insert into public.membres (user_id, expire)
  values (auth.uid(), case when h is null then null else now() + make_interval(hours => h) end)
  on conflict (user_id) do update set expire = excluded.expire;
  return true;
end $$;

-- La vérification d'un code avant inscription ne donne qu'un oui ou non, et refuse les formats impossibles
create or replace function public.invitation_valide(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_code ~* '^[A-Z0-9]{4}-?[A-Z0-9]{4}$' and exists (
    select 1 from public.invitations
    where code = upper(trim(p_code)) and utilise_par is null and expire > now()
  );
$$;
