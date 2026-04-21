import { supabase } from "./supabaseClient";

function getFileExtension(file) {
  const name = file?.name || "";
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return ext.toLowerCase();
}

export function isImageFile(file) {
  return Boolean(file && typeof file.type === "string" && file.type.startsWith("image/"));
}

export async function uploadPublicImage({ bucket, pathPrefix, file, upsert = false }) {
  if (!file) return null;
  if (!isImageFile(file)) {
    throw new Error("Please upload an image file (png, jpg, webp).");
  }

  const ext = getFileExtension(file) || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${pathPrefix}/${filename}`.replaceAll("//", "/");

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

