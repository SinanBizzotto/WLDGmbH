-- Defensive fix: profile saves (avatar photo, display name, and the
-- friends sharing toggles) were silently not persisting. The app code was
-- also swallowing the Supabase error instead of surfacing it (fixed
-- separately in the client), which hid the real cause. This ensures an
-- UPDATE policy on profiles for the owner's own row exists regardless of
-- what the original policy set looked like — safe to run even if an
-- equivalent policy already exists under a different name, since
-- permissive policies only add access, never restrict it.

drop policy if exists "users update their own profile" on public.profiles;

create policy "users update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
