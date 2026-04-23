import { supabase } from './supabaseClient';

export async function uploadPublicImage(options) {
  const { file, bucketName = 'announcement-images', pathPrefix = '', upsert = false } = options || {};
  if (!file) return null;

  // More unique filename — timestamp + random para sure walang conflict
  const fileExt = file.name.split('.').pop().toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

  // 1. Upload
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: upsert,
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

/**
 * Deletes an image from the Supabase storage bucket using its public URL.
 * Extracts the file path from the URL, then calls storage.remove().
 *
 * @param {string} publicUrl  - The full public URL saved in the database (image_url column)
 * @param {string} bucketName - The bucket where the image is stored
 * @returns {Promise<void>}
 */
export async function deletePublicImage(publicUrl, bucketName = 'announcement-images') {
  if (!publicUrl) return;

  // I-extract yung filePath mula sa public URL
  // Format: .../storage/v1/object/public/[bucketName]/[filePath]
  // Kailangan natin yung part pagkatapos ng bucketName
  const marker = `/object/public/${bucketName}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    console.warn('deletePublicImage: Hindi ma-parse ang URL, skip delete sa bucket.', publicUrl);
    return;
  }

  const filePath = publicUrl.slice(markerIndex + marker.length);

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}