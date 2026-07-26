-- The app has always written to public.exercise_preferences (per-user
-- customization/favorite state for shared public exercises), but this
-- table was never actually created in the database — an RLS audit
-- (comparing every table the client code writes to against what
-- actually exists) turned up that it's missing entirely, meaning
-- favoriting or customizing a public exercise silently never made it
-- to the server (only the local browser cache kept it working at all).

create table public.exercise_preferences (
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

create policy "exercise preferences own" on public.exercise_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger set_exercise_preferences_updated_at
  before update on public.exercise_preferences
  for each row execute function public.set_updated_at();
