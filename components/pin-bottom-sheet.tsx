'use client'

import Link from 'next/link'
import {
  X, MapPin, Phone, Clock, Eye, ChevronLeft, ChevronRight, Star, Zap, MessageCircle, Share2, Heart, Lock,
  ShoppingBag, Wrench, Briefcase, HeartHandshake, Building2, Car,
  Search, Home, HandHelping, Key, UserPlus, AlertTriangle, Truck, Sparkles, Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Pin } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef, useMemo } from 'react'
import { isFavorite, toggleFavorite } from '@/lib/services/favorites'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { ChatModal } from '@/components/chat-modal'
import { incrementPinViews, incrementPinClicks } from '@/lib/services/pins'
import { logAnalyticsEvent } from '@/lib/services/analytics'
import { ReviewSection } from '@/components/review-section'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { reportPin } from '@/lib/services/pins'

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
  Truck
}

interface PinBottomSheetProps {
  pin: Pin | null
  onClose: () => void
}

function GlassButton({
  onClick,
  label,
  className,
  children,
}: {
  onClick?: () => void
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        'bg-black/35 backdrop-blur-xl border border-white/20',
        'shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
        'hover:bg-black/50 hover:scale-105 active:scale-95 transition-all',
        className
      )}
    >
      {children}
    </button>
  )
}

