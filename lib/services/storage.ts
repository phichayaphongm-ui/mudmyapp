import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/utils';

const BUCKET = 'mudmy';

export async function uploadPinImage(file: File, userId: string, pinId: string): Promise<string> {
  try {
    const compressedBlob = await compressImage(file, 1200, 0.7);

    const timestamp = new Date().getTime();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const storagePath = `pins/${userId}/${pinId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, compressedBlob);

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}

export async function deletePinImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from Supabase public URL format:
    // https://<project>.supabase.co/storage/v1/object/public/mudmy/<path>
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx !== -1) {
      const storagePath = decodeURIComponent(imageUrl.substring(idx + marker.length));
      const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (error) console.warn('Error deleting image from storage:', error);
    }
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    // Don't throw, just log. Deletion failure shouldn't break the app flow.
  }
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  try {
    const compressedBlob = await compressImage(file, 400, 0.6);

    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar_${new Date().getTime()}.${extension}`;
    const storagePath = `profiles/${userId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, compressedBlob);

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function uploadReviewImage(file: File, pinId: string, reviewId: string, index: number): Promise<string> {
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('File must be an image');

  try {
    const compressedBlob = await compressImage(file, 1000, 0.7);

    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `review_${reviewId}_${timestamp}_${index}.${extension}`;
    const filePath = `reviews/${pinId}/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, compressedBlob);
    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading review image:', error);
    throw error;
  }
}
