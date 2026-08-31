import { supabase } from '@/lib/supabase';
import type { Pin, PinCategory } from '@/lib/types';
import { generatePinNumber } from '@/lib/utils';

// ─── Helper: map Supabase row → Pin ──────────────────────────────────────────
function mapRowToPin(row: any): Pin {
  const now = new Date();
  const district = typeof row.district === 'string' ? row.district.trim() : '';
  const province = typeof row.province === 'string' ? row.province.trim() : '';
  const address = typeof row.address === 'string' ? row.address.trim() : '';
  const area = district || province || address;
  let daysLeft = 0;
  let isExpired = false;

  if (row.expires_at) {
    const expiresDate = new Date(row.expires_at);
    const diffTime = expiresDate.getTime() - now.getTime();
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    // Real expiration check (when timestamp is strictly in the past)
    if (diffTime < 0) {
      isExpired = true;
    }
  }

  // Determine status (handle null/paid defaults)
  let calculatedStatus = row.status || 'active';
  
  // Fix incorrect status values - convert 'paid' to 'active'
  if (calculatedStatus === 'paid') {
    calculatedStatus = 'active';
  }
  
  if (isExpired && calculatedStatus === 'active') {
    calculatedStatus = 'expired';
  }

  const latNum = Number(row.lat);
  const lngNum = Number(row.lng);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    images: row.images ?? [],
    contact: row.contact ?? {},
    price: row.price ?? null,
    priceLabel: row.price_label,
    lat: isNaN(latNum) ? row.lat : latNum,
    lng: isNaN(lngNum) ? row.lng : lngNum,
    address,
    district: district || area,
    province: province || area,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    status: calculatedStatus,
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
    showOnMap: row.show_on_map ?? true,
    displaySchedule: row.display_schedule ? row.display_schedule : null,
  };
}

// ─── Strip undefined values from an object ───────────────────────────────────
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj !== 'object') return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = stripUndefined(v);
  }
  return out;
}

export async function getAllPins(category?: PinCategory | 'all', blockedUserIds: string[] = []): Promise<Pin[]> {
  try {
    // Try using DB-side RPC for visibility if available (faster, centralised logic)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_visible_pins');
      if (!rpcErr && rpcData) {
        const pins = (rpcData || []).map(mapRowToPin);
        // apply optional category and blockedUserIds filters client-side
        let filtered = pins;
        if (category && category !== 'all') filtered = filtered.filter((p: { category: string }) => p.category === category);
        if (blockedUserIds.length > 0) filtered = filtered.filter((p: { ownerId: string }) => !blockedUserIds.includes(p.ownerId));
        return filtered;
      }
    } catch (e) {
      // ignore and fallback to client-side query
    }
    const now = new Date().toISOString();
    let query = supabase
      .from('pins')
      .select('*')
      .not('status', 'eq', 'pending_payment')
      .in('status', ['active', 'paid'])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase error in getAllPins:', error);
      throw error;
    }

    const pins = (data || []).map(mapRowToPin);

    // Apply visibility / schedule filtering
    function isPinVisibleNow(pin: Pin) {
      if (pin.showOnMap === false) return false;
      const sched = pin.displaySchedule;
      if (!sched || !sched.enabled) return true;
      try {
        const now = new Date();
        const day = now.getDay(); // 0-6
        if (!sched.days || !sched.days.includes(day)) return false;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        return sched.start <= nowTime && nowTime <= sched.end;
      } catch (e) {
        return true;
      }
    }

    // Filter out pins with invalid coordinates
    const validPins = pins.filter(pin => {
      const isValidLat = typeof pin.lat === 'number' && !isNaN(pin.lat) && pin.lat >= -90 && pin.lat <= 90;
      const isValidLng = typeof pin.lng === 'number' && !isNaN(pin.lng) && pin.lng >= -180 && pin.lng <= 180;
      const isValid = isValidLat && isValidLng;
      
      if (!isValid) {
        console.warn('Invalid coordinates filtered out:', {
          id: pin.id,
          title: pin.title,
          lat: pin.lat,
          lng: pin.lng,
          isValidLat,
          isValidLng
        });
      }
      
      return isValid;
    });

    // Apply visibility/schedule filter
    const visiblePins = validPins.filter(p => isPinVisibleNow(p));

    // Filter out blocked users client-side
    if (blockedUserIds.length > 0) {
      const filtered = visiblePins.filter((p) => !blockedUserIds.includes(p.ownerId));
      return filtered;
    }
    return visiblePins;
  } catch (error) {
    console.error('Error fetching all pins:', error);
    throw error;
  }
}

