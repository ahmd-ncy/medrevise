-- MedRevise : création complète de la base Supabase (données, fichiers, invitations, membres, profils, sécurité).
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- Le script peut être relancé sans risque sur une base existante : il ne supprime aucune donnée.
-- Le premier compte créé dans Authentication → Users devient l'unique administrateur (celui qui invite).
-- Nouvelle installation : exécute ce script, crée ton compte dans l'app, puis exécute-le une seconde fois
-- pour que ton compte devienne administrateur.

-- Données de l'application, découpées en morceaux (une ligne par morceau et par utilisateur)
create table if not exists public.etat (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cle text not null,
  data text not null,
  maj timestamptz not null default now(),
  primary key (user_id, cle)
);
alter table public.etat enable row level security;
grant select, insert, update, delete on public.etat to authenticated;

drop policy if exists "etat lecture" on public.etat;
drop policy if exists "etat ajout" on public.etat;
drop policy if exists "etat modification" on public.etat;
drop policy if exists "etat suppression" on public.etat;
create policy "etat lecture" on public.etat for select to authenticated using (auth.uid() = user_id);
create policy "etat ajout" on public.etat for insert to authenticated with check (auth.uid() = user_id);
create policy "etat modification" on public.etat for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "etat suppression" on public.etat for delete to authenticated using (auth.uid() = user_id);

-- Date de modification tenue par le serveur
create or replace function public.etat_maj() returns trigger language plpgsql as $$
begin
  new.maj := now();
  return new;
end $$;
drop trigger if exists etat_maj on public.etat;
create trigger etat_maj before insert or update on public.etat for each row execute function public.etat_maj();

-- Stockage privé des PDF et images (50 Mo maximum par fichier)
insert into storage.buckets (id, name, public, file_size_limit)
values ('fichiers', 'fichiers', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "fichiers lecture" on storage.objects;
drop policy if exists "fichiers ajout" on storage.objects;
drop policy if exists "fichiers modification" on storage.objects;
drop policy if exists "fichiers suppression" on storage.objects;
create policy "fichiers lecture" on storage.objects for select to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fichiers ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fichiers modification" on storage.objects for update to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fichiers suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text);

-- Membres : les comptes qui ont le droit d'utiliser l'app
create table if not exists public.membres (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'membre' check (role in ('membre', 'admin')),
  depuis timestamptz not null default now()
);
alter table public.membres enable row level security;
drop policy if exists "membres lecture" on public.membres;
create policy "membres lecture" on public.membres for select to authenticated using (auth.uid() = user_id);
grant select on public.membres to authenticated;

-- Invitations : codes à usage unique avec date d'expiration (accessibles seulement par les fonctions ci-dessous)
create table if not exists public.invitations (
  code text primary key,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  expire timestamptz not null,
  utilise_par uuid references auth.users (id) on delete set null,
  utilise_le timestamptz
);
alter table public.invitations enable row level security;

-- Le premier compte créé (le tien) devient l'unique administrateur, seulement s'il n'y en a pas encore
insert into public.membres (user_id, role)
select id, 'admin' from auth.users
where not exists (select 1 from public.membres where role = 'admin')
order by created_at limit 1
on conflict (user_id) do update set role = 'admin';

-- Un seul administrateur : le premier compte créé. Les autres comptes restent de simples membres.
update public.membres set role = 'membre'
where role = 'admin' and user_id <> (select id from auth.users order by created_at limit 1);

alter table public.membres add column if not exists expire timestamptz;          -- fin de l'accès (vide = illimité)
alter table public.invitations add column if not exists acces_heures int;
alter table public.invitations add column if not exists libelle text check (char_length(libelle) <= 60);  -- « pour qui ? »
alter table public.invitations add column if not exists archive boolean not null default false;
alter table public.membres add column if not exists atlas boolean not null default false;  -- accès à l'atlas 3D, donné par l'administrateur
alter table public.membres add column if not exists note text check (char_length(note) <= 1000);        -- note privée de l'administrateur         -- durée d'accès donnée par le code (vide = illimité)

-- Un membre dont l'accès a expiré n'a plus accès aux données (les règles de la base utilisent est_membre)
create or replace function public.est_membre() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membres where user_id = auth.uid() and (expire is null or expire > now()));
$$;
create or replace function public.mon_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.membres where user_id = auth.uid() and (expire is null or expire > now());
$$;
create or replace function public.mon_acces() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('role', role, 'expire', expire, 'expire_deja', expire is not null and expire <= now(),
                           'atlas', role = 'admin' or atlas)
  from public.membres where user_id = auth.uid();
