import { supabase } from '@/lib/supabase'
import type { Pin, User } from '@/lib/types'
import { mapRowToUser } from '@/lib/utils'

export const ADMIN_EMAIL = 'mudmy.app@gmail.com'

export function isAdminEmail(email?: string | null) {
  return (email || '').trim().toLowerCase() === ADMIN_EMAIL
}

export type AdminOverview = {
  totalUsers: number
  totalPins: number
  activePins: number
  bannedUsers: number
  newUsersThisMonth: number
  newPinsThisMonth: number
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: users, error: usersError }, { data: pins, error: pinsError }] = await Promise.all([
    supabase.from('users').select('id, created_at, banned_until, is_permanently_banned'),
    supabase.from('pins').select('id, status, created_at'),
  ])

  if (usersError) throw usersError
  if (pinsError) throw pinsError

  const totalUsers = users?.length ?? 0
  const totalPins = pins?.length ?? 0
  const activePins = pins?.filter((pin) => pin.status === 'active').length ?? 0
  const bannedUsers = users?.filter((user) => user.is_permanently_banned || (user.banned_until && new Date(user.banned_until) > new Date())).length ?? 0
  const newUsersThisMonth = users?.filter((user) => user.created_at && new Date(user.created_at) >= new Date(startOfMonth)).length ?? 0
  const newPinsThisMonth = pins?.filter((pin) => pin.created_at && new Date(pin.created_at) >= new Date(startOfMonth)).length ?? 0

  return {
    totalUsers,
    totalPins,
    activePins,
    bannedUsers,
    newUsersThisMonth,
    newPinsThisMonth,
  }
}

export async function getAllAdminUsers(options?: {
  search?: string
  sortBy?: 'created_at' | 'name' | 'rating' | 'active_pins'
  order?: 'asc' | 'desc'
}) {
  const search = (options?.search || '').trim()
  const sortBy = options?.sortBy || 'created_at'
  const order = options?.order || 'desc'

  let query = supabase.from('users').select('*')

  if (search) {
    query = query.or(`name.ilike.%${search}%,nickname.ilike.%${search}%,email.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: order === 'asc' })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map(mapRowToUser)
}

export async function getAllAdminPins(options?: {
  search?: string
  status?: 'all' | 'active' | 'expired' | 'resolved'
  sortBy?: 'created_at' | 'views' | 'clicks' | 'rating' | 'title'
  order?: 'asc' | 'desc'
}) {
  const search = (options?.search || '').trim()
  const status = options?.status || 'all'
  const sortBy = options?.sortBy || 'created_at'
  const order = options?.order || 'desc'

  let query = supabase.from('pins').select('*')

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,owner_name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: order === 'asc' })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    priceLabel: row.price_label,
    reviewCount: row.review_count,
    favoriteCount: row.favorite_count,
    isFreePin: row.is_free_pin,
    showOnMap: row.show_on_map,
    displaySchedule: row.display_schedule,
  })) as Pin[]
}

export async function deletePinByAdmin(pinId: string) {
  const { error } = await supabase.from('pins').delete().eq('id', pinId)
  if (error) throw error
}

export async function banUserByAdmin(userId: string, options?: { permanent?: boolean; days?: number; reason?: string }) {
  const permanent = options?.permanent ?? false
  const days = options?.days ?? 7
  const reason = options?.reason || 'Admin action'

  const { data: current, error: lookupError } = await supabase
    .from('users')
    .select('ban_history, ban_count')
    .eq('id', userId)
    .single()

  if (lookupError) throw lookupError

  const existingHistory = Array.isArray(current?.ban_history) ? current.ban_history : []
  const until = permanent ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('users').update({
    is_permanently_banned: permanent,
    banned_until: until,
    ban_count: (current?.ban_count ?? 0) + 1,
    ban_history: [
      ...existingHistory,
      {
        reason,
        bannedAt: new Date().toISOString(),
        until: until ?? 'permanent',
      },
    ],
  }).eq('id', userId)

  if (error) throw error
}

export async function unbanUserByAdmin(userId: string) {
  const { error } = await supabase.from('users').update({
    is_permanently_banned: false,
    banned_until: null,
  }).eq('id', userId)

  if (error) throw error
}
