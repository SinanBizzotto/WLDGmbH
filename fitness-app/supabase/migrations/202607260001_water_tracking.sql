-- Water tracking: one row per logged glass/bottle, plus a per-user daily goal
-- column on the existing nutrition_goals table.

alter table public.nutrition_goals
  add column if not exists water_goal_ml integer not null default 2500;

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index water_logs_user_date_idx on public.water_logs(user_id, logged_at desc);

alter table public.water_logs enable row level security;

create policy "water logs own" on public.water_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger set_water_logs_updated_at
  before update on public.water_logs
  for each row execute function public.set_updated_at();