$$;

-- La vérification d'un code avant inscription ne donne qu'un oui ou non, et refuse les formats impossibles
create or replace function public.invitation_valide(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_code ~* '^[A-Z0-9]{4}-?[A-Z0-9]{4}$' and exists (
    select 1 from public.invitations
    where code = upper(trim(p_code)) and utilise_par is null and expire > now()
  );
$$;

-- Créer un code : validité du code et durée de l'accès, de 1 heure à 1 an (accès illimité si p_acces est vide)
drop function if exists public.creer_invitation(int);
drop function if exists public.creer_invitation(int, int);
drop function if exists public.creer_invitation(int, int, text);
create function public.creer_invitation(p_heures int default 24, p_acces int default null, p_libelle text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  c text;
  a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr(a, 1 + floor(random() * length(a))::int, 1);
      if i = 4 then c := c || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.invitations where code = c);
  end loop;
  insert into public.invitations (code, cree_par, expire, acces_heures, libelle)
  values (c, auth.uid(), now() + make_interval(hours => greatest(1, least(p_heures, 8784))),
          case when p_acces is null then null else greatest(1, least(p_acces, 8784)) end,
          nullif(left(trim(coalesce(p_libelle, '')), 60), ''));
  return c;
end $$;

-- Annule un code pas encore utilisé (administrateurs seulement)
create or replace function public.annuler_invitation(p_code text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  delete from public.invitations where code = p_code and utilise_par is null;
end $$;

drop function if exists public.liste_invitations();
create function public.liste_invitations()
returns table (code text, cree_le timestamptz, expire timestamptz, acces_heures int, utilise_le timestamptz, email text, libelle text, archive boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  return query
    select i.code, i.cree_le, i.expire, i.acces_heures, i.utilise_le, u.email::text, i.libelle, i.archive
    from public.invitations i left join auth.users u on u.id = i.utilise_par
    order by i.cree_le desc limit 200;
end $$;

-- Gestion des codes (administrateur) : supprimer, archiver
create or replace function public.supprimer_invitation(p_code text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  delete from public.invitations where code = p_code;
end $$;
create or replace function public.archiver_invitation(p_code text, p_archive boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.invitations set archive = coalesce(p_archive, true) where code = p_code;
end $$;

-- Gestion des membres (administrateur) : prolonger, suspendre, note privée
create or replace function public.prolonger_acces(p_user uuid, p_heures int) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.membres
     set expire = greatest(coalesce(expire, now()), now()) + make_interval(hours => greatest(1, least(p_heures, 8784)))
   where user_id = p_user and role <> 'admin' and expire is not null;
end $$;
create or replace function public.suspendre_membre(p_user uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.membres set expire = now() where user_id = p_user and role <> 'admin';
end $$;
create or replace function public.admin_note(p_user uuid, p_note text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.membres set note = nullif(left(coalesce(p_note, ''), 1000), '') where user_id = p_user;
end $$;

-- Membres (administrateur seulement) : liste, durée d'accès, retrait
create or replace function public.liste_membres()
returns table (user_id uuid, email text, role text, depuis timestamptz, expire timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  return query
    select m.user_id, u.email::text, m.role, m.depuis, m.expire
    from public.membres m join auth.users u on u.id = m.user_id
    order by m.role, m.depuis;
end $$;

create or replace function public.modifier_acces(p_user uuid, p_heures int) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.membres
     set expire = case when p_heures is null then null else now() + make_interval(hours => greatest(1, least(p_heures, 8784))) end
   where user_id = p_user and role <> 'admin';
end $$;

create or replace function public.retirer_membre(p_user uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  delete from public.membres where user_id = p_user and role <> 'admin';
end $$;

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

-- Droits sur les fonctions : rien pour les visiteurs non connectés, sauf la vérification d'un code
revoke all on function public.creer_invitation(int, int, text), public.utiliser_invitation(text), public.liste_invitations(),
  public.annuler_invitation(text), public.est_membre(), public.mon_role(), public.mon_acces(), public.liste_membres(),
  public.modifier_acces(uuid, int), public.retirer_membre(uuid), public.supprimer_invitation(text),
  public.archiver_invitation(text, boolean), public.prolonger_acces(uuid, int), public.suspendre_membre(uuid),
  public.admin_note(uuid, text) from public, anon;
grant execute on function public.creer_invitation(int, int, text), public.utiliser_invitation(text), public.liste_invitations(),
  public.annuler_invitation(text), public.est_membre(), public.mon_role(), public.mon_acces(), public.liste_membres(),
  public.modifier_acces(uuid, int), public.retirer_membre(uuid), public.supprimer_invitation(text),
  public.archiver_invitation(text, boolean), public.prolonger_acces(uuid, int), public.suspendre_membre(uuid),
  public.admin_note(uuid, text) to authenticated;
grant execute on function public.invitation_valide(text) to anon, authenticated;

-- Les données et les fichiers ne sont accessibles qu'aux membres
drop policy if exists "etat lecture" on public.etat;
drop policy if exists "etat ajout" on public.etat;
drop policy if exists "etat modification" on public.etat;
drop policy if exists "etat suppression" on public.etat;
create policy "etat lecture" on public.etat for select to authenticated using (auth.uid() = user_id and public.est_membre());
create policy "etat ajout" on public.etat for insert to authenticated with check (auth.uid() = user_id and public.est_membre());
create policy "etat modification" on public.etat for update to authenticated using (auth.uid() = user_id and public.est_membre()) with check (auth.uid() = user_id and public.est_membre());
create policy "etat suppression" on public.etat for delete to authenticated using (auth.uid() = user_id and public.est_membre());

drop policy if exists "fichiers lecture" on storage.objects;
drop policy if exists "fichiers ajout" on storage.objects;
drop policy if exists "fichiers modification" on storage.objects;
drop policy if exists "fichiers suppression" on storage.objects;
create policy "fichiers lecture" on storage.objects for select to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text and public.est_membre());
create policy "fichiers ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text and public.est_membre());
create policy "fichiers modification" on storage.objects for update to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text and public.est_membre());
create policy "fichiers suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'fichiers' and (storage.foldername(name))[1] = auth.uid()::text and public.est_membre());

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
-- bannière ajoutée après coup : on crée la colonne si la table existait déjà
alter table public.profils add column if not exists banniere text;
do $$ begin
  alter table public.profils add constraint profils_banniere check (banniere is null or banniere ~ '^g[0-9]{1,2}$'
    or (banniere ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' and char_length(banniere) <= 300000));
exception when duplicate_object then null; end $$;
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
  taille_donnees bigint, nb_fichiers bigint, note text, banniere text, atlas boolean
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
             where o.bucket_id = 'fichiers' and (storage.foldername(o.name))[1] = m.user_id::text),
           m.note, p.banniere, m.atlas
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


-- ============ Contenu d'un membre, en lecture seule pour l'administrateur ============
-- UE, chapitres, livrets, nombre de QCM et de cartes par chapitre, chapitres commencés et réussite.
create or replace function public.admin_contenu(p_user uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare b json; s json;
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  select e.data::json into b from public.etat e where e.user_id = p_user and e.cle = 'base';
  select e.data::json into s from public.etat e where e.user_id = p_user and e.cle = 'stats';
  return json_build_object(
    'mat', coalesce(b->'mat', '[]'::json),
    'chap', coalesce(b->'chap', '[]'::json),
    'exam', b->'exam',
    'jm', coalesce(s->'jm', '{}'::json),
    'cs', coalesce(s->'cs', '{}'::json),
    'n', (select coalesce(json_object_agg(e.cle, json_array_length(e.data::json)), '{}'::json)
            from public.etat e where e.user_id = p_user and e.cle ~ '^(qcm|cards):'),
    'livrets', (select coalesce(json_agg(json_build_object('ch', x->>'ch', 'titre', x->>'titre', 'pdf', (x->'pdf') is not null)), '[]'::json)
                  from public.etat e, json_array_elements(e.data::json) x
                 where e.user_id = p_user and e.cle like 'courses:%')
  );
end $$;
revoke all on function public.admin_contenu(uuid) from public, anon;
grant execute on function public.admin_contenu(uuid) to authenticated;

-- ============ Packs de cours envoyés par l'administrateur ============
-- L'administrateur prépare un pack (UE, chapitres, livrets, QCM, cartes) pour un membre.
-- Rien n'est ajouté chez le membre tant qu'il n'a pas accepté depuis son app.
-- Pendant l'attente, le membre peut lire les PDF du pack dans le dossier de l'administrateur.
create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  de uuid not null references auth.users (id) on delete cascade,
  pour uuid not null references auth.users (id) on delete cascade,
  titre text not null check (char_length(titre) <= 200),
  resume jsonb check (resume is null or pg_column_size(resume) <= 4000),
  contenu text check (contenu is null or char_length(contenu) <= 12000000),
  fichiers text[] not null default '{}',
  statut text not null default 'attente' check (statut in ('attente', 'accepte', 'refuse', 'annule')),
  cree timestamptz not null default now(),
  repondu timestamptz
);
alter table public.packs enable row level security;
revoke all on public.packs from anon, authenticated;
grant select on public.packs to authenticated;
drop policy if exists "packs lecture" on public.packs;
create policy "packs lecture" on public.packs for select to authenticated
  using ((auth.uid() = pour or auth.uid() = de) and public.est_membre());

create or replace function public.envoyer_pack(p_user uuid, p_titre text, p_resume jsonb, p_contenu text, p_fichiers text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  if p_user = auth.uid() or not exists (select 1 from public.membres m where m.user_id = p_user) then
    raise exception 'Membre introuvable';
  end if;
  if (select count(*) from public.packs p where p.pour = p_user and p.statut = 'attente') >= 5 then
    raise exception 'Ce membre a déjà 5 packs en attente';
  end if;
  insert into public.packs (de, pour, titre, resume, contenu, fichiers)
  values (auth.uid(), p_user, left(p_titre, 200), p_resume, p_contenu, coalesce(p_fichiers, '{}'))
  returning id into v;
  return v;
end $$;
revoke all on function public.envoyer_pack(uuid, text, jsonb, text, text[]) from public, anon;
grant execute on function public.envoyer_pack(uuid, text, jsonb, text, text[]) to authenticated;

-- Le membre accepte ou refuse ; le contenu est effacé une fois la réponse donnée.
create or replace function public.repondre_pack(p_id uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.packs set statut = case when p_ok then 'accepte' else 'refuse' end, repondu = now(), contenu = null
   where id = p_id and pour = auth.uid() and statut = 'attente';
end $$;
revoke all on function public.repondre_pack(uuid, boolean) from public, anon;
grant execute on function public.repondre_pack(uuid, boolean) to authenticated;

-- L'administrateur peut annuler un pack pas encore accepté.
create or replace function public.annuler_pack(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.packs set statut = 'annule', repondu = now(), contenu = null
   where id = p_id and de = auth.uid() and statut = 'attente';
end $$;
revoke all on function public.annuler_pack(uuid) from public, anon;
grant execute on function public.annuler_pack(uuid) to authenticated;

-- PDF et images d'un pack en attente : lisibles par son destinataire, dans le dossier de l'expéditeur.
drop policy if exists "fichiers pack lecture" on storage.objects;
create policy "fichiers pack lecture" on storage.objects for select to authenticated
  using (bucket_id = 'fichiers' and public.est_membre() and exists (
    select 1 from public.packs p
     where p.pour = auth.uid() and p.statut = 'attente'
       and (storage.foldername(name))[1] = p.de::text
       and storage.filename(name) = any (p.fichiers)));

-- ============ Atlas 3D (modèles anatomiques) ============
-- Un seul fichier par modèle, partagé : l'administrateur choisit quels membres peuvent l'ouvrir.
-- L'administrateur y a toujours accès ; un membre seulement si sa case « atlas » est cochée et son accès valide.
create or replace function public.a_atlas() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membres
                  where user_id = auth.uid() and (expire is null or expire > now()) and (role = 'admin' or atlas));
$$;
revoke all on function public.a_atlas() from public, anon;
grant execute on function public.a_atlas() to authenticated;

create or replace function public.donner_atlas(p_user uuid, p_ok boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  update public.membres set atlas = coalesce(p_ok, false) where user_id = p_user and role <> 'admin';
end $$;
revoke all on function public.donner_atlas(uuid, boolean) from public, anon;
grant execute on function public.donner_atlas(uuid, boolean) to authenticated;

-- Espace privé « atlas » : modèles 3D au format .glb, 20 Mo au plus
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('atlas', 'atlas', false, 20971520, array['model/gltf-binary'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['model/gltf-binary'];

drop policy if exists "atlas lecture" on storage.objects;
create policy "atlas lecture" on storage.objects for select to authenticated
  using (bucket_id = 'atlas' and public.a_atlas());
drop policy if exists "atlas ajout" on storage.objects;
create policy "atlas ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'atlas' and coalesce(public.mon_role(), '') = 'admin');
drop policy if exists "atlas modification" on storage.objects;
create policy "atlas modification" on storage.objects for update to authenticated
  using (bucket_id = 'atlas' and coalesce(public.mon_role(), '') = 'admin');
drop policy if exists "atlas suppression" on storage.objects;
create policy "atlas suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'atlas' and coalesce(public.mon_role(), '') = 'admin');