export async function getPinById(pinId: string): Promise<Pin | null> {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .eq('id', pinId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching pin:', error);
    throw error;
  }
  return data ? mapRowToPin(data) : null;
}

export async function getUserPins(userId: string): Promise<Pin[]> {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user pins:', error);
    throw error;
  }
  
  return (data || []).map(mapRowToPin);
}

export async function getPublicUserPins(userId: string): Promise<Pin[]> {
  const { data, error } = await supabase.rpc('get_public_user_pins', { p_uid: userId });
  if (error) {
    console.error('Error fetching public user pins:', error);
    throw error;
  }
  return (data || []).map(mapRowToPin);
}

export async function getPinByNumber(pinNumber: string): Promise<Pin | null> {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .eq('pin_number', pinNumber.toUpperCase())
    .in('status', ['active', 'paid'])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching pin by number:', error);
    throw error;
  }
  return data ? mapRowToPin(data) : null;
}

export async function createPin(pinData: Omit<Pin, 'id' | 'daysLeft'>): Promise<string> {
  try {
    let finalPinData = { ...pinData };

    // Handle Emergency 30-min auto-delete
    if (pinData.category === 'emergency') {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      finalPinData = {
        ...finalPinData,
        expiresAt,
        price: 0,
        priceLabel: 'FREE (Emergency)',
        featured: true,
      };
    }

    const insertData = stripUndefined({
      title: finalPinData.title,
      category: finalPinData.category,
      description: finalPinData.description,
      images: finalPinData.images ?? [],
      contact: finalPinData.contact ?? {},
      price: finalPinData.price ?? null,
      price_label: finalPinData.priceLabel ?? null,
      lat: finalPinData.lat,
      lng: finalPinData.lng,
      address: finalPinData.address,
      district: finalPinData.district,
      province: finalPinData.province,
      owner_id: finalPinData.ownerId,
      owner_name: finalPinData.ownerName,
      owner_avatar: finalPinData.ownerAvatar ?? null,
      status: finalPinData.status ?? 'active',
      plan: finalPinData.plan ?? 'general',
      featured: finalPinData.featured ?? false,
      hero_id: finalPinData.heroId ?? null,
      thank_you_message: finalPinData.thankYouMessage ?? null,
      views: 0,
      clicks: 0,
      created_at: finalPinData.createdAt ?? new Date().toISOString(),
      expires_at: finalPinData.expiresAt ?? null,
      rating: 0,
      review_count: 0,
      favorite_count: 0,
      pin_number: generatePinNumber(),
      show_on_map: finalPinData.showOnMap ?? true,
      display_schedule: finalPinData.displaySchedule ?? null,
      reports: [],
      radius: finalPinData.radius ?? null,
      owner_type: finalPinData.ownerType ?? 'personal',
      is_free_pin: finalPinData.isFreePin ?? false,
      last_checked_in_at: finalPinData.lastCheckedInAt ?? null,
    });

    const { data, error } = await supabase
      .from('pins')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error creating pin:', error);
      throw error;
    }
    return data.id;
  } catch (error) {
    console.error('Error creating pin:', error);
    throw error;
  }
}

