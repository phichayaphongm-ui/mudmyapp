import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { User as AppUser } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns The distance between the two points in kilometers
 */
export function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generates a random pin number (2 uppercase letters + 8 digits)
 * Example: PM12345678
 */
export function generatePinNumber(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let result = '';
  // Add 2 random uppercase letters
  for (let i = 0; i < 2; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // Add 8 random digits
  for (let i = 0; i < 8; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

/**
 * Compresses an image file using Canvas for minimum storage size
 */
export async function compressImage(file: File, maxWidth = 800, quality = 0.6): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Parse date from various formats (string, Date object, ISO string)
 */
export function parseDate(dateValue: any): Date {
  if (!dateValue) return new Date(0); // Expired
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') return new Date(dateValue);
  return new Date(dateValue);
}

// ─── Shared: map Supabase users row → AppUser ─────────────────────────────────
// Used by both lib/services/users.ts and contexts/auth-context.tsx
export function mapRowToUser(row: any): AppUser {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    email: row.email,
    avatar: row.avatar,
    phone: row.phone,
    line: row.line,
    facebook: row.facebook,
    bio: row.bio,
    plan: row.plan,
    activePins: row.active_pins ?? 0,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    heroCasesCount: row.hero_cases_count ?? 0,
    heroCases: row.hero_cases ?? [],
    province: row.province,
    fcmToken: row.fcm_token,
    createdAt: row.created_at,
    blockedUsers: row.blocked_users ?? [],
    blockedBy: row.blocked_by ?? [],
    bannedUntil: row.banned_until,
    isPermanentlyBanned: row.is_permanently_banned ?? false,
    banCount: row.ban_count ?? 0,
    banHistory: row.ban_history ?? [],
    userType: row.user_type ?? 'personal',
    businessName: row.business_name,
    businessTaxId: row.business_tax_id,
    businessAddress: row.business_address,
    businessCategory: row.business_category,
    businessPhone: row.business_phone,
    hasUsedFreePin: row.has_used_free_pin ?? false,
    freePinId: row.free_pin_id,
    themeColor: row.theme_color || 'orange',
    profileVisibility: row.profile_visibility === 'private' ? 'private' : 'public',
    showPhone: row.show_phone !== false,
    showEmail: row.show_email !== false,
    showLocation: row.show_location !== false,
    showLine: row.show_line !== false,
    showFacebook: row.show_facebook !== false,
    showPins: row.show_pins !== false,
    showHeroHistory: row.show_hero_history !== false,
    isAdmin: Boolean(row.is_admin) || (typeof row.email === 'string' && row.email.toLowerCase() === 'mudmy.app@gmail.com'),
  };
}
