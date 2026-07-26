-- Storage buckets for user-uploaded photos (profile avatars, custom exercise
-- equipment photos). Both are public-read (an avatar/equipment photo isn't
-- sensitive) but writes are restricted to the owner's own folder
-- (<user_id>/<filename>), enforced via storage.foldername().

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "exercise images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'exercise-images');

create policy "users upload their own exercise images"
  on storage.objects for insert
  with check (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own exercise images"
  on storage.objects for update
  using (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own exercise images"
  on storage.objects for delete
  using (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = auth.uid()::text);
