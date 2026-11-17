-- MedRevise : à exécuter une fois dans Supabase → SQL Editor → New query → Run.
-- Crée la table des données et l'espace de stockage des PDF, réservés à chaque utilisateur.

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
