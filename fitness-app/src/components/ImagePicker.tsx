import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { uploadImage, type ImageBucket } from "../lib/storage";
import { useToast } from "./ui";

/**
 * Photo picker for avatars/exercise images. Uses a plain file input with no
 * `capture` attribute so mobile browsers offer their native choice between
 * taking a new photo and picking one from the photo library.
 */
export function ImagePicker({
  bucket,
  userId,
  value,
  onChange,
  label = "Foto",
  shape = "square",
}: {
  bucket: ImageBucket;
  userId: string;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "round";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      onChange(await uploadImage(bucket, userId, file));
    } catch {
      toast("Foto konnte nicht hochgeladen werden", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`image-picker image-picker--${shape}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        className="image-picker__preview"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {value ? (
          <img src={value} alt="" />
        ) : (
          <span className="image-picker__placeholder">
            <ImagePlus />
          </span>
        )}
        <span className="image-picker__overlay">
          <Camera size={14} /> {uploading ? "Lädt…" : label}
        </span>
      </button>
    </div>
  );
}
