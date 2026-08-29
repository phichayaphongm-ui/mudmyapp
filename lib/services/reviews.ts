import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/types';

function mapRowToReview(row: any): Review {
  return {
    id: row.id,
    pinId: row.pin_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    rating: row.rating,
    comment: row.comment,
    images: row.images ?? [],
    createdAt: row.created_at,
  };
}

export async function getReviews(pinId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('pin_id', pinId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToReview);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function addReview(pinId: string, reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Insert review
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        id: crypto.randomUUID(),
        pin_id: pinId,
        user_id: reviewData.userId,
        user_name: reviewData.userName,
        user_avatar: reviewData.userAvatar ?? null,
        rating: reviewData.rating,
        comment: reviewData.comment,
        images: reviewData.images ?? [],
        created_at: now,
      });

    if (reviewError) throw reviewError;

    // Fetch current pin stats
    const { data: pinRow, error: pinError } = await supabase
      .from('pins')
      .select('rating, review_count')
      .eq('id', pinId)
      .single();

    if (pinError) throw pinError;

    const currentRating = pinRow.rating || 0;
    const currentCount = pinRow.review_count || 0;
    const newCount = currentCount + 1;
    const newRating = Math.round(((currentRating * currentCount) + reviewData.rating) / newCount * 10) / 10;

    // Update pin rating and review count
    const { error: updateError } = await supabase
      .from('pins')
      .update({ rating: newRating, review_count: newCount })
      .eq('id', pinId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}
