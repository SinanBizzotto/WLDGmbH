-- NOTE: public.exercise_preferences is already created by
-- 202607230002_exercise_library_upgrade.sql (with IF NOT EXISTS). This
-- migration was originally written believing the table was missing
-- entirely, but it isn't — it duplicates that earlier migration. It's
-- kept (instead of deleted) to avoid renumbering history, but rewritten
-- to be fully idempotent so replaying all migrations in order on a
-- fresh database doesn't fail on "relation already exists" /
-- "policy already exists" errors.

create table if not exists public.exercise_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  custom_name text,
  custom_muscle_group text,
  custom_equipment_type text,
  custom_exercise_type text,
  custom_description text,
  custom_instructions text[],
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_preferences'
      and policyname = 'exercise preferences own'
  ) then
    create policy "exercise preferences own" on public.exercise_preferences
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

create or replace trigger set_exercise_preferences_updated_at
  before update on public.exercise_preferences
  for each row execute function public.set_updated_at();
