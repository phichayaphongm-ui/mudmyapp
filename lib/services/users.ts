import { supabase } from '@/lib/supabase';
import type { User as AppUser, UserPlan, HeroCase } from '@/lib/types';
import { mapRowToUser } from '@/lib/utils';

/** PostgrestError does not serialize with console.error — log useful fields instead. */
export function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    if (e.message) {
      return [e.message, e.code, e.details, e.hint].filter(Boolean).join(' | ');
    }
  }
  return String(error);
}


export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!uid) {
    console.error('Error fetching user profile: User ID is null or undefined');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching user profile:', error);
      throw error;
    }
    return data ? mapRowToUser(data) : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getPublicUserProfile(uid: string): Promise<AppUser | null> {
  if (!uid) return null;
  const { data, error } = await supabase.rpc('get_public_user_profile', { p_uid: uid });
  if (error) {
    console.error('Error fetching public user profile:', formatSupabaseError(error));
    throw error;
  }
  return data ? mapRowToUser(data) : null;
}

export async function createUserProfile(uid: string, data: Partial<AppUser>): Promise<AppUser> {
  const newUser = {
    id: uid,
    name: data.name || 'User',
    nickname: data.nickname || data.name || 'User',
    email: data.email || '',
    avatar: data.avatar ?? null,
    plan: 'general' as UserPlan,
    active_pins: 0,
    rating: 0,
    review_count: 0,
    hero_cases_count: 0,
    province: data.province ?? null,
    created_at: new Date().toISOString(),
    user_type: data.userType || 'personal',
    business_name: data.businessName ?? null,
    business_tax_id: data.businessTaxId ?? null,
    business_address: data.businessAddress ?? null,
    business_category: data.businessCategory ?? null,
    business_phone: data.businessPhone ?? null,
  };

  // Upsert: profile may already exist from the handle_new_user DB trigger on auth signup
  const { data: row, error } = await supabase
    .from('users')
    .upsert(newUser, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', formatSupabaseError(error));
    throw error;
  }
  return mapRowToUser(row);
}

export async function updateUserProfile(uid: string, data: Partial<AppUser>): Promise<void> {
  // Map camelCase → snake_case for Supabase columns
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) update.name = data.name;
  if (data.nickname !== undefined) update.nickname = data.nickname;
  if (data.email !== undefined) update.email = data.email;
  if (data.avatar !== undefined) update.avatar = data.avatar;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.line !== undefined) update.line = data.line;
  if (data.facebook !== undefined) update.facebook = data.facebook;
  if (data.bio !== undefined) update.bio = data.bio;
  if (data.plan !== undefined) update.plan = data.plan;
  if (data.province !== undefined) update.province = data.province;
  if (data.fcmToken !== undefined) update.fcm_token = data.fcmToken;
  if (data.activePins !== undefined) update.active_pins = data.activePins;
  if (data.rating !== undefined) update.rating = data.rating;
  if (data.reviewCount !== undefined) update.review_count = data.reviewCount;
  if (data.heroCasesCount !== undefined) update.hero_cases_count = data.heroCasesCount;
  if (data.heroCases !== undefined) update.hero_cases = data.heroCases;
  if (data.blockedUsers !== undefined) update.blocked_users = data.blockedUsers;
  if (data.blockedBy !== undefined) update.blocked_by = data.blockedBy;
  if (data.bannedUntil !== undefined) update.banned_until = data.bannedUntil;
  if (data.isPermanentlyBanned !== undefined) update.is_permanently_banned = data.isPermanentlyBanned;
  if (data.banCount !== undefined) update.ban_count = data.banCount;
  if (data.banHistory !== undefined) update.ban_history = data.banHistory;
  if (data.userType !== undefined) update.user_type = data.userType;
  if (data.businessName !== undefined) update.business_name = data.businessName;
  if (data.businessTaxId !== undefined) update.business_tax_id = data.businessTaxId;
  if (data.businessAddress !== undefined) update.business_address = data.businessAddress;
  if (data.businessCategory !== undefined) update.business_category = data.businessCategory;
  if (data.businessPhone !== undefined) update.business_phone = data.businessPhone;
  if (data.hasUsedFreePin !== undefined) update.has_used_free_pin = data.hasUsedFreePin;
  if (data.freePinId !== undefined) update.free_pin_id = data.freePinId;
  if (data.themeColor !== undefined) update.theme_color = data.themeColor;
  if (data.profileVisibility !== undefined) update.profile_visibility = data.profileVisibility;
  if (data.showPhone !== undefined) update.show_phone = data.showPhone;
  if (data.showEmail !== undefined) update.show_email = data.showEmail;
  if (data.showLocation !== undefined) update.show_location = data.showLocation;
  if (data.showLine !== undefined) update.show_line = data.showLine;
  if (data.showFacebook !== undefined) update.show_facebook = data.showFacebook;
  if (data.showPins !== undefined) update.show_pins = data.showPins;
  if (data.showHeroHistory !== undefined) update.show_hero_history = data.showHeroHistory;

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', uid);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  // Also sync avatar / owner_name to all pins owned by this user
  if (data.avatar !== undefined || data.name !== undefined || data.nickname !== undefined) {
    const pinUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.avatar !== undefined) pinUpdate.owner_avatar = data.avatar;
    if (data.nickname !== undefined || data.name !== undefined) {
      pinUpdate.owner_name = data.nickname || data.name;
    }
    await supabase.from('pins').update(pinUpdate).eq('owner_id', uid);
  }

  // Sync avatar / name to all conversations this user participates in
  if (data.avatar !== undefined || data.name !== undefined || data.nickname !== undefined) {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, participant_avatars, participant_names')
      .contains('participants', [uid]);

    if (convs && convs.length > 0) {
      const updates = convs.map((conv: any) => {
        const updatedAvatars = { ...(conv.participant_avatars || {}) };
        const updatedNames = { ...(conv.participant_names || {}) };

        if (data.avatar !== undefined) updatedAvatars[uid] = data.avatar ?? '';
        if (data.nickname !== undefined || data.name !== undefined) {
          updatedNames[uid] = data.nickname || data.name || '';
        }

        return supabase
          .from('conversations')
          .update({
            participant_avatars: updatedAvatars,
            participant_names: updatedNames,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conv.id);
      });

      await Promise.all(updates);
    }
  }
}