export function PinBottomSheet({ pin, onClose }: PinBottomSheetProps) {
  const { t } = useLanguage()
  const { user, isBanned } = useAuth()
  const banStatus = isBanned()
  const [isLiked, setIsLiked] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('other')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const isOwner = user?.id === pin?.ownerId
  const viewTracked = useRef<string | null>(null)

  const images = useMemo(() => {
    if (!pin) return []
    if (Array.isArray(pin.images)) {
      return pin.images.filter((img) => typeof img === 'string' && img.length > 0)
    }
    if (typeof pin.images === 'string' && (pin.images as string).startsWith('http')) {
      return [pin.images as unknown as string]
    }
    return []
  }, [pin])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setImgIdx(0)
  }, [pin?.id])

  useEffect(() => {
    if (user && pin && viewTracked.current !== pin.id) {
      viewTracked.current = pin.id
      isFavorite(user.id, pin.id).then(setIsLiked)
      incrementPinViews(pin.id)
      logAnalyticsEvent(pin.id, 'view')
    } else if (user && pin) {
      isFavorite(user.id, pin.id).then(setIsLiked)
    }
  }, [user, pin])

  const handlePhoneClick = () => {
    if (pin) {
      incrementPinClicks(pin.id)
      logAnalyticsEvent(pin.id, 'click')
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      toast.error(t('pinDetail.loginToLike'))
      return
    }
    if (banStatus.banned) {
      toast.error(t('common.banWarning'))
      return
    }
    try {
      const newState = await toggleFavorite(user.id, pin!.id)
      setIsLiked(newState)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = () => {
    if (!pin) return
    const url = window.location.origin + `/pin/${pin.id}`
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        text: pin.description,
        url,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(url)
      toast.success(t('pinDetail.linkCopied'))
    }
  }

  if (!pin) return null

  const category = CATEGORIES.find((c) => c.id === pin.category)
  const CategoryIcon = category && ICON_MAP[category.icon] ? ICON_MAP[category.icon] : MapPin
  const imageUrl = images[imgIdx] || null
  const timeLabel = !mounted
    ? '...'
    : pin.category === 'emergency'
      ? (() => {
          const diff = new Date(pin.expiresAt).getTime() - Date.now()
          const mins = Math.max(0, Math.floor(diff / (1000 * 60)))
          return t('pinCard.emergencyStay', { mins })
        })()
      : pin.daysLeft > 0
        ? `${t('pinDetail.daysLeft')} ${pin.daysLeft}`
        : t('pinDetail.expired')

  return (
    <>
      <div
        className={cn(
          'fixed z-[60] flex flex-col bg-zinc-50 dark:bg-zinc-950',
          'inset-0 h-[100dvh]',
          'md:inset-auto md:top-16 md:right-0 md:bottom-0 md:h-auto md:w-[440px] md:border-l md:border-white/10',
          'animate-slide-up md:animate-none'
        )}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Hero */}
          <div className="relative h-[42vh] min-h-[280px] max-h-[420px] md:h-[280px] md:min-h-0 md:max-h-none bg-zinc-900 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={pin.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/logo2.png'
                  target.classList.add('object-contain', 'p-16', 'opacity-30')
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
                <CategoryIcon className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/20 to-black/45 dark:from-zinc-950 dark:via-zinc-950/30 dark:to-black/55" />

            <div
              className="absolute top-0 left-0 right-0 flex items-start justify-between px-4 pt-[max(0.85rem,env(safe-area-inset-top))]"
            >
              <GlassButton onClick={onClose} label={t('pinDetail.close')}>
                <X className="w-5 h-5 text-white" />
              </GlassButton>
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handleFavorite}
                  label={t('pinDetail.loginToLike')}
                  className={isLiked ? 'bg-rose-500/90 border-rose-300/40' : undefined}
                >
                  <Heart className={cn('w-[18px] h-[18px] text-white', isLiked && 'fill-white')} />
                </GlassButton>
                <GlassButton onClick={handleShare} label="Share">
                  <Share2 className="w-[18px] h-[18px] text-white" />
                </GlassButton>
              </div>
            </div>

            <div className="absolute bottom-14 left-4 right-4 flex items-end justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white bg-white/15 backdrop-blur-xl border border-white/25">
                    <CategoryIcon className="w-3.5 h-3.5" />
                    {t(`categories.${pin.category}`)}
                  </span>
                )}
                {pin.pinNumber && (
                  <span className="px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-[0.16em] text-white/90 bg-black/35 backdrop-blur-xl border border-white/15">
                    #{pin.pinNumber}
                  </span>
                )}
                {pin.featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-primary/90 shadow-lg shadow-primary/30">
                    <Zap className="w-3 h-3" /> {t('pinCard.featured')}
                  </span>
                )}
                {pin.isFreePin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white bg-emerald-500/90">
                    <Sparkles className="w-3 h-3" />
                    {t('createPin.payment.free')}
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium text-white/90 bg-black/45 backdrop-blur-md">
                  {imgIdx + 1}/{images.length}
                </span>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIdx(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                      )}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="relative -mt-5 rounded-t-[1.75rem] bg-zinc-50 dark:bg-zinc-950 px-5 pt-6 pb-8 space-y-6">
            <div>
              <h2 className="text-[1.65rem] font-semibold tracking-tight text-zinc-900 dark:text-white leading-[1.2]">
                {pin.title}
              </h2>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  {pin.priceLabel ? (
                    <p className="text-2xl font-semibold tracking-tight text-primary leading-none">
                      {pin.priceLabel}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('pinDetail.noPriceSpecified')}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                    {(pin.rating || 0).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-xs">({pin.reviewCount || 0})</span>
                </div>
              </div>
              {pin.plan === 'enterprise' && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-primary/80">
                  <Star className="w-3 h-3 fill-current" />
                  {t('pinDetail.businessAccount')}
                </p>
              )}
            </div>

            {pin.description && (
              <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {pin.description}
              </p>
            )}

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground mb-1">
                  {t('pinDetail.location')}
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug">
                  {pin.address}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pin.district}, {pin.province}
                </p>
                {pin.radius && (pin.radius > 0 || pin.radius === -1) && (
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    {t('createPin.form.radius')}: {pin.radius === -1
                      ? t('createPin.form.nationwide')
                      : t('createPin.form.radiusOption', { km: pin.radius })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {pin.views} {t('pinDetail.views')}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5',
                  pin.category === 'emergency' && 'text-red-600 font-semibold'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                {timeLabel}
              </span>
            </div>

            <Link
              href={`/profile/${pin.ownerId}`}
              className="flex items-center gap-3 py-1 group"
            >
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-zinc-800 shadow-md">
                  <AvatarImage src={pin.ownerAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                    {pin.ownerName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-zinc-50 dark:ring-zinc-950" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {pin.ownerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pin.ownerType === 'business' ? t('pinDetail.businessAccount') : t('pinDetail.personalAccount')}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href={`/pin/${pin.id}`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              {t('pinDetail.viewMore')}
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>

            <div className="h-px bg-zinc-200/80 dark:bg-white/8" />
            <ReviewSection pinId={pin.id} compact />
          </div>
        </div>

        {/* Sticky actions */}
        <div
          className={cn(
            'shrink-0 border-t border-zinc-200/70 dark:border-white/10',
            'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl',
            'px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
            'md:pb-4'
          )}
        >
          {user ? (
            <div className="flex items-center gap-2">
              {pin.contact?.phone && (
                <a href={`tel:${pin.contact.phone}`} onClick={handlePhoneClick} className="shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl border-zinc-200 dark:border-white/10"
                    aria-label={t('pinDetail.call')}
                  >
                    <Phone className="w-[18px] h-[18px]" />
                  </Button>
                </a>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-zinc-200 dark:border-white/10"
                  aria-label={t('pinDetail.navigate')}
                >
                  <Navigation className="w-[18px] h-[18px]" />
                </Button>
              </a>
              {pin.contact?.line && (
                <a
                  href={`https://line.me/ti/p/~${pin.contact.line.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl border-zinc-200 dark:border-white/10 text-emerald-600"
                    aria-label={t('pinDetail.line')}
                  >
                    <MessageCircle className="w-[18px] h-[18px]" />
                  </Button>
                </a>
              )}
              {!isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl border-zinc-200 dark:border-white/10"
                    aria-label={t('pinDetail.reportPin')}
                    disabled={banStatus.banned}
                    onClick={() => {
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur()
                      }
                      setIsReportOpen(true)
                    }}
                  >
                    <AlertTriangle className="w-[18px] h-[18px] text-rose-600" />
                  </Button>

                  <Dialog
                    open={isReportOpen}
                    onOpenChange={setIsReportOpen}
                  >
                    <DialogContent className="z-[70] max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t('pinDetail.reportPin')}</DialogTitle>
                        <DialogDescription>{t('pinDetail.reportWarning')}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 mt-2">
                        <label className="text-sm font-medium">{t('pinDetail.reportReason')}</label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full rounded-md border px-3 py-2"
                        >
                          <option value="inappropriate">{t('pinDetail.reportReasons.inappropriate') || 'ไม่เหมาะสม'}</option>
                          <option value="spam">{t('pinDetail.reportReasons.spam') || 'สแปม'}</option>
                          <option value="fraud">{t('pinDetail.reportReasons.scam') || 'หลอกลวง'}</option>
                          <option value="wrongLocation">{t('pinDetail.reportReasons.wrongLocation') || 'ตำแหน่งไม่ถูกต้อง'}</option>
                          <option value="other">{t('pinDetail.reportReasons.other') || 'อื่นๆ'}</option>
                        </select>

                        <label className="text-sm font-medium">{t('pinDetail.reportDetails') || 'รายละเอียดเพิ่มเติม'}</label>
                        <Textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder={t('pinDetail.reportDetails') || ''}
                        />
                      </div>

                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsReportOpen(false)}>
                          {t('common.cancel') || 'ยกเลิก'}
                        </Button>
                        <Button
                          disabled={reportSubmitting}
                          onClick={async () => {
                            if (!user) {
                              toast.error(t('pinDetail.loginToLike'))
                              return
                            }
                            const confirmed = window.confirm(t('pinDetail.reportConfirm'))
                            if (!confirmed) return
                            setReportSubmitting(true)
                            try {
                              await reportPin(pin.id, user.id, reportReason, reportDetails)
                              toast.success(t('pinDetail.reportSuccess'))
                              setIsReportOpen(false)
                              setReportDetails('')
                              setReportReason('other')
                            } catch (err) {
                              const message = err instanceof Error ? err.message : String(err)
                              if (message.toLowerCase().includes('already reported')) {
                                toast.info('คุณรายงานหมุดนี้ไปแล้ว')
                                setIsReportOpen(false)
                              } else {
                                console.error('report error', err)
                                toast.error(message || 'เกิดข้อผิดพลาด')
                              }
                            } finally {
                              setReportSubmitting(false)
                            }
                          }}
                        >
                          {reportSubmitting ? 'กำลังส่งรายงาน...' : t('pinDetail.reportPin')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {!isOwner ? (
                <Button
                  className="flex-1 h-12 rounded-2xl font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  onClick={() => setIsChatOpen(true)}
                  disabled={banStatus.banned}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('pinDetail.message')}
                </Button>
              ) : (
                <Link href={`/pin/${pin.id}`} className="flex-1">
                  <Button className="w-full h-12 rounded-2xl font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                    {t('pinDetail.viewMore')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Button
              className="w-full h-12 rounded-2xl font-semibold"
              onClick={() => (window.location.href = '/login')}
            >
              <Lock className="w-4 h-4 mr-2" />
              {t('common.loginToViewAll')}
            </Button>
          )}
        </div>
      </div>

      <ChatModal
        pin={pin}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  )
}
