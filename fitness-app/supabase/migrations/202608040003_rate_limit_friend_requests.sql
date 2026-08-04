-- friend_code is an 8-char hex code (16^8 keyspace) and
-- send_friend_request() had no throttling, making it brute-forceable by a
-- script repeatedly guessing codes. Add a per-user sliding-window limit.

create table public.friend_request_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index friend_request_attempts_user_idx
  on public.friend_request_attempts(user_id, attempted_at);

alter table public.friend_request_attempts enable row level security;
-- No select/insert policies: only the security definer function below
-- touches this table, direct client access is neither needed nor granted.

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
  recent_attempts integer;
begin
  delete from public.friend_request_attempts
    where user_id = auth.uid() and attempted_at <= now() - interval '1 hour';

  select count(*) into recent_attempts
    from public.friend_request_attempts
    where user_id = auth.uid();

  if recent_attempts >= 20 then
    raise exception 'Zu viele Versuche – bitte später erneut versuchen';
  end if;

  insert into public.friend_request_attempts (user_id) values (auth.uid());

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
