import { isDemoMode, supabase } from "./supabase";

export type ImageBucket = "avatars" | "exercise-images" | "post-images";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a user-picked image and returns a URL to display it.
 * In demo mode (no real Supabase project), there's no storage backend to
 * upload to, so the photo is kept inline as a data URL instead — it still
 * works for the current session/localStorage, it just isn't a real remote
 * upload.
 */
export async function uploadImage(
  bucket: ImageBucket,
  userId: string,
  file: File,
): Promise<string> {
  // The <input accept="image/*"> is a UI hint only and is trivially
  // bypassed (drag-and-drop, "all files" in the OS picker); these buckets
  // are public-read, so an unvalidated upload could abuse storage with
  // oversized files or serve a non-image under an attacker-chosen type.
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Nur JPEG-, PNG-, WebP- oder GIF-Bilder sind erlaubt.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Das Bild darf höchstens 8 MB groß sein.");
  }
  if (!supabase || isDemoMode) {
    return fileToDataUrl(file);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
