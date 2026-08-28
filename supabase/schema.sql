-- Table des exercices (liste maîtresse par utilisateur)
-- À exécuter dans le SQL Editor du projet Supabase.

create table if not exists public.exercices (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type text not null check (type in ('musculation', 'cardio')),
  created_at timestamptz not null default now()
);

alter table public.exercices enable row level security;

create policy "exercices_select_propre" on public.exercices
  for select using (auth.uid() = user_id);

create policy "exercices_insert_propre" on public.exercices
  for insert with check (auth.uid() = user_id);

create policy "exercices_update_propre" on public.exercices
  for update using (auth.uid() = user_id);

create policy "exercices_delete_propre" on public.exercices
  for delete using (auth.uid() = user_id);

-- Les anciennes séances contenaient seance_code ; on retire la colonne
-- (les données ne sont pas conservées, cf. refactor).
alter table public.sessions drop column if exists seance_code;
