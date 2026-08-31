'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, Clock, Eye, MessageCircle, Share2,
  ChevronLeft, ChevronRight, Zap, Star, Shield, Lock,
  CheckCircle2, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { PinCard } from '@/components/pin-card'
import { CATEGORIES, type Pin } from '@/lib/types'
import { cn } from '@/lib/utils'
import { 
  ShoppingBag, Wrench, Briefcase, HeartHandshake, Building2, Car,
  Search, Home, HandHelping, Key, UserPlus, AlertTriangle, Truck,
  Copy, Check, Fuel, PawPrint
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import { searchUsers } from '@/lib/services/users'
import { deletePin, incrementPinViews, incrementPinClicks, updatePin } from '@/lib/services/pins'
import { supabase } from '@/lib/supabase'
import { logAnalyticsEvent } from '@/lib/services/analytics'
import { toast } from 'sonner'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import TimePicker from '@/components/ui/time-picker'
import { Switch } from '@/components/ui/switch'
import { Trash2, AlertCircle } from 'lucide-react'
import { ChatModal } from '@/components/chat-modal'
import { ReviewSection } from '@/components/review-section'
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Wrench,
  Briefcase,
  HeartHandshake,
  Building2,
  Car,
  Search,
  Home,
  HandHelping,
  Key,
  UserPlus,
  AlertTriangle,
  Truck,
  Fuel,
  PawPrint
}

