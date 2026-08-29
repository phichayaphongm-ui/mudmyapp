'use client'

import { Clock, Heart, Star, Sparkles, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Pin } from '@/lib/types'
import { cn, calculateDistanceInKm } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/contexts/language-context'


interface PinCardProps {
  pin: Pin
  compact?: boolean
  className?: string
  userLocation?: [number, number]
  onClick?: (pin: Pin) => void
}

export function PinCard({ pin, compact = false, className, userLocation, onClick }: PinCardProps) {
  const { t } = useLanguage()
  const area = pin.district?.trim() || pin.province?.trim() || pin.address?.trim() || 'ไม่ระบุพื้นที่'
  const [isLiked, setIsLiked] = useState(false)
  const [minsRemaining, setMinsRemaining] = useState<number | null>(null)

  const distance = useMemo(() => {
    if (!userLocation || typeof pin.lat !== 'number' || typeof pin.lng !== 'number') return null
    return calculateDistanceInKm(userLocation[0], userLocation[1], pin.lat, pin.lng)
  }, [userLocation, pin.lat, pin.lng])
  

  const calculateMins = () => {
    if (pin.category !== 'emergency' || !pin.expiresAt) return null;
    try {
      // expiresAt is always an ISO string from Supabase
      const expiryDate = new Date(pin.expiresAt as string);
          
      const diff = expiryDate.getTime() - Date.now();
      const mins = Math.floor(diff / (1000 * 60));
      return isNaN(mins) ? null : Math.max(0, mins);
    } catch (_e) {
      return null;
    }
  }

  useEffect(() => {
    if (pin.category === 'emergency') {
      setMinsRemaining(calculateMins());
      const timer = setInterval(() => {
        setMinsRemaining(calculateMins());
      }, 60000); // Update every minute
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin.category, pin.expiresAt]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(pin)
    }
  }

  return (
    <div className="block group cursor-pointer h-full" onClick={handleCardClick}>
      <article
        className={cn(
          'relative bg-card rounded-[1.5rem] border border-border/40 overflow-hidden h-full flex flex-col',
          'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
          'hover:shadow-lg hover:shadow-primary/10 hover:border-primary/25',
          'hover:-translate-y-1 group-hover:scale-[1.01]',
          'active:scale-[0.98]',
          pin.featured && 'premium-border ring-0 shadow-xl shadow-primary/5',
          className
        )}
      >
        {/* Image */}
        {!compact && pin.images.length > 0 && (
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={pin.images[0]}
              alt={pin.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'; // Fallback
              }}
            />
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-60 group-hover:opacity-75 transition-opacity duration-400" />
            
            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              {pin.featured ? (
                <Badge className="bg-primary text-white gap-1 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 shadow-lg shadow-primary/20 border-none">
                  <Sparkles className="w-3 h-3 fill-current animate-pulse" /> {t('pinCard.featured')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-lg text-white border-white/15 text-[9px] font-bold px-2 py-0.5">
                  {t(`categories.${pin.category}`)}
                </Badge>
              )}
              
              {/* Like button - Premium Style */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsLiked(!isLiked)
                }}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                  "bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg",
                  "hover:bg-white/25 hover:scale-110 active:scale-90",
                  isLiked && "bg-destructive text-white border-none shadow-destructive/30"
                )}
              >
                <Heart className={cn("w-4 h-4", isLiked ? "fill-white" : "text-white")} />
              </button>
            </div>
            
            {/* Distance Badge - Bottom Left on Image */}
            {distance !== null && (
              <div className="absolute bottom-4 left-4">
                <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white shadow-lg">
                  <Navigation className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black tracking-tight">
                    {distance < 1 
                      ? `${(distance * 1000).toFixed(0)}m` 
                      : `${distance.toFixed(1)}km`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Expiration/Emergency badge - Top Center */}
            {(pin.daysLeft <= 3 || pin.category === 'emergency') && (
              <div className="absolute top-2 left-0 right-0 flex justify-center z-30 pointer-events-none">
                <Badge 
                  variant="destructive" 
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest backdrop-blur-md px-3 py-1 shadow-xl border border-white/30",
                    pin.category === 'emergency' && "bg-red-600 animate-pulse shadow-red-500/40"
                  )}
                >
                  {pin.category === 'emergency' ? (
                    `ช่วยด่วน: อีก ${minsRemaining ?? '...'} นาที`
                  ) : (
                    t('pinCard.expiresIn', { days: pin.daysLeft })
                  )}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn('p-2.5 sm:p-3 flex flex-col flex-grow', compact ? 'min-h-[90px]' : 'min-h-[140px]')}>
          {/* Header Row: Price & Rating */}
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            {pin.priceLabel ? (
              <div className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/15">
                <span className="text-[10px] sm:text-[11px] font-black text-primary italic">
                  {pin.priceLabel}
                </span>
              </div>
            ) : <div />}
            
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 font-black text-[9px]">
              <Star className="w-2.5 h-2.5 fill-current" />
              {(pin.rating || 0).toFixed(1)}
            </div>
          </div>

          {/* Title - Fixed Height for 2 lines */}
          <div className="h-[2rem] sm:h-[2.2rem] mb-1 overflow-hidden shrink-0">
            <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300 text-sm sm:text-base leading-tight">
              {pin.title}
            </h3>
          </div>

          {/* Description - Fixed Height for 2 lines */}
          {!compact && (
            <div className="h-[1.6rem] mb-1.5 overflow-hidden shrink-0">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 leading-tight opacity-75">
                {pin.description}
              </p>
            </div>
          )}

          {/* Spacer to push footer down */}
          <div className="flex-grow" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30 shrink-0">
            {/* Owner */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="w-7 h-7 border-2 border-background shadow-sm">
                  <AvatarImage src={pin.ownerAvatar} />
                  <AvatarFallback className="text-[9px] bg-gradient-to-br from-primary to-secondary text-primary-foreground font-black">
                    {pin.ownerName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-foreground truncate max-w-[75px]">
                  {pin.ownerName}
                </span>
                <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {area}
                </span>
              </div>
            </div>

            {/* Time Left */}
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-muted/40 text-[9px] font-bold text-muted-foreground",
              pin.category === 'emergency' && "bg-red-50 text-red-500 border border-red-100"
            )}>
              <Clock className="w-3 h-3" />
              {pin.category === 'emergency' ? (
                `${minsRemaining ?? '...'}${t('pinCard.minsShort')}`
              ) : (
                pin.daysLeft > 0 ? `${pin.daysLeft}${t('pinCard.daysShort')}` : t('pinCard.expired')
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
