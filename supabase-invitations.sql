-- MedRevise : accès sur invitation.
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run, APRÈS supabase.sql.
-- AVANT de lancer : vérifie dans Authentication → Users que seul ton compte existe.
-- Tous les comptes déjà créés deviennent administrateurs (ils peuvent inviter).

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

-- Les comptes existants (le tien) deviennent administrateurs
insert into public.membres (user_id, role)
select id, 'admin' from auth.users
on conflict (user_id) do update set role = 'admin';

create or replace function public.est_membre() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membres where user_id = auth.uid());
$$;

create or replace function public.mon_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.membres where user_id = auth.uid();
$$;

-- Vérifie un code avant l'inscription (sans le consommer)
create or replace function public.invitation_valide(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invitations
    where code = upper(trim(p_code)) and utilise_par is null and expire > now()
  );
$$;

-- Crée un code (administrateurs seulement)
create or replace function public.creer_invitation(p_heures int default 24) returns text
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
  insert into public.invitations (code, cree_par, expire)
  values (c, auth.uid(), now() + make_interval(hours => greatest(1, least(p_heures, 720))));
  return c;
end $$;

-- Utilise un code : le compte connecté devient membre
create or replace function public.utiliser_invitation(p_code text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null then return false; end if;
  if public.est_membre() then return true; end if;
  update public.invitations
     set utilise_par = auth.uid(), utilise_le = now()
   where code = upper(trim(p_code)) and utilise_par is null and expire > now();
  if not found then return false; end if;
  insert into public.membres (user_id) values (auth.uid()) on conflict do nothing;
  return true;
end $$;

-- Liste des invitations et des membres (administrateurs seulement)
create or replace function public.liste_invitations()
returns table (code text, cree_le timestamptz, expire timestamptz, utilise_le timestamptz, email text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.mon_role(), '') <> 'admin' then
    raise exception 'Réservé à l''administrateur';
  end if;
  return query
    select i.code, i.cree_le, i.expire, i.utilise_le, u.email::text
    from public.invitations i left join auth.users u on u.id = i.utilise_par
    order by i.cree_le desc limit 50;
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

revoke all on function public.creer_invitation(int), public.utiliser_invitation(text),
  public.liste_invitations(), public.annuler_invitation(text), public.est_membre(), public.mon_role() from public, anon;
grant execute on function public.creer_invitation(int), public.utiliser_invitation(text),
  public.liste_invitations(), public.annuler_invitation(text), public.est_membre(), public.mon_role() to authenticated;
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
