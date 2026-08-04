-- workout_plan_exercises/workout_sets only checked that the parent plan/
-- session belonged to the caller — never that exercise_id was public or
-- owned by the caller. A user who learned another user's private exercise
-- uuid could reference it from their own plan/session (passes RLS since
-- only plan/session ownership was checked), permanently blocking the true
-- owner from ever deleting that exercise (exercise_id has "on delete
-- restrict"). Add the missing check to the insert/update path.

drop policy if exists "plan exercises through owner" on public.workout_plan_exercises;
create policy "plan exercises through owner" on public.workout_plan_exercises
  for all using (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and (e.is_public or e.user_id = auth.uid())
    )
  );

drop policy if exists "sets through owner" on public.workout_sets;
create policy "sets through owner" on public.workout_sets
  for all using (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and (e.is_public or e.user_id = auth.uid())
    )
  );

-- posts.insert only checked user_id = auth.uid(), never that a 'workout'
-- post's workout_session_id actually belongs to that user — a crafted
-- insert could reference a stranger's session id (no direct data leak,
-- since workout_sessions' own RLS still gates any join, but it's a
-- referential-integrity/spoofing gap).
drop policy if exists "users manage their own posts" on public.posts;
create policy "users manage their own posts" on public.posts
  for insert with check (
    user_id = auth.uid()
    and (
      kind <> 'workout'
      or workout_session_id is null
      or exists (
        select 1 from public.workout_sessions s
        where s.id = workout_session_id and s.user_id = auth.uid()
      )
    )
  );
