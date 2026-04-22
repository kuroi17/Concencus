import { supabase } from './supabaseClient';

export async function uploadPublicImage(file, bucketName = 'announcement-images') {
  if (!file) return null;

  // More unique filename — timestamp + random para sure walang conflict
  const fileExt = file.name.split('.').pop().toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `announcements/${fileName}`;

  // 1. Upload
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,         // Ayaw natin mag-overwrite
      contentType: file.type // Explicit para hindi mag-guess si Supabase
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Get public URL
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return data.publicUrl;
}
