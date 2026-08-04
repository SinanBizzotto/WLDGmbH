-- avatars/exercise-images/post-images had no server-side file size or MIME
-- type restriction — the client's accept="image/*" is a UI hint only and
-- doesn't stop a direct API call (with a valid session) from uploading an
-- oversized file or a non-image under an attacker-chosen content type to
-- these public-read buckets. Enforce the same limits Supabase actually
-- checks server-side, matching the client-side guard in src/lib/storage.ts.

update storage.buckets
set file_size_limit = 8388608, -- 8 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id in ('avatars', 'exercise-images', 'post-images');