export async function updatePin(pinId: string, updateData: Partial<Pin>): Promise<void> {
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updateData.title !== undefined) update.title = updateData.title;
  if (updateData.category !== undefined) update.category = updateData.category;
  if (updateData.description !== undefined) update.description = updateData.description;
  if (updateData.images !== undefined) update.images = updateData.images;
  if (updateData.contact !== undefined) update.contact = updateData.contact;
  if (updateData.price !== undefined) update.price = updateData.price;
  if (updateData.priceLabel !== undefined) update.price_label = updateData.priceLabel;
  if (updateData.lat !== undefined) update.lat = updateData.lat;
  if (updateData.lng !== undefined) update.lng = updateData.lng;
  if (updateData.address !== undefined) update.address = updateData.address;
  if (updateData.district !== undefined) update.district = updateData.district;
  if (updateData.province !== undefined) update.province = updateData.province;
  if (updateData.status !== undefined) update.status = updateData.status;
  if (updateData.featured !== undefined) update.featured = updateData.featured;
  if (updateData.thankYouMessage !== undefined) update.thank_you_message = updateData.thankYouMessage;
  if (updateData.heroId !== undefined) update.hero_id = updateData.heroId;
  if (updateData.expiresAt !== undefined) update.expires_at = updateData.expiresAt;
  if (updateData.reports !== undefined) update.reports = updateData.reports;
  if (updateData.radius !== undefined) update.radius = updateData.radius;
  if (updateData.ownerType !== undefined) update.owner_type = updateData.ownerType;
  if (updateData.isFreePin !== undefined) update.is_free_pin = updateData.isFreePin;
  if (updateData.lastCheckedInAt !== undefined) update.last_checked_in_at = updateData.lastCheckedInAt;
  if (updateData.ownerAvatar !== undefined) update.owner_avatar = updateData.ownerAvatar;
  if (updateData.ownerName !== undefined) update.owner_name = updateData.ownerName;
  if (updateData.views !== undefined) update.views = updateData.views;
  if (updateData.clicks !== undefined) update.clicks = updateData.clicks;
  if (updateData.rating !== undefined) update.rating = updateData.rating;
  if (updateData.reviewCount !== undefined) update.review_count = updateData.reviewCount;
  if (updateData.favoriteCount !== undefined) update.favorite_count = updateData.favoriteCount;
  if (updateData.pinNumber !== undefined) update.pin_number = updateData.pinNumber;
  if (updateData.showOnMap !== undefined) update.show_on_map = updateData.showOnMap;
  if (updateData.displaySchedule !== undefined) update.display_schedule = updateData.displaySchedule;

  const { error } = await supabase.from('pins').update(update).eq('id', pinId);
  if (error) {
    console.error('Error updating pin:', error);
    throw error;
  }
}

export async function incrementPinViews(pinId: string): Promise<void> {
  try {
    // ✔️ Atomic increment via RPC — no race condition
    const { error } = await supabase.rpc('increment_pin_views', { pin_id: pinId });
    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing pin views:', error);
    // Non-blocking error
  }
}

export async function incrementPinClicks(pinId: string): Promise<void> {
  try {
    // ✔️ Atomic increment via RPC — no race condition
    const { error } = await supabase.rpc('increment_pin_clicks', { pin_id: pinId });
    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing pin clicks:', error);
    // Non-blocking error
  }
}

export async function deletePin(pinId: string): Promise<void> {
  const { error } = await supabase.from('pins').delete().eq('id', pinId);
  if (error) {
    console.error('Error deleting pin:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const getPin = getPinById;

export async function reportPin(
  pinId: string,
  userId: string,
  reason: string = 'other',
  details: string = ''
): Promise<void> {
  // ใช้ RPC report_pin() ที่ทำงาน atomic ใน DB
  // ป้องกัน race condition และรองรับ notifications + auto-ban อัตโนมัติ
  try {
    const { data, error } = await supabase.rpc('report_pin', {
      p_pin_id: pinId,
      p_user_id: userId,
      p_reason: reason,
      p_details: details,
    });

    if (error) {
      if (!error.message?.toLowerCase().includes('already reported')) {
        console.error('Error calling report_pin RPC:', error);
      }
      throw error;
    }

    // data = { success: bool, action: string, message?: string }
    if (data && data.success === false) {
      throw new Error(data.message || 'รายงานไม่สำเร็จ');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already reported')) {
      console.error('Error reporting pin:', error);
    }
    throw error;
  }
}

export async function checkInFreePin(pinId: string): Promise<void> {
  try {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('pins').update({
      last_checked_in_at: now.toISOString(),
      expires_at: newExpiresAt,
      updated_at: now.toISOString(),
    }).eq('id', pinId);

    if (error) throw error;
  } catch (error) {
    console.error('Error checking in pin:', error);
    throw error;
  }
}

export async function renewPaidPin(pinId: string): Promise<void> {
  try {
    const pin = await getPinById(pinId);
    if (!pin) throw new Error('Pin not found');

    const currentExpiresAt = new Date(pin.expiresAt);
    const newExpiresAt = new Date(currentExpiresAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('pins').update({
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    }).eq('id', pinId);

    if (error) throw error;
  } catch (error) {
    console.error('Error renewing pin:', error);
    throw error;
  }
}
