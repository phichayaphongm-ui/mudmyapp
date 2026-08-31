export type PinCategory =
  | 'sell'
  | 'service'
  | 'marketplace'
  | 'jobs'
  | 'taxi'
  | 'property'
  | 'fuel_ev'
  | 'events'
  | 'news'
  | 'emergency'
  | 'lodging'
  | 'pets'

export type PinStatus = 'active' | 'expired' | 'pending_payment' | 'resolved'

export type UserPlan = 'general' | 'enterprise'

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface HeroCase {
  pinId: string
  title: string
  description: string
  category: PinCategory
  helpedAt: string
  district: string
  province: string
  thankedBy?: string
  thankYouMessage?: string
}

export interface User {
  id: string
  name: string
  nickname?: string
  email: string
  avatar?: string
  phone?: string
  line?: string
  facebook?: string
  bio?: string
  plan: UserPlan
  activePins: number
  rating: number
  reviewCount: number
  heroCasesCount: number
  heroCases?: HeroCase[]
  province?: string // For ranking by province
  fcmToken?: string | null
  createdAt: string
  blockedUsers?: string[]
  blockedBy?: string[]
  bannedUntil?: string
  isPermanentlyBanned?: boolean
  banCount?: number
  banHistory?: {
    reason: string
    bannedAt: string
    until: string
  }[]
  // Dual registration fields
  userType: 'personal' | 'business'
  businessName?: string
  businessTaxId?: string
  businessAddress?: string
  businessCategory?: string
  businessPhone?: string
  // Free pin system
  hasUsedFreePin?: boolean
  freePinId?: string
  themeColor?: string
  profileVisibility?: 'public' | 'private'
  showPhone?: boolean
  showEmail?: boolean
  showLocation?: boolean
  showLine?: boolean
  showFacebook?: boolean
  showPins?: boolean
  showHeroHistory?: boolean
  isAdmin?: boolean
}

export interface Pin {
  id: string
  title: string
  category: PinCategory
  description: string
  images: string[]
  contact: {
    phone?: string | null
    line?: string | null
    facebook?: string | null
  }
  price?: number | null
  priceLabel?: string
  lat: number
  lng: number
  address: string
  district: string
  province: string
  ownerId: string
  ownerName: string
  ownerAvatar?: string
  status: PinStatus
  plan: UserPlan
  featured?: boolean
  heroId?: string
  thankYouMessage?: string
  views: number
  clicks: number
  createdAt: string
  expiresAt: string
  daysLeft: number
  rating: number
  reviewCount: number
  favoriteCount: number;
  pinNumber?: string // Short random number for easy search
  reports?: string[];
  radius?: number;
  ownerType?: 'personal' | 'business';
  // Free pin system
  isFreePin?: boolean;
  lastCheckedInAt?: string;
  // Visibility / scheduling
  showOnMap?: boolean;
  displaySchedule?: {
    enabled: boolean;
    days: number[]; // 0 = Sunday .. 6 = Saturday
    start: string; // e.g. '08:00'
    end: string;   // e.g. '17:00'
  } | null;
}

export interface Review {
  id: string
  pinId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  images?: string[]
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  pinId?: string
  amount: number
  status: PaymentStatus
  method: 'promptpay'
  promptpayRef?: string
  createdAt: string
  paidAt?: string
}

export interface CategoryInfo {
  id: PinCategory
  label: string
  labelEn: string
  icon: string
  color: string
  bgColor: string
}

export interface Message {
  id: string
  conversationId?: string
  senderId: string
  senderName: string
  senderAvatar?: string
  text: string
  image?: string // URL of the compressed image
  createdAt: string
}

export interface Conversation {
  id: string
  participants: string[]
  participantNames: Record<string, string>
  participantAvatars: Record<string, string>
  pinId: string
  pinTitle: string
  lastMessage: string
  lastMessageAt: string
  updatedAt: string
  unreadCount?: Record<string, number>
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'sell', label: 'ขายสินค้า', labelEn: 'Sell', icon: 'ShoppingBag', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { id: 'service', label: 'รับจ้าง', labelEn: 'Services', icon: 'Wrench', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  { id: 'marketplace', label: 'ร้านค้าร้านอาหาร', labelEn: 'Marketplace', icon: 'Store', color: 'text-sky-600', bgColor: 'bg-sky-50 border-sky-200' },
  { id: 'jobs', label: 'หาคนหางาน', labelEn: 'Jobs', icon: 'Briefcase', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  { id: 'taxi', label: 'วินและแท๊กซี่', labelEn: 'Taxi / Win', icon: 'Car', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200' },
  { id: 'property', label: 'บ้านและที่ดิน', labelEn: 'Property', icon: 'Home', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
  { id: 'fuel_ev', label: 'ปั๊มน้ำมันและEV', labelEn: 'Fuel/EV', icon: 'Fuel', color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' },
  { id: 'events', label: 'Eventกิจกรรม', labelEn: 'Events', icon: 'Calendar', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { id: 'news', label: 'ข่าวสารในชุมชน', labelEn: 'Community News', icon: 'Newspaper', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
  { id: 'emergency', label: 'เหตุฉุกเฉิน', labelEn: 'Emergency', icon: 'AlertTriangle', color: 'text-red-600', bgColor: 'bg-red-50 border-red-300 animate-pulse' },
  { id: 'lodging', label: 'ที่พัก', labelEn: 'Accommodation', icon: 'Building2', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200' },
  { id: 'pets', label: 'สัตว์เลี้ยง', labelEn: 'Pets', icon: 'PawPrint', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200' },
]
