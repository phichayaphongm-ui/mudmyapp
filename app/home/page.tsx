'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  ArrowRight,
  Sparkles,
  Star,
  MapPin,
  Navigation,
  Sun,
  Moon,
  Bell,
  BellOff,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useNotifications } from '@/contexts/notification-context'
import { 
  getAllPins, 
  getUserPins,
} from '@/lib/services/pins'
import type { Pin } from '@/lib/types'
import { cn, calculateDistanceInKm } from '@/lib/utils'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { PinBottomSheet } from '@/components/pin-bottom-sheet'
import { AIAuditModal } from '@/components/ai/AIAuditModal'
import { CommunityTicker } from '@/components/home/CommunityTicker'
import { WelcomeModal } from '@/components/home/WelcomeModal'
import type { AIAuditResult } from '@/lib/services/ai'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function RecommendedPinCard({ pin, distance, onClick }: { pin: Pin; distance?: number | null; onClick?: (pin: Pin) => void }) {
  const cover = pin.images?.[0] || '/placeholder.jpg'
  const badge = pin.rating >= 4.5 ? 'ยอดนิยม' : 'แนะนำ'
  const [minsRemaining, setMinsRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (pin.category === 'emergency' && pin.expiresAt) {
      const calc = () => {
        const expiryDate = (pin.expiresAt as any)?.toDate ? (pin.expiresAt as any).toDate() : new Date(pin.expiresAt);
        const diff = expiryDate.getTime() - Date.now();
        setMinsRemaining(Math.max(0, Math.floor(diff / (1000 * 60))));
      };
      calc();
      const timer = setInterval(calc, 60000);
      return () => clearInterval(timer);
    }
  }, [pin.category, pin.expiresAt]);
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(pin)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="mudmy-pin-card min-w-[156px] max-w-[156px] overflow-hidden rounded-[1.35rem] bg-card border border-border/70 shadow-sm cursor-pointer"
    >
      <div className="relative aspect-[1.08/1]">
        <img 
          src={cover} 
          alt={pin.title} 
          className="h-full w-full object-cover" 
          referrerPolicy="no-referrer" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'; // Fallback
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        {/* Top Badge */}
        <div className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[8px] font-bold text-white shadow flex items-center gap-1">
          <Star className="w-2 h-2 fill-current" />
          {badge}
        </div>

        {/* Emergency Badge - Top Center */}
        {pin.category === 'emergency' && (
          <div className="absolute top-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <div className="bg-red-600/90 backdrop-blur-md text-[7px] text-white font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 animate-pulse whitespace-nowrap">
              ช่วยด่วน: อีก {minsRemaining ?? '...'} นาที
            </div>
          </div>
        )}

        {distance !== undefined && distance !== null && (
          <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-black text-white border border-white/10 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-primary" />
            {distance.toFixed(1)} km
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-xs font-black text-foreground line-clamp-1">{pin.title}</div>
        <div className="mt-1 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground truncate max-w-[84px]">
            {pin.district}
          </div>
          <div className="flex items-center gap-0.5 text-[10px] font-black text-orange-500">
            <Star className="w-2 h-2 fill-current" />
            {pin.rating.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}

function NearbyPinCard({ pin, distance, onClick }: { pin: Pin; distance: number; onClick?: (pin: Pin) => void }) {
  const cover = pin.images?.[0] || '/placeholder.jpg'
  const [minsRemaining, setMinsRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (pin.category === 'emergency' && pin.expiresAt) {
      const calc = () => {
        const expiryDate = (pin.expiresAt as any)?.toDate ? (pin.expiresAt as any).toDate() : new Date(pin.expiresAt);
        const diff = expiryDate.getTime() - Date.now();
        setMinsRemaining(Math.max(0, Math.floor(diff / (1000 * 60))));
      };
      calc();
      const timer = setInterval(calc, 60000);
      return () => clearInterval(timer);
    }
  }, [pin.category, pin.expiresAt]);
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(pin)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="mudmy-pin-card min-w-[156px] max-w-[156px] overflow-hidden rounded-[1.35rem] bg-card border border-border/70 shadow-sm cursor-pointer"
    >
      <div className="relative aspect-[1.08/1]">
        <img 
          src={cover} 
          alt={pin.title} 
          className="h-full w-full object-cover" 
          referrerPolicy="no-referrer" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'; // Fallback
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        {/* Top Badge */}
        <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[8px] font-bold text-white shadow flex items-center gap-1">
          <Navigation className="w-2 h-2 fill-current" />
          ใกล้ตัว
        </div>

        {/* Emergency Badge - Top Center */}
        {pin.category === 'emergency' && (
          <div className="absolute top-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <div className="bg-red-600/90 backdrop-blur-md text-[7px] text-white font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 animate-pulse whitespace-nowrap">
              ช่วยด่วน: อีก {minsRemaining ?? '...'} นาที
            </div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-black text-white border border-white/10 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-primary" />
          {distance.toFixed(1)} km
        </div>
      </div>
      <div className="p-2.5">
        <div className="text-xs font-black text-foreground line-clamp-1">{pin.title}</div>
        <div className="mt-1 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground truncate max-w-[84px]">
            {pin.district}
          </div>
          <div className="flex items-center gap-0.5 text-[10px] font-black text-orange-500">
            <Star className="w-2 h-2 fill-current" />
            {pin.rating.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { permission, isEnabled, toggleNotifications } = useNotifications()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const [query, setQuery] = useState('')
  const [pins, setPins] = useState<Pin[]>([])
  const [loadingPins, setLoadingPins] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)

  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const HERO_IMAGES = [
    '/images/Hero/Hero1.jpg',
    '/images/Hero/Hero2.jpg',
    '/images/Hero/Hero3.jpg',
    '/images/Hero/Hero4.jpg',
    '/images/Hero/Hero5.jpg',
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [HERO_IMAGES.length])

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<AIAuditResult | null>(null)

  useEffect(() => {
    // Get user location
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        },
        (err) => {
          // GeolocationPositionError doesn't stringify well, so we log specific info
          let errorMsg = 'Unknown location error';
          switch(err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'User denied location access';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location information is unavailable';
              break;
            case err.TIMEOUT:
              errorMsg = 'Location request timed out';
              break;
          }
          console.warn(`[Geolocation] ${errorMsg}`, err.message);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      )
    }
  }, []) // Get location once on mount

  useEffect(() => {
    const fetchPins = async () => {
      setLoadingPins(true)
      try {
        const excludeIds = [...(user?.blockedUsers || []), ...(user?.blockedBy || [])]
        const fetched = await getAllPins('all', excludeIds)
        // จัดลำดับตาม Rating สูงสุด
        const sorted = [...fetched].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        setPins(sorted)
      } catch (e) {
        console.error('Failed to load pins for home', e)
        setPins([])
      } finally {
        setLoadingPins(false)
      }
    }
    if (user) fetchPins()
  }, [user, user?.id, user?.blockedUsers, user?.blockedBy])

  const recommendedPins = useMemo(() => {
    const sliced = pins.slice(0, 8);
    if (!userLocation) return sliced.map(pin => ({ pin, distance: null }));
    
    return sliced.map(pin => ({
      pin,
      distance: calculateDistanceInKm(userLocation.lat, userLocation.lng, pin.lat, pin.lng)
    }));
  }, [pins, userLocation])

  const nearbyPins = useMemo(() => {
    if (!userLocation || pins.length === 0) return []
    
    return pins
      .map(pin => ({
        pin,
        distance: calculateDistanceInKm(userLocation.lat, userLocation.lng, pin.lat, pin.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8)
  }, [pins, userLocation])

  const filteredResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return pins.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.pinNumber?.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.province.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [pins, query])

  const handleStartAudit = async () => {
    if (!user) return
    setIsAuditModalOpen(true)
    setAuditLoading(true)
    try {
      // Fetch user's own pins for analysis
      const userPins = await getUserPins(user.id)
      
      const response = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pins: userPins })
      })
      
      if (!response.ok) throw new Error('Audit failed')
      const result = await response.json()
      setAuditResult(result)
    } catch (e) {
      console.error('Audit failed', e)
    } finally {
      setAuditLoading(false)
    }
  }

  const ACTIONS = [
    { id: 'sell', title: t('categories.sell'), image: '/images/Bottom/1.ขายสินค้า.png', href: '/explore?category=sell' },
    { id: 'service', title: t('categories.service'), image: '/images/Bottom/2.รับจ้าง.png', href: '/explore?category=service' },
    { id: 'marketplace', title: t('categories.marketplace'), image: '/images/Bottom/3.ร้านค้าร้านอาหาร.png', href: '/explore?category=marketplace' },
    { id: 'jobs', title: t('categories.jobs'), image: '/images/Bottom/4.หาคนหางาน.png', href: '/explore?category=jobs' },
    { id: 'taxi', title: t('categories.taxi'), image: '/images/Bottom/5.วินและแท๊กซี่.png', href: '/explore?category=taxi' },
    { id: 'property', title: t('categories.property'), image: '/images/Bottom/6.บ้านและที่ดิน.png', href: '/explore?category=property' },
    { id: 'fuel_ev', title: t('categories.fuel_ev'), image: '/images/Bottom/7..ปั๊มน้ำมันและEV.png', href: '/explore?category=fuel_ev' },
    { id: 'events', title: t('categories.events'), image: '/images/Bottom/8.Eventกิจกรรม.png', href: '/explore?category=events' },
    { id: 'news', title: t('categories.news'), image: '/images/Bottom/9.ข่าวสารในชุมชน.png', href: '/explore?category=news' },
    { id: 'emergency', title: t('categories.emergency'), image: '/images/Bottom/10.เหตุฉุกเฉิน.png', href: '/explore?category=emergency' },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        {t('common.loading') || 'Loading...'}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full rounded-3xl border border-border bg-card p-6 text-center">
          <div className="text-lg font-black text-foreground">{t('login.requiredTitle') || 'Login Required'}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t('login.requiredDesc') || 'Please login to view home and recommendations'}</p>
          <Link
            href="/login"
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center rounded-2xl py-3 text-sm font-black text-primary-foreground",
              "bg-gradient-to-r from-primary via-secondary to-primary",
              "shadow-lg shadow-primary/15 hover:brightness-[1.03] transition-all"
            )}
          >
            {t('common.login') || 'Login'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mudmy-app-shell min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 pt-2 pb-28 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="mudmy-home-header sticky top-0 z-40 -mx-4 px-4 pt-2 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="shrink-0 group">
            <div className="w-28 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary/8 group-hover:shadow-primary/20 transition-all duration-300 border border-primary/10 overflow-hidden p-1.5">
              <img 
                src="/logo1.png" 
                alt="Mudmy Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Notification Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl w-9 h-9 p-0 hover:bg-muted/60 active:scale-95 relative transition-all"
              onClick={toggleNotifications}
              title={isEnabled ? 'Disable Notifications' : 'Enable Notifications'}
            >
              {isEnabled && permission === 'granted' ? (
                <Bell className="h-[18px] w-[18px] text-primary" />
              ) : (
                <BellOff className="h-[18px] w-[18px] text-muted-foreground" />
              )}
              {permission === 'default' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Button>

            {/* Language Switcher */}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-xl w-9 h-9 p-0 font-bold text-lg hover:bg-muted/60 active:scale-95 transition-all">
                    <span>{lang === 'th' ? '🇹🇭' : '🇺🇸'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-1 animate-scale-in">
                  <DropdownMenuItem 
                    onClick={() => setLang('th')}
                    className={cn("rounded-xl cursor-pointer gap-2", lang === 'th' && "bg-primary/10 text-primary font-bold")}
                  >
                    <span className="text-lg">🇹🇭</span> ภาษาไทย
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLang('en')}
                    className={cn("rounded-xl cursor-pointer gap-2", lang === 'en' && "bg-primary/10 text-primary font-bold")}
                  >
                    <span className="text-lg">🇺🇸</span> English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="w-9 h-9" />
            )}

            {/* Theme Toggle */}
            {mounted ? (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-xl w-9 h-9 p-0 transition-all duration-300 active:scale-95",
                  "bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/15 hover:to-secondary/15"
                )}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
              </Button>
            ) : (
              <div className="w-9 h-9" />
            )}

            {/* Profile Avatar */}
            <Link
              href={user ? `/profile/${user.id}` : '/login'}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 overflow-hidden flex items-center justify-center hover:from-muted/80 hover:to-muted/70 transition-all shadow-sm ml-0.5 active:scale-95"
              aria-label={t('navbar.profile') || "โปรไฟล์"}
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-user.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-[18px] h-[18px] text-primary" />
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder') || "ค้นหาหมุดหมาย หรือบริการ..."}
              className={cn(
                'w-full h-12 rounded-[1.5rem] pl-11 pr-4 text-sm font-medium',
                'bg-card/95 border border-border/60 outline-none shadow-sm',
                'focus:bg-card focus:border-primary/30 focus:ring-2 focus:ring-primary/5 transition-all',
                'placeholder:text-muted-foreground/60'
              )}
            />
          </div>
        </div>
        </div>

        {/* Search Results Overlay */}
        {query.trim() !== '' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                {t('common.searchResults') || 'ผลการค้นหา'} ({filteredResults.length})
              </h2>
              <button 
                onClick={() => setQuery('')}
                className="text-xs font-bold text-primary"
              >
                {t('common.clearSearch') || 'ล้างการค้นหา'}
              </button>
            </div>
            
            {filteredResults.length > 0 ? (
              <div className="grid gap-3">
                {filteredResults.map((pin) => (
                  <Link
                    key={pin.id}
                    href={`/pin/${pin.id}`}
                    className="flex gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 transition-all"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <img 
                        src={pin.images?.[0] || '/placeholder.jpg'} 
                        alt={pin.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'; // Fallback
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-sm font-black text-foreground line-clamp-1">{pin.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{pin.address}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {pin.pinNumber || 'MUD-000'}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {pin.district}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-bold text-foreground">{t('common.noResults') || 'ไม่พบข้อมูลที่ค้นหา'}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('common.tryOtherSearch') || 'ลองใช้คำค้นหาอื่น หรือตรวจสอบหมายเลขหมุด'}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-dashed border-border">
              <Link 
                href={`/explore?q=${encodeURIComponent(query)}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-muted/50 text-xs font-black text-muted-foreground hover:bg-muted transition-colors"
              >
                {t('common.viewAllOnMap') || 'ดูผลลัพธ์ทั้งหมดบนแผนที่'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {query.trim() === '' && (
          <>
            {/* Hero Banner */}
            <div
              className={cn(
                "mt-4 rounded-[1.5rem] text-white aspect-[1688/1125] overflow-hidden relative group shadow-xl shadow-primary/8",
                "ring-1 ring-black/5 mudmy-hero-card"
              )}
            >
              {/* Background Image Slider */}
              {HERO_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                    activeHeroIndex === idx ? "opacity-100" : "opacity-0"
                  )}
                >
                  <img
                    src={img}
                    alt={`Hero ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-5 pt-16">
                <div className="max-w-[260px]">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">Local map market</p>
                  <h1 className="mt-1 text-2xl font-black leading-tight">หมุดหมายใกล้บ้านคุณ</h1>
                  <p className="mt-1 text-xs leading-relaxed text-white/75">ค้นหาของกิน งาน บริการ และโอกาสรอบตัวบนแผนที่เดียว</p>
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {HERO_IMAGES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === activeHeroIndex ? "w-4 bg-primary" : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Action Button - Moved outside to prevent blocking image content */}
            <div className="mt-4 px-4 lg:px-0">
              <button
                onClick={() => router.push('/explore')}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-[1.5rem] w-full py-3.5 text-sm font-black transition-all",
                  "fancy-button fancy-button-shimmer-auto",
                  "text-white active:scale-[0.98] lg:max-w-sm"
                )}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                {t('landing.startButton') || 'Get Started'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

        {/* Services */}
        <div className="mt-6 px-1 lg:max-w-5xl">
          <div className="mudmy-section-title flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              {t('marketplace.servicesTitle') || 'Services'} <span className="text-primary text-[10px] px-2 py-0.5 bg-primary/10 rounded-lg">MUDMY</span>
            </h2>
            <Link href="/explore" className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
              {t('common.viewAll') || 'View All'}
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-x-2 gap-y-3">
            {ACTIONS.map((a) => {
              return (
                <Link
                  key={a.title}
                  href={a.href}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    'w-full aspect-square rounded-[1.25rem] flex items-center justify-center transition-all duration-300',
                    'bg-white border border-zinc-100 dark:border-white/15 shadow-sm',
                    'group-hover:shadow-lg group-hover:shadow-primary/15 group-hover:-translate-y-1 group-hover:scale-105',
                    'relative overflow-hidden active:scale-95'
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={a.image} 
                      alt={a.title}
                      className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="text-[9px] min-h-[20px] font-bold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                    {a.title}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <CommunityTicker />

        {/* AI Promo card */}
          <div className="mt-5 rounded-[1.5rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-stone-950 text-white p-4.5 border border-white/10 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between text-[9px] font-black tracking-wide">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-white/90">
              <Sparkles className="w-3 h-3" /> AI IDENTITY SYNC
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-200">
              FREE AUDIT
            </span>
          </div>

          <div className="mt-2.5 text-base font-black">
            สแกนระดับความพร้อมให้รับคุณภาพ AI
          </div>
          <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
            ทดลองประเมินความพร้อมของคุณด้วย AI (ตัวอย่าง UI) แล้วรับคำแนะนำเบื้องต้นแบบเข้าใจง่าย
          </p>

          <button
            onClick={handleStartAudit}
            className={cn(
              "mt-3 w-full rounded-[1.25rem] py-3 text-sm font-black",
              "bg-gradient-to-r from-primary via-secondary to-primary",
              "shadow-lg shadow-primary/15",
              "hover:brightness-[1.03] active:scale-[0.98] transition-all"
            )}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              เริ่มต้นวิเคราะห์ความพร้อมของ AI ฟรี
            </span>
          </button>
        </div>

        {/* Recommended */}
        <div className="mt-5">
          <div className="mudmy-section-title flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-foreground">{t('landing.recommendedTitle') || 'Recommended'}</h2>
            <Link href="/explore" className="text-[11px] font-bold text-muted-foreground hover:text-foreground">
              {t('common.viewMore') || 'View More'}
            </Link>
          </div>

          <div className="mudmy-scroll-snap mt-3 flex gap-3 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingPins ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[150px] max-w-[150px] rounded-2xl bg-muted animate-pulse h-[150px]" />
                ))}
              </>
            ) : (
              recommendedPins.map(({ pin, distance }) => (
                <RecommendedPinCard 
                  key={pin.id} 
                  pin={pin} 
                  distance={distance} 
                  onClick={(p) => setSelectedPin(p)}
                />
              ))
            )}
          </div>
        </div>

        {/* Nearby Pins */}
        {nearbyPins.length > 0 && (
          <div className="mt-7">
            <div className="mudmy-section-title flex items-center justify-between px-1">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                หมุดใกล้ตัว <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-lg uppercase">Nearby</span>
              </h2>
              <Link href="/explore" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                {t('common.viewMore') || 'View More'}
              </Link>
            </div>

            <div className="mudmy-scroll-snap mt-4 flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nearbyPins.map(({ pin, distance }) => (
                <NearbyPinCard 
                  key={pin.id} 
                  pin={pin} 
                  distance={distance} 
                  onClick={(p) => setSelectedPin(p)}
                />
              ))}
            </div>
          </div>
        )}
      </>
    )}

    {/* Pin Detail Bottom Sheet */}
    <PinBottomSheet 
      pin={selectedPin} 
      onClose={() => setSelectedPin(null)} 
    />
  </main>

      <MobileBottomNav />

      {/* Modals */}
      <WelcomeModal 
        isOpen={isWelcomeModalOpen} 
        onClose={() => setIsWelcomeModalOpen(false)} 
      />

      <AIAuditModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
        loading={auditLoading}
        result={auditResult}
      />
    </div>
  )
}