export function PinDetailClient({ pin, relatedPins }: { pin: Pin, relatedPins: Pin[] }) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const currentUser = user
  const [imgIdx, setImgIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  
  // Hero selection state
  const [searchQuery, setSearchQuery] = useState('')
  const [thankYouMessage, setThankYouMessage] = useState('')
  const [selectedHero, setSelectedHero] = useState<any | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [resolving, setResolving] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isOwner = currentUser?.id === pin.ownerId
  const viewTracked = useRef(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showOnMap, setShowOnMap] = useState<boolean>(pin.showOnMap ?? true)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [displaySchedule, setDisplaySchedule] = useState(pin.displaySchedule ?? { enabled: false, days: [], start: '08:00', end: '17:00' })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Track pin view on mount (once)
  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true
      incrementPinViews(pin.id)
      logAnalyticsEvent(pin.id, 'view')
    }
  }, [pin.id])

  const handlePhoneClick = () => {
    incrementPinClicks(pin.id)
    logAnalyticsEvent(pin.id, 'click')
  }

  const category = CATEGORIES.find((c) => c.id === pin.category)
  const CategoryIcon = category ? ICON_MAP[category.icon] : MapPin

  const handleShare = async () => {
    const shareData = {
      title: pin.title,
      text: t('pinDetail.shareText', {
        title: pin.title,
        district: pin.district,
        province: pin.province,
        price: pin.priceLabel || 'N/A'
      }),
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success(t('pinDetail.linkCopied'), {
          description: t('pinDetail.linkCopiedDesc')
        })
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePin(pin.id)
      toast.success(t('pinDetail.deleteSuccess'))
      router.push('/explore')
    } catch (err) {
      console.error('Error deleting pin:', err)
      toast.error(t('pinDetail.deleteError'))
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCopyPinNumber = () => {
    if (pin.pinNumber) {
      navigator.clipboard.writeText(pin.pinNumber)
      setCopied(true)
      toast.success(t('common.copied') || 'คัดลอกแล้ว')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-zinc-50 to-orange-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navbar isLoggedIn={!!currentUser} className="hidden md:block" />

      {/* Mobile Top Header - Compact Premium */}
      <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-white/95 via-white/90 to-orange-50/95 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-zinc-900/95 backdrop-blur-2xl border-b border-orange-100 dark:border-white/5 px-4 h-16 flex items-center justify-between shadow-lg shadow-orange-100/50 dark:shadow-black/20">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 transition-all shadow-md border border-orange-100 dark:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-900 dark:text-white" />
        </button>
        <div className="flex items-center">
          <div className="w-20 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-white dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center shadow-lg shadow-orange-200/50 dark:shadow-black/30 border border-orange-200 dark:border-white/10 p-1.5 overflow-hidden">
            <img src="/logo1.png" alt="Mudmy" className="w-full h-full object-contain" />
          </div>
        </div>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-lg"
          style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', boxShadow: '0 12px 30px color-mix(in srgb, var(--primary), transparent 80%)' }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <main className="max-w-7xl mx-auto md:px-6 py-0 md:py-12 pb-32">
        {/* Back Button - Premium Style (Desktop) */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all group">
            <div className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            {t('common.back')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-8">
          {/* Left / Main Content */}
          <div className="lg:col-span-2 space-y-0 md:space-y-8">
            {/* Image Gallery - Full Screen Premium Style */}
            <div className="relative md:rounded-[3rem] overflow-hidden bg-white dark:bg-zinc-900 aspect-[3/2] md:aspect-video shadow-2xl shadow-orange-200/50 dark:shadow-black/30 border border-orange-100 dark:border-white/5">
              {pin.images.length > 0 ? (
                <>
                  <img
                    src={pin.images[imgIdx]}
                    alt={pin.title}
                    className="w-full h-full object-cover opacity-100"
                    style={{ filter: 'none', opacity: 1, mixBlendMode: 'normal', backgroundColor: 'white' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'; // Fallback
                    }}
                  />
                  {pin.images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full glass backdrop-blur-md">
                      {pin.images.map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  )}
                  {pin.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIdx((i) => (i - 1 + pin.images.length) % pin.images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass hidden md:flex items-center justify-center hover:bg-white transition-all shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setImgIdx((i) => (i + 1) % pin.images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass hidden md:flex items-center justify-center hover:bg-white transition-all shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <MapPin className="w-16 h-16 opacity-20" />
                  <p className="font-medium">{t('pinDetail.noImages')}</p>
                </div>
              )}
              
              {/* Pin Number Badge - Premium Style */}
              {pin.pinNumber && (
                <button
                  onClick={handleCopyPinNumber}
                  className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-2xl text-white group active:scale-95 transition-all backdrop-blur-sm"
                  style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)' }}
                >
                  <span className="text-xs font-black tracking-wider">#{pin.pinNumber}</span>
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white/80" />}
                </button>
              )}

              {/* Featured Badge - Premium Style */}
              {pin.featured && (
                <div className="absolute top-6 left-6">
                  <Badge className="text-white gap-2 px-5 py-2 rounded-2xl backdrop-blur-sm"
                         style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)', boxShadow: '0 18px 40px color-mix(in srgb, var(--primary), transparent 80%)' }}>
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="font-bold tracking-tight uppercase text-xs">{t('pinCard.featured')}</span>
                  </Badge>
                </div>
              )}
            </div>

            {/* Title & Description Card - Premium Glass Effect */}
            <div className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800/50 md:rounded-[3rem] border-x-0 md:border border-orange-100 dark:border-white/10 p-6 md:p-10 shadow-2xl shadow-orange-200/50 dark:shadow-black/30 space-y-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {pin.priceLabel && (
                    <div className="flex flex-col">
                      <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
                        {pin.priceLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-black text-lg px-4 py-2 rounded-2xl shadow-lg"
                       style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary), var(--background) 94%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 75%)' }}>
                    <Star className="w-5 h-5 fill-current" />
                    {(pin.rating || 0).toFixed(2)}
                    <span className="text-muted-foreground font-bold text-xs">({pin.reviewCount})</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {category && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-300 uppercase tracking-wider shadow-md', 
                          category.bgColor, 
                          category.color,
                        )}
                      >
                        {CategoryIcon && <CategoryIcon className="w-4 h-4 mr-2" />}
                        {t(`categories.${pin.category}`)}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground dark:text-white leading-tight"
                      style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--primary), var(--foreground) 40%), var(--foreground))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    {pin.title}
                  </h1>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-orange-100 dark:border-white/10">
                <h3 className="font-black text-zinc-900 dark:text-white flex items-center gap-3 text-lg">
                  <div className="w-2 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, var(--primary), var(--secondary))', boxShadow: '0 8px 20px color-mix(in srgb, var(--primary), transparent 80%)' }} />
                  {t('pinDetail.description')}
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-base md:text-lg font-medium">
                  {pin.description}
                </p>
              </div>

              <div className="flex items-center gap-6 text-xs font-black text-muted-foreground/80 pt-6 border-t border-orange-100 dark:border-white/10 uppercase tracking-widest">
                <span className="flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md" style={{ background: 'color-mix(in srgb, var(--background), var(--primary) 6%)', borderColor: 'color-mix(in srgb, var(--primary), transparent 80%)' }}>
                  <Eye className="w-4 h-4" style={{ color: 'var(--primary)' }} /> {pin.views} {t('pinDetail.views')}
                </span>
                <span className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md",
                  pin.category === 'emergency' && "text-red-600 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-500/30 animate-pulse"
                )}
                style={{ background: 'color-mix(in srgb, var(--background), var(--primary) 6%)', borderColor: 'color-mix(in srgb, var(--primary), transparent 80%)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} /> 
                  {pin.category === 'emergency' ? (
                    isMounted ? (() => {
                      const diff = new Date(pin.expiresAt).getTime() - Date.now();
                      const mins = Math.max(0, Math.floor(diff / (1000 * 60)));
                      return t('pinCard.emergencyStay', { mins });
                    })() : '...'
                  ) : (
                    `${pin.daysLeft} ${t('pinDetail.daysLeft')}`
                  )}
                </span>
              </div>
            </div>

            {/* Location Section - Premium Style */}
            <div className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800/50 md:rounded-[3rem] p-6 md:p-10 border border-orange-100 dark:border-white/10 shadow-2xl shadow-orange-200/50 dark:shadow-black/30 space-y-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-zinc-900 dark:text-white flex items-center gap-3 text-lg">
                  <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-200/50 dark:shadow-orange-500/30" />
                  {t('pinDetail.location')}
                </h3>
              </div>
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 border border-orange-100 dark:border-white/10 shadow-lg shadow-orange-200/50 dark:shadow-black/20">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', boxShadow: '0 18px 40px color-mix(in srgb, var(--primary), transparent 80%)' }}>
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-lg font-black text-foreground dark:text-white truncate">{pin.address}</p>
                  <p className="text-sm text-muted-foreground font-bold">{pin.district}, {pin.province}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Zap className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="text-xs font-black text-orange-600 uppercase tracking-wider">
                      ขอบเขตพื้นที่ให้บริการ: ภายใน 5 กม.
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 h-56 border border-orange-100 dark:border-white/10 relative group shadow-xl shadow-orange-200/50 dark:shadow-black/30">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80')", filter: 'none', backgroundColor: 'white' }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link href={`/explore?lat=${pin.lat}&lng=${pin.lng}&pin=${pin.id}`}>
                    <Button className="rounded-2xl px-8 h-14 gap-3 text-white font-black transition-all shadow-2xl text-lg"
                            style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', boxShadow: '0 20px 50px color-mix(in srgb, var(--primary), transparent 80%)' }}>
                      <MapPin className="w-6 h-6" />
                      {t('pinDetail.viewOnMap')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Sidebar (Desktop Only) */}
          <div className="hidden lg:block space-y-8">
            {/* Owner Profile Card */}
            <div className={cn(
              "bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-border/40 p-8 shadow-xl shadow-primary/5 space-y-6",
              pin.category === 'emergency' && "animate-border-pulse border-red-500/50"
            )}>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-4 border-white dark:border-zinc-800 shadow-lg">
                    <AvatarImage src={pin.ownerAvatar} />
                    <AvatarFallback className="bg-primary text-white font-black">
                      {pin.ownerName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-zinc-900 rounded-full shadow-sm" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-foreground dark:text-white leading-tight">{pin.ownerName}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {pin.ownerType === 'business' ? 'บัญชีธุรกิจ' : 'บัญชีส่วนบุคคล'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 text-center">
                  <div className="text-xl font-black text-primary">4.8</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('pinDetail.rating')}</div>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 text-center">
                  <div className="text-xl font-black text-zinc-900 dark:text-white">{pin.views}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('pinDetail.views')}</div>
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-3">
                {currentUser ? (
                  <>
                    {pin.contact.phone && (
                      <a href={`tel:${pin.contact.phone}`} className="block" onClick={handlePhoneClick}>
                        <Button className="w-full h-14 rounded-2xl gap-3 bg-primary text-white font-black shadow-lg shadow-primary/20 hover:brightness-105 transition-all">
                          <Phone className="w-5 h-5" />
                          {t('pinDetail.call')}
                        </Button>
                      </a>
                    )}
                    {!isOwner && (
                      <Button 
                        onClick={() => setIsChatOpen(true)}
                        className="w-full h-14 rounded-2xl gap-3 bg-zinc-900 text-white font-black hover:bg-zinc-800 transition-all"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {t('pinDetail.message')}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    className="w-full h-14 rounded-2xl gap-3 bg-muted text-muted-foreground font-black hover:bg-primary hover:text-white transition-all shadow-sm"
                    onClick={() => router.push('/login')}
                  >
                    <Lock className="w-5 h-5" />
                    {t('common.loginToViewAll')}
                  </Button>
                )}
                
                {isMounted && pin.category === 'emergency' && isOwner && (
                  <Dialog
                    modal={false}
                    open={resolveDialogOpen}
                    onOpenChange={(open) => {
                      if (!open) {
                        const activeElement = document.activeElement
                        const isDialogClose = activeElement?.closest('[data-slot="dialog-close"]')
                        if (activeElement?.closest('[data-slot="dialog-content"]') && !isDialogClose) return
                      }
                      setResolveDialogOpen(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full h-14 rounded-2xl gap-3 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 animate-pulse">
                        <Shield className="w-5 h-5 fill-current" />
                        {t('pinDetail.resolveAndRate')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="z-[80] max-h-[85vh] overflow-y-auto rounded-[2.5rem] max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{selectedHero ? t('pinDetail.thankYouHero') || 'ขอบคุณ Hero' : t('pinDetail.whoHelped')}</DialogTitle>
                        <DialogDescription>
                          {selectedHero ? t('pinDetail.thankYouHeroDesc') || 'เขียนข้อความสั้นๆ เพื่อชื่นชมการทำความดี' : t('pinDetail.searchHeroDesc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {!selectedHero ? (
                          <>
                            <Input 
                              placeholder={t('pinDetail.searchHeroPlaceholder')} 
                              value={searchQuery}
                              onChange={e => {
                                setSearchQuery(e.target.value)
                                searchUsers(e.target.value).then(setSearchResults)
                              }}
                              className="rounded-xl"
                            />
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {searchResults.map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => setSelectedHero(u)}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-xl transition-colors"
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback>{u.nickname?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="text-left">
                                    <p className="text-sm font-bold">{u.nickname}</p>
                                    <p className="text-[10px] text-muted-foreground">{u.province || t('pinDetail.provinceNotSpecified')}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="space-y-2 border-t border-border pt-3">
                              <label className="text-sm font-medium text-foreground">
                                {t('pinDetail.thankYouMessage') || 'ข้อความขอบคุณ'}
                              </label>
                              <Textarea
                                placeholder={t('pinDetail.thankYouMessagePlaceholder') || 'ขอบคุณที่เป็นฮีโร่มาช่วยในวันนี้ครับ/ค่ะ'}
                                value={thankYouMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThankYouMessage(e.target.value)}
                                className="resize-none rounded-2xl"
                                rows={3}
                                maxLength={100}
                              />
                              <p className="text-xs text-muted-foreground">
                                เลือกชื่อผู้ช่วยเหลือด้านบน แล้วจึงยืนยันการปิดงาน
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={selectedHero.avatar} />
                                <AvatarFallback>{selectedHero.nickname?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-bold">{selectedHero.nickname}</p>
                                <p className="text-xs text-muted-foreground">{selectedHero.province || t('pinDetail.provinceNotSpecified')}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedHero(null)} className="h-8 rounded-lg text-xs">
                                {t('common.cancel')}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">{t('pinDetail.thankYouMessage') || 'ข้อความขอบคุณ'}</label>
                              <Textarea
                                placeholder={t('pinDetail.thankYouMessagePlaceholder') || 'ขอบคุณที่เป็นฮีโร่มาช่วยในวันนี้ครับ/ค่ะ'}
                                value={thankYouMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThankYouMessage(e.target.value)}
                                className="rounded-2xl resize-none"
                                rows={3}
                                maxLength={100}
                              />
                            </div>
                            <Button
                              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg"
                              disabled={resolving || !thankYouMessage.trim()}
                              onClick={async () => {
                                setResolving(true)
                                try {
                                  const { error } = await supabase.rpc('resolve_emergency_pin', {
                                    p_pin_id: pin.id,
                                    p_hero_id: selectedHero.id,
                                    p_thank_you_message: thankYouMessage,
                                  })
                                  if (error) throw error

                                  toast.success(t('pinDetail.rateHeroSuccess'))
                                  router.push(`/profile/${selectedHero.id}`)
                                } catch (err) {
                                  console.error(err)
                                  toast.error(t('common.error'))
                                } finally {
                                  setResolving(false)
                                }
                              }}
                            >
                              {resolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                              {t('pinDetail.confirmResolve') || 'ยืนยันการปิดงาน'}
                            </Button>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {isMounted && isOwner && (
                  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-2xl gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('pinDetail.deletePin')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl">
                      <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-2">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center">{t('pinDetail.deleteConfirm')}</DialogTitle>
                        <DialogDescription className="text-center text-base leading-relaxed">
                          {t('pinDetail.deleteWarning')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-3 mt-6">
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="h-14 rounded-2xl text-base font-bold shadow-lg shadow-red-200"
                        >
                          {deleting ? t('pinDetail.deleting') : t('pinDetail.confirmDelete')}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Pin visibility settings (owner only) */}
                {isOwner && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">แสดงบนแผนที่</p>
                        <p className="text-xs text-muted-foreground">ปิดเพื่อซ่อนหมุดจากแผนที่ชั่วคราว</p>
                      </div>
                      <Switch checked={showOnMap} onCheckedChange={(v) => setShowOnMap(Boolean(v))} />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button className="flex-1 h-12 rounded-2xl" onClick={() => setScheduleDialogOpen(true)}>ตั้งเวลาแสดง</Button>
                      <Button variant="ghost" className="h-12 rounded-2xl" onClick={async () => {
                        // Save visibility immediately
                        try {
                          await updatePin(pin.id, { showOnMap })
                          toast.success('บันทึกการแสดงเรียบร้อยแล้ว')
                        } catch (err) {
                          console.error(err)
                          toast.error('ไม่สามารถบันทึกได้')
                        }
                      }}>บันทึก</Button>
                    </div>

                    <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                      <DialogContent className="rounded-[2.5rem] max-w-md">
                        <DialogHeader>
                          <DialogTitle>ตั้งค่าการแสดงหมุด</DialogTitle>
                          <DialogDescription>เลือกวันและช่วงเวลาที่ต้องการให้หมุดแสดงบนแผนที่</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">เปิดใช้งานตารางเวลา</p>
                            <Switch checked={displaySchedule?.enabled} onCheckedChange={(v) => setDisplaySchedule((s) => ({ ...(s ?? { enabled: false, days: [], start: '08:00', end: '17:00' }), enabled: Boolean(v) }))} />
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">วัน:</p>
                            <div className="flex flex-wrap gap-2">
                              {['อา','จ','อ','พ','พฤ','ศ','ส'].map((d, i) => {
                                const active = (displaySchedule?.days || []).includes(i)
                                return (
                                  <button key={i} type="button" onClick={() => {
                                    setDisplaySchedule((s) => {
                                      const days = new Set((s?.days) || [])
                                      if (days.has(i)) days.delete(i); else days.add(i)
                                      return { ...(s ?? { enabled: true, days: [], start: '08:00', end: '17:00' }), days: Array.from(days).sort() }
                                    })
                                  }} className={cn('px-3 py-1 rounded-lg border', active ? 'bg-primary text-white' : 'bg-muted/30')}>{d}</button>
                                )
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium">เริ่ม (24 ชม.)</label>
                              <TimePicker value={displaySchedule?.start || '08:00'} onChange={(v) => setDisplaySchedule((s) => ({ ...(s ?? { enabled: true, days: [], start: '08:00', end: '17:00' }), start: v }))} />
                            </div>
                            <div>
                              <label className="text-xs font-medium">สิ้นสุด (24 ชม.)</label>
                              <TimePicker value={displaySchedule?.end || '17:00'} onChange={(v) => setDisplaySchedule((s) => ({ ...(s ?? { enabled: true, days: [], start: '08:00', end: '17:00' }), end: v }))} />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1" onClick={async () => {
                              try {
                                await updatePin(pin.id, { displaySchedule })
                                toast.success('บันทึกตารางเวลาเรียบร้อย')
                                setScheduleDialogOpen(false)
                              } catch (err) {
                                console.error(err)
                                toast.error('ไม่สามารถบันทึกได้')
                              }
                            }}>บันทึก</Button>
                            <Button variant="ghost" className="flex-1" onClick={() => setScheduleDialogOpen(false)}>ยกเลิก</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>

            {/* Owner controls for mobile (show when owner) */}
            {isMounted && isOwner && (
              <div className="md:hidden bg-gradient-to-br from-white via-white to-orange-50/50 rounded-xl p-4 border border-orange-100 dark:border-white/10 shadow-lg shadow-orange-200/30 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold">แสดงบนแผนที่</p>
                    <p className="text-xs text-muted-foreground">ปิดเพื่อซ่อนหมุดจากแผนที่ชั่วคราว</p>
                  </div>
                  <Switch checked={showOnMap} onCheckedChange={(v) => setShowOnMap(Boolean(v))} />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 h-12 rounded-2xl" onClick={() => setScheduleDialogOpen(true)}>ตั้งเวลาแสดง</Button>
                  <Button variant="ghost" className="h-12 rounded-2xl" onClick={async () => {
                    try {
                      await updatePin(pin.id, { showOnMap })
                      toast.success('บันทึกการแสดงเรียบร้อยแล้ว')
                    } catch (err) {
                      console.error(err)
                      toast.error('ไม่สามารถบันทึกได้')
                    }
                  }}>บันทึก</Button>
                </div>
              </div>
            )}

            {/* Complete Review Section */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
              <ReviewSection pinId={pin.id} />
            </div>

            {/* Related Pins Mini Grid */}
            {relatedPins.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-4">{t('pinDetail.relatedPins')}</h2>
                <div className="grid grid-cols-1 gap-4 px-4 md:px-0">
                  {relatedPins.map((p) => <PinCard key={p.id} pin={p} compact />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar - Premium Full Screen Style */}
      {!isOwner && currentUser && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-900 dark:via-zinc-900/95 dark:to-transparent backdrop-blur-2xl border-t border-orange-100 dark:border-white/10 shadow-2xl shadow-orange-200/50 dark:shadow-black/30">
          <div className="flex gap-3">
            <div className="flex-1">
              <Button 
                onClick={() => setIsChatOpen(true)}
                className="w-full h-16 rounded-2xl gap-3 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white font-black shadow-2xl shadow-black/30 active:scale-95 transition-all text-lg"
              >
                <MessageCircle className="w-6 h-6" />
                {t('pinDetail.message')}
              </Button>
            </div>
            {pin.contact.phone && (
              <div>
                <a href={`tel:${pin.contact.phone}`} onClick={handlePhoneClick}>
                  <Button className="w-16 h-16 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all"
                          style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', boxShadow: '0 18px 40px color-mix(in srgb, var(--primary), transparent 80%)' }}>
                    <Phone className="w-6 h-6" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Owner Sticky Bar */}
      {isOwner && currentUser && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] p-3 bg-gradient-to-t from-white/95 to-transparent dark:from-zinc-900/95 backdrop-blur-md border-t border-border/30">
          <div className="flex flex-col gap-2">
            {pin.category === 'emergency' && pin.status !== 'resolved' && (
              <Button
                className="h-12 w-full rounded-2xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700"
                onClick={() => setResolveDialogOpen(true)}
              >
                <Shield className="mr-1.5 h-4 w-4" />
                {t('pinDetail.resolveAndRate')}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">แสดงบนแผนที่</p>
                  </div>
                  <Switch checked={showOnMap} onCheckedChange={(v) => setShowOnMap(Boolean(v))} />
                </div>
              </div>
              <div className="flex-shrink-0 w-32">
                <Button className="w-full h-12 rounded-2xl" onClick={() => setScheduleDialogOpen(true)}>ตั้งเวลาแสดง</Button>
              </div>
              <div className="flex-shrink-0 w-24">
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={async () => {
                  try {
                    await updatePin(pin.id, { showOnMap })
                    toast.success('บันทึกการแสดงเรียบร้อยแล้ว')
                  } catch (err) {
                    console.error(err)
                    toast.error('ไม่สามารถบันทึกได้')
                  }
                }}>บันทึก</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Chat Modal */}
      <ChatModal 
        pin={pin} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  )
}
