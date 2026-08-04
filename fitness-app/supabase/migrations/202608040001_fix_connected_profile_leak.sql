-- The "connected users can view basic profile" policy from
-- 202607260003_friends.sql granted full-ROW select access on public.profiles
-- to anyone with even a pending (not yet accepted) friendship — RLS filters
-- rows, not columns, so this exposed current_weight_kg, target_weight_kg,
-- height_cm, training_goal, experience_level and friend_code to any user who
-- sent (or received) a friend request, completely bypassing the dedicated
-- share_weight/share_training/share_nutrition consent toggles that are
-- supposed to gate exactly this kind of data.
--
-- Fix: drop that table-level policy (self access stays fully covered by the
-- existing "profiles own" policy from 202607220001_wld_fitness.sql) and
-- replace every "look up another user's basic profile" read path with a
-- SECURITY DEFINER function that only ever returns the safe columns
-- (id, display_name, avatar_url) for a connected user, plus the sharing
-- flags themselves — and only for ACCEPTED friends, since those flags are
-- meaningless (and were never intended to be visible) before acceptance.

drop policy if exists "connected users can view basic profile" on public.profiles;

create or replace function public.get_connection_profiles(target_ids uuid[])
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  share_training boolean,
  share_weight boolean,
  share_nutrition boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.display_name,
    p.avatar_url,
    case when public.is_accepted_friend(p.id) then p.share_training end as share_training,
    case when public.is_accepted_friend(p.id) then p.share_weight end as share_weight,
    case when public.is_accepted_friend(p.id) then p.share_nutrition end as share_nutrition
  from public.profiles p
  where p.id = any(target_ids)
    and (
      p.id = auth.uid()
      or exists (
        select 1 from public.friendships f
        where (f.requester_id = auth.uid() and f.addressee_id = p.id)
           or (f.addressee_id = auth.uid() and f.requester_id = p.id)
      )
    );
$$;

grant execute on function public.get_connection_profiles(uuid[]) to authenticated;