export async function incrementUserActivePins(uid: string, amount: number = 1): Promise<void> {
  const user = await getUserProfile(uid);
  if (!user) throw new Error('User not found');

  const newActivePins = (user.activePins || 0) + amount;

  const { error } = await supabase
    .from('users')
    .update({
      active_pins: newActivePins,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uid);

  if (error) {
    console.error('Error incrementing active pins:', error);
    throw error;
  }
}

export async function getRankedUsers(
  type: 'seller' | 'hero',
  limitCount: number = 10,
  province?: string
): Promise<AppUser[]> {
  try {
    let query = supabase.from('users').select('*').limit(limitCount);

    if (type === 'seller') {
      if (province) {
        query = query.eq('province', province);
      }
      query = query.order('rating', { ascending: false }).order('review_count', { ascending: false });
    } else {
      query = query.order('hero_cases_count', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRowToUser);
  } catch (error) {
    console.error('Error fetching ranked users:', error);
    return [];
  }
}

export async function addHeroCase(uid: string, caseData: HeroCase): Promise<void> {
  const user = await getUserProfile(uid);
  if (!user) throw new Error('User not found');

  const updatedHeroCases = [...(user.heroCases || []), caseData];

  const { error } = await supabase
    .from('users')
    .update({
      hero_cases_count: (user.heroCasesCount || 0) + 1,
      hero_cases: updatedHeroCases,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uid);

  if (error) {
    console.error('Error adding hero case:', error);
    throw error;
  }
}

export async function searchUsers(searchTerm: string, limitCount: number = 5): Promise<AppUser[]> {
  if (!searchTerm) return [];
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('nickname', `%${searchTerm}%`)
    .limit(limitCount);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }
  return (data || []).map(mapRowToUser);
}

export async function updateFcmToken(uid: string, token: string | null): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ fcm_token: token, updated_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) {
    console.error('Error updating FCM token:', error);
    throw error;
  }
}

export async function toggleBlockUser(myId: string, targetId: string, isBlocked: boolean): Promise<void> {
  const [me, target] = await Promise.all([getUserProfile(myId), getUserProfile(targetId)]);
  if (!me || !target) throw new Error('User not found');

  const myBlocked = me.blockedUsers || [];
  const targetBlockedBy = target.blockedBy || [];

  const newMyBlocked = isBlocked
    ? [...new Set([...myBlocked, targetId])]
    : myBlocked.filter((id) => id !== targetId);

  const newTargetBlockedBy = isBlocked
    ? [...new Set([...targetBlockedBy, myId])]
    : targetBlockedBy.filter((id) => id !== myId);

  const [res1, res2] = await Promise.all([
    supabase.from('users').update({ blocked_users: newMyBlocked, updated_at: new Date().toISOString() }).eq('id', myId),
    supabase.from('users').update({ blocked_by: newTargetBlockedBy, updated_at: new Date().toISOString() }).eq('id', targetId),
  ]);

  if (res1.error || res2.error) {
    console.error('Error toggling block status:', res1.error || res2.error);
    throw res1.error || res2.error;
  }
}

export async function getBlockedUsers(myId: string): Promise<AppUser[]> {
  const me = await getUserProfile(myId);
  if (!me) return [];

  const blockedIds = me.blockedUsers || [];
  if (blockedIds.length === 0) return [];

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', blockedIds);

  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
  return (data || []).map(mapRowToUser);
}
