-- Social feed: posts (free-form or a shared workout snapshot), likes and
-- comments. Visible to the author and their accepted friends only — this is
-- deliberately independent of profiles.share_training/share_weight/
-- share_nutrition, since posting is an explicit per-item share action, not
-- the passive "let friends see my raw data" toggles from the friends
-- migration. Workout stats are snapshotted onto the post at creation time so
-- the post stays accurate even if the underlying session later changes.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'workout')),
  caption text,
  image_url text,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  workout_plan_name text,
  workout_duration_seconds integer,
  workout_volume_kg numeric,
  workout_exercise_count integer,
  created_at timestamptz not null default now(),
  constraint posts_has_content check (
    (kind = 'text' and (caption is not null or image_url is not null))
    or (kind = 'workout' and workout_plan_name is not null)
  )
);

create index posts_user_id_idx on public.posts(user_id);
create index posts_created_at_idx on public.posts(created_at desc);

alter table public.posts enable row level security;

create policy "own and friends posts are visible" on public.posts
  for select using (user_id = auth.uid() or public.is_accepted_friend(user_id));

create policy "users manage their own posts" on public.posts
  for insert with check (user_id = auth.uid());
create policy "users update their own posts" on public.posts
  for update using (user_id = auth.uid());
create policy "users delete their own posts" on public.posts
  for delete using (user_id = auth.uid());

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_unique unique (post_id, user_id)
);

create index post_likes_post_id_idx on public.post_likes(post_id);

alter table public.post_likes enable row level security;

create policy "likes on visible posts are visible" on public.post_likes
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.user_id = auth.uid() or public.is_accepted_friend(p.user_id))
    )
  );
create policy "users like visible posts as themselves" on public.post_likes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id and (p.user_id = auth.uid() or public.is_accepted_friend(p.user_id))
    )
  );
create policy "users remove their own like" on public.post_likes
  for delete using (user_id = auth.uid());

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index post_comments_post_id_idx on public.post_comments(post_id);

alter table public.post_comments enable row level security;

create policy "comments on visible posts are visible" on public.post_comments
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.user_id = auth.uid() or public.is_accepted_friend(p.user_id))
    )
  );
create policy "users comment on visible posts as themselves" on public.post_comments
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id and (p.user_id = auth.uid() or public.is_accepted_friend(p.user_id))
    )
  );
create policy "author or post owner can delete a comment" on public.post_comments
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

create policy "post images are publicly readable" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "users upload their own post images" on storage.objects
  for insert with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update their own post images" on storage.objects
  for update using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete their own post images" on storage.objects
  for delete using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
