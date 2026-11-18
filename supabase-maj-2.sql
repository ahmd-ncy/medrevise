-- MedRevise, mise à jour 2 : durée des codes et de l'accès (1 heure à 1 an), gestion des membres.
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run (après supabase-invitations.sql).

-- Un seul administrateur : le premier compte créé. Les autres comptes restent de simples membres.
update public.membres set role = 'membre'
where role = 'admin' and user_id <> (select id from auth.users order by created_at limit 1);

alter table public.membres add column if not exists expire timestamptz;          -- fin de l'accès (vide = illimité)
alter table public.invitations add column if not exists acces_heures int;         -- durée d'accès donnée par le code (vide = illimité)

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
  select json_build_object('role', role, 'expire', expire, 'expire_deja', expire is not null and expire <= now())
  from public.membres where user_id = auth.uid();
$$;

-- Créer un code : validité du code et durée de l'accès, de 1 heure à 1 an (accès illimité si p_acces est vide)
drop function if exists public.creer_invitation(int);
drop function if exists public.creer_invitation(int, int);
create function public.creer_invitation(p_heures int default 24, p_acces int default null) returns text
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
  insert into public.invitations (code, cree_par, expire, acces_heures)
  values (c, auth.uid(), now() + make_interval(hours => greatest(1, least(p_heures, 8784))),
          case when p_acces is null then null else greatest(1, least(p_acces, 8784)) end);
  return c;
end $$;

-- Utiliser un code : donne l'accès (ou le renouvelle s'il avait expiré)
create or replace function public.utiliser_invitation(p_code text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  h int;
begin
  if auth.uid() is null then return false; end if;
  if public.est_membre() then return true; end if;
  update public.invitations
     set utilise_par = auth.uid(), utilise_le = now()
   where code = upper(trim(p_code)) and utilise_par is null and expire > now()
  returning acces_heures into h;
  if not found then return false; end if;
  insert into public.membres (user_id, expire)
  values (auth.uid(), case when h is null then null else now() + make_interval(hours => h) end)
  on conflict (user_id) do update set expire = excluded.expire;
  return true;
end $$;

drop function if exists public.liste_invitations();
create function public.liste_invitations()
returns table (code text, cree_le timestamptz, expire timestamptz, acces_heures int, utilise_le timestamptz, email text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  return query
    select i.code, i.cree_le, i.expire, i.acces_heures, i.utilise_le, u.email::text
    from public.invitations i left join auth.users u on u.id = i.utilise_par
    order by i.cree_le desc limit 50;
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

revoke all on function public.creer_invitation(int, int), public.liste_invitations(), public.liste_membres(),
  public.modifier_acces(uuid, int), public.retirer_membre(uuid), public.mon_acces() from public, anon;
grant execute on function public.creer_invitation(int, int), public.liste_invitations(), public.liste_membres(),
  public.modifier_acces(uuid, int), public.retirer_membre(uuid), public.mon_acces() to authenticated;
