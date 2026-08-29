import { supabase } from '@/lib/supabase';
import type { Pin } from '@/lib/types';

// ─── Helper: map Supabase row → Pin ──────────────────────────────────────────
function mapRowToPin(row: any): Pin & { isDeleted?: boolean; isExpired?: boolean } {
  const now = new Date();
  let daysLeft = 0;
  let isExpired = false;
  if (row.expires_at) {
    const expiresDate = new Date(row.expires_at);
    isExpired = expiresDate.getTime() < now.getTime();
    daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    images: row.images ?? [],
    contact: row.contact ?? {},
    price: row.price ?? null,
    priceLabel: row.price_label,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    district: row.district,
    province: row.province,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    status: row.status,
    plan: row.plan,
    featured: row.featured ?? false,
    heroId: row.hero_id,
    thankYouMessage: row.thank_you_message,
    views: row.views ?? 0,
    clicks: row.clicks ?? 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    daysLeft,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    favoriteCount: row.favorite_count ?? 0,
    pinNumber: row.pin_number,
    reports: row.reports ?? [],
    radius: row.radius,
    ownerType: row.owner_type ?? 'personal',
    isFreePin: row.is_free_pin ?? false,
    lastCheckedInAt: row.last_checked_in_at,
    isExpired,
    isDeleted: false,
  };
}

export async function getUserFavorites(userId: string): Promise<(Pin & { isDeleted?: boolean; isExpired?: boolean })[]> {
  try {
    // Fetch favorites, ordered by created_at desc
    const { data: favs, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!favs || favs.length === 0) return [];

    // ✔️ Batch fetch all pins in one query (fixes N+1 problem)
    const pinIds = favs.map((f) => f.pin_id);
    const { data: pinRows } = await supabase
      .from('pins')
      .select('*')
      .in('id', pinIds);

    const pinMap = new Map<string, any>();
    (pinRows || []).forEach((p) => pinMap.set(p.id, p));

    const results: (Pin & { isDeleted?: boolean; isExpired?: boolean })[] = favs.map((fav) => {
      const pinRow = pinMap.get(fav.pin_id);

      if (!pinRow) {
        // Pin was deleted
        return {
          id: fav.pin_id,
          title: 'หมุดนี้ถูกลบไปแล้ว',
          isDeleted: true,
          category: 'news',
          description: 'เจ้าของหมุดได้ทำการลบข้อมูลนี้ออกจากระบบแล้ว',
          images: [],
          status: 'expired',
          createdAt: fav.created_at,
          contact: {},
          lat: 0,
          lng: 0,
          address: '',
          district: '',
          province: '',
          ownerId: '',
          ownerName: '',
          plan: 'general',
          views: 0,
          clicks: 0,
          expiresAt: '',
          daysLeft: 0,
          rating: 0,
          reviewCount: 0,
          favoriteCount: 0,
          ownerType: 'personal',
        } as any;
      }

      return mapRowToPin(pinRow);
    });

    return results;
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    throw error;
  }
}

export async function isFavorite(userId: string, pinId: string): Promise<boolean> {
  try {
    const favId = `${userId}_${pinId}`;
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('id', favId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

export async function toggleFavorite(userId: string, pinId: string): Promise<boolean> {
  try {
    const favId = `${userId}_${pinId}`;
    const alreadyFav = await isFavorite(userId, pinId);

    if (alreadyFav) {
      // Remove favorite
      await supabase.from('favorites').delete().eq('id', favId);
      // Decrement pin favorite_count
      const { data: pin } = await supabase.from('pins').select('favorite_count').eq('id', pinId).single();
      if (pin) {
        await supabase.from('pins').update({ favorite_count: Math.max(0, (pin.favorite_count || 0) - 1) }).eq('id', pinId);
      }
      return false;
    } else {
      // Add favorite
      await supabase.from('favorites').insert({ id: favId, user_id: userId, pin_id: pinId, created_at: new Date().toISOString() });
      // Increment pin favorite_count
      const { data: pin } = await supabase.from('pins').select('favorite_count').eq('id', pinId).single();
      if (pin) {
        await supabase.from('pins').update({ favorite_count: (pin.favorite_count || 0) + 1 }).eq('id', pinId);
      }
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

export async function removeFavorite(userId: string, pinId: string): Promise<void> {
  try {
    const favId = `${userId}_${pinId}`;
    const exists = await isFavorite(userId, pinId);
    if (!exists) return;

    await supabase.from('favorites').delete().eq('id', favId);
    const { data: pin } = await supabase.from('pins').select('favorite_count').eq('id', pinId).maybeSingle();
    if (pin) {
      await supabase.from('pins').update({ favorite_count: Math.max(0, (pin.favorite_count || 0) - 1) }).eq('id', pinId);
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}
