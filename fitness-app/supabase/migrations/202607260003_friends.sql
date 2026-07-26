-- Friends: a friend-code based connection system (no public user search/
-- directory — you can only be found by someone who already has your code,
-- which keeps this from becoming an accidentally-public user list) plus
-- per-category sharing toggles so each user decides exactly what a friend
-- can see. Nothing is shared by default except basic training activity.

alter table public.profiles add column if not exists friend_code text unique;
alter table public.profiles add column if not exists share_training boolean not null default true;
alter table public.profiles add column if not exists share_weight boolean not null default false;
alter table public.profiles add column if not exists share_nutrition boolean not null default false;

update public.profiles
  set friend_code = upper(substr(md5(random()::text || id::text), 1, 8))
  where friend_code is null;

-- Recreate the signup trigger function to also assign a friend_code.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, friend_code)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'display_name', ''),
      upper(substr(md5(random()::text || new.id::text), 1, 8))
    );
  insert into public.nutrition_goals (user_id) values (new.id);
  return new;
end;
$$;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create index friendships_requester_idx on public.friendships(requester_id);
create index friendships_addressee_idx on public.friendships(addressee_id);

alter table public.friendships enable row level security;

create trigger set_friendships_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

-- Only select/update/delete policies exist on purpose — every insert goes
-- through send_friend_request() below (security definer), which is the
-- only way to create a row. This keeps "who can create a friendship, with
-- what status" as one reviewable code path instead of open client inserts.
create policy "view own friendships" on public.friendships
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "addressee can update status" on public.friendships
  for update using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

create policy "either party can delete friendship" on public.friendships
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Anyone connected to you (even a pending request) can see your basic
-- profile — needed to show "who sent this request" before you've accepted.
create policy "connected users can view basic profile" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
         or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
    )
  );

create or replace function public.is_accepted_friend(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = other_user_id)
        or (addressee_id = auth.uid() and requester_id = other_user_id))
  );
$$;

grant execute on function public.is_accepted_friend(uuid) to authenticated;

-- Sensitive tables: friends can only read if (a) accepted and (b) the
-- owner opted that category in via profiles.share_*. These are additional
-- permissive policies alongside the existing "own data" ones — Postgres
-- OR's multiple permissive policies together, so this only *adds* access.
create policy "friends can view shared training sessions" on public.workout_sessions
  for select using (
    public.is_accepted_friend(user_id)
    and exists (select 1 from public.profiles p where p.id = user_id and p.share_training)
  );

create policy "friends can view shared personal records" on public.personal_records
  for select using (
    public.is_accepted_friend(user_id)
    and exists (select 1 from public.profiles p where p.id = user_id and p.share_training)
  );

create policy "friends can view shared body measurements" on public.body_measurements
  for select using (
    public.is_accepted_friend(user_id)
    and exists (select 1 from public.profiles p where p.id = user_id and p.share_weight)
  );

create policy "friends can view shared meals" on public.meals
  for select using (
    public.is_accepted_friend(user_id)
    and exists (select 1 from public.profiles p where p.id = user_id and p.share_nutrition)
  );

-- Send (or accept, if they already requested you) a friend request by
-- code. security definer so it can look up the target profile by code
-- without the caller needing broad read access to all profiles.
create or replace function public.send_friend_request(target_code text)
returns table (
  friendship_id uuid,
  friendship_status text,
  friend_id uuid,
  friend_display_name text,
  friend_avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  reverse_id uuid;
  result_id uuid;
  result_status text;
begin
  select id into target_id from public.profiles
    where friend_code = upper(trim(target_code));

  if target_id is null then
    raise exception 'Kein Nutzer mit diesem Code gefunden';
  end if;
  if target_id = auth.uid() then
    raise exception 'Du kannst dich nicht selbst hinzufügen';
  end if;

  select id into reverse_id from public.friendships
    where requester_id = target_id and addressee_id = auth.uid();

  if reverse_id is not null then
    update public.friendships set status = 'accepted', updated_at = now()
      where id = reverse_id
      returning id, status into result_id, result_status;
  else
    insert into public.friendships (requester_id, addressee_id, status)
      values (auth.uid(), target_id, 'pending')
      on conflict (requester_id, addressee_id)
      do update set updated_at = now()
      returning id, status into result_id, result_status;
  end if;

  return query
    select result_id, result_status, p.id, p.display_name, p.avatar_url
    from public.profiles p where p.id = target_id;
end;
$$;

grant execute on function public.send_friend_request(text) to authenticated;
