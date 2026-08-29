'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Phone, MessageCircle, Facebook, Star, 
  Shield, Calendar, MapPin, Award, Crown,
  Loader2, ExternalLink, History, Heart, Trash2, Lock, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { useLanguage } from '@/contexts/language-context'
import type { User as AppUser, Pin } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/contexts/auth-context'
import { toggleBlockUser, getPublicUserProfile } from '@/lib/services/users'
import { getPublicUserPins } from '@/lib/services/pins'
import { getUserFavorites, removeFavorite } from '@/lib/services/favorites'
import { toast } from 'sonner'
import { PinCard } from '@/components/pin-card'

export default function PublicProfilePage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const uid = params.id as string
  const { user, refreshProfile } = useAuth()
  
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [favorites, setFavorites] = useState<(Pin & { isDeleted?: boolean, isExpired?: boolean })[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFavs, setLoadingFavorites] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isBlocked = user?.blockedUsers?.includes(uid) || false
  const isMe = user?.id === uid

  useEffect(() => {
    async function fetchProfile() {
      if (!uid) return
      setLoading(true)
      try {
        const data = await getPublicUserProfile(uid)
        setProfile(data)
        
        // Fetch favorites if it's my profile
        if (uid === user?.id) {
          setLoadingFavorites(true)
          const favs = await getUserFavorites(uid)
          setFavorites(favs as any)
          setLoadingFavorites(false)
        }
        if (uid === user?.id || data?.showPins !== false) {
          setPins(await getPublicUserPins(uid))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [uid, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('profile.notFound')}</h1>
        <p className="text-muted-foreground mb-8 text-sm">{t('profile.notFoundDesc')}</p>
        <Button onClick={() => router.push('/')} className="rounded-2xl px-8 h-12">{t('profile.backHome')}</Button>
      </div>
    )
  }

  if (!isMe && profile.profileVisibility === 'private') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
          <Lock className="mb-5 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-black">โปรไฟล์นี้เป็นส่วนตัว</h1>
          <p className="mt-2 text-sm text-muted-foreground">เจ้าของโปรไฟล์ยังไม่เปิดเผยข้อมูลสาธารณะ</p>
          <Button onClick={() => router.back()} className="mt-6 rounded-2xl">ย้อนกลับ</Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <section className="bg-card rounded-[2.5rem] border border-border/50 shadow-xl overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-br from-primary via-primary/80 to-secondary relative flex items-end px-8 pb-4">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl animate-pulse" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 left-4 rounded-2xl bg-white/20 text-white hover:bg-white/40 z-20"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-8 pb-10 relative -mt-16 flex flex-col md:flex-row gap-8 items-start md:items-end">
            <div className="relative">
              <Avatar className="w-40 h-40 ring-8 ring-background shadow-2xl transition-transform hover:scale-105">
                <AvatarImage src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold uppercase">
                  {profile.nickname?.charAt(0) || profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {profile.heroCasesCount > 0 && (
                <div className="absolute bottom-2 -right-2 bg-secondary text-secondary-foreground p-3 rounded-2xl shadow-xl ring-4 ring-background animate-bounce" title={t('profile.rankingBadge')}>
                  <Shield className="w-8 h-8 fill-current" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-foreground tracking-tight">
                  {profile.nickname || profile.name}
                </h1>
                {profile.rating >= 4.5 && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    {t('profile.trustedSeller')}
                  </Badge>
                )}
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider capitalize">
                  {profile.plan === 'enterprise' ? t('profile.planEnterprise') : t('profile.planGeneral')}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                {profile.showLocation !== false && <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {profile.province || t('profile.allThailand')}
                </div>}
                <div className="flex items-center gap-1.5 text-primary">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold text-foreground">{profile.rating?.toFixed(1) || '0.0'}</span>
                  <span>({profile.reviewCount || 0} {t('profile.reviews')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('profile.memberSince')} {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mx-8 mb-8 rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </div>
          )}

          <div className="px-8 pb-8 pt-4 border-t border-border/50 flex flex-wrap gap-3">
            {profile.phone && profile.showPhone !== false && (
              <Button asChild className="rounded-2xl h-12 gap-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground border-none shadow-none">
                <a href={`tel:${profile.phone}`}>
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </a>
              </Button>
            )}
            {profile.line && profile.showLine !== false && (
              <Button asChild className="rounded-2xl h-12 gap-2 bg-[#00B900]/10 text-[#00B900] border-[#00B900]/20 hover:bg-[#00B900] hover:text-white">
                <a href={`https://line.me/ti/p/~${profile.line}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  LINE
                </a>
              </Button>
            )}
            {profile.facebook && profile.showFacebook !== false && (
              <Button asChild className="rounded-2xl h-12 gap-2 bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2] hover:text-white">
                <a href={profile.facebook.includes('http') ? profile.facebook : `https://${profile.facebook}`} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
              </Button>
            )}
            {profile.email && profile.showEmail !== false && (
              <Button asChild className="rounded-2xl h-12 gap-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground border-none shadow-none">
                <a href={`mailto:${profile.email}`}>
                  <Mail className="w-4 h-4" />
                  อีเมล
                </a>
              </Button>
            )}

            {!isMe && user && (
              <>
                <Button 
                  variant="outline" 
                  className={cn(
                    "rounded-2xl h-12 gap-2 transition-all ml-auto min-w-[120px]",
                    isBlocked 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white" 
                      : "text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  )}
                  disabled={blocking}
                  onClick={() => setShowConfirm(true)}
                >
                  {blocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className={cn("w-4 h-4", isBlocked && "fill-current")} />
                  )}
                  {isBlocked ? t('profile.unblock') : t('profile.block')}
                </Button>

                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                  <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
                    <AlertDialogHeader className="space-y-4">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-2",
                        isBlocked ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        <Shield className="w-8 h-8" />
                      </div>
                      <AlertDialogTitle className="text-2xl font-black text-center tracking-tight">
                        {isBlocked ? t('profile.unblock') : t('profile.block')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-muted-foreground font-medium px-4">
                        {isBlocked ? t('profile.unblockConfirm') : t('profile.blockConfirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-8">
                      <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 hover:bg-muted font-bold flex-1">
                        {t('common.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        className={cn(
                          "rounded-2xl h-12 font-bold flex-1 border-none transition-all",
                          isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                        )}
                        onClick={async () => {
                          setBlocking(true)
                          try {
                            await toggleBlockUser(user.id, uid, !isBlocked)
                            await refreshProfile()
                            setShowConfirm(false)
                            toast.success(isBlocked ? 'ปลดบล็อกเรียบร้อย' : 'บล็อกผู้ใช้เรียบร้อย')
                          } catch (err: any) {
                            console.error('BLOCK_TOGGLE_ERROR:', err)
                            toast.error('ทำรายการไม่สำเร็จ: ' + err.message)
                          } finally {
                            setBlocking(false)
                          }
                        }}
                      >
                        {t('common.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </section>

        {/* Two Columns Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hero History Sidebar */}
          {(isMe || profile.showHeroHistory !== false) && <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">{t('profile.heroHistory')}</h2>
            </div>

            {profile.heroCases && profile.heroCases.length > 0 ? (
              <div className="space-y-4">
                {profile.heroCases.map((c, i) => (
                  <div key={i} className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-secondary/10 transition-colors" />
                    
                    <div className="flex justify-between items-start gap-4 relative z-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg group-hover:text-secondary transition-colors line-clamp-1">{c.title}</h4>
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px] uppercase font-black tracking-tight">{t('categories.' + c.category)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(c.helpedAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {c.district}, {c.province}
                          </div>
                        </div>
                        {c.thankYouMessage && (
                          <div className="mt-3 p-3 bg-secondary/5 rounded-2xl border border-secondary/10 italic text-xs text-secondary/80">
                            <span className="block mb-1 not-italic font-bold text-secondary/60">ข้อความขอบคุณจาก {c.thankedBy || 'ผู้ขอความช่วยเหลือ'}</span>
                            "{c.thankYouMessage}"
                          </div>
                        )}
                      </div>
                      <Link href={`/pin/${c.pinId}`} className="shrink-0 w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-white transition-all shadow-sm">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card/50 border border-border/50 border-dashed rounded-[2.5rem] p-12 text-center text-muted-foreground">
                <div className="w-14 h-14 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4 grayscale">
                  <Shield className="w-7 h-7" />
                </div>
                <p className="font-medium">{t('profile.noHeroHistory')}</p>
                <p className="text-xs mt-1 opacity-60">{t('profile.helpEmergencyHint')}</p>
              </div>
            )}
          </section>}

          {/* Achievements Sidebar */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">{t('profile.achievements')}</h2>
            </div>
 
            <div className="bg-card p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-6">
              {/* Badge 1: Hero */}
              <div className="flex items-center gap-4 group">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3",
                  profile.heroCasesCount > 0 ? "bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-secondary/20" : "bg-muted text-muted-foreground opacity-40"
                )}>
                  <Shield className="w-8 h-8 fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-tight">{t('profile.heroHelper')}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{profile.heroCasesCount} {t('profile.heroCases')}</p>
                </div>
              </div>
 
              {/* Badge 2: Top Seller */}
              <div className="flex items-center gap-4 group">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-3",
                  profile.rating >= 4 ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/20" : "bg-muted text-muted-foreground opacity-40"
                )}>
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-tight">{t('profile.serviceStar')}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{profile.rating?.toFixed(1) || '0.0'} {t('profile.averageRating')}</p>
                </div>
              </div>
 
              {/* Badge 3: Early Adopter */}
              <div className="flex items-center gap-4 group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 transition-transform group-hover:scale-110 group-hover:rotate-6 text-white">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-tight">{t('profile.earlyAdopter')}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{t('profile.earlyAdopter')}</p>
                </div>
              </div>
            </div>
 
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/50 p-5 rounded-[2rem] border border-border/50 text-center">
                <p className="text-2xl font-black text-primary">{profile.activePins || 0}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('profile.pinsCreated')}</p>
              </div>
              <div className="bg-card/50 p-5 rounded-[2rem] border border-border/50 text-center">
                <p className="text-2xl font-black text-secondary">{profile.heroCasesCount || 0}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('profile.jobsHelped')}</p>
              </div>
            </div>
          </section>
        </div>

        {(isMe || profile.showPins !== false) && (
          <section className="mt-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">หมุดที่ปัก</h2>
                <p className="text-sm text-muted-foreground">ข้อมูลและบริการที่ {profile.nickname || profile.name} แนะนำ</p>
              </div>
            </div>
            {pins.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pins.map((pin) => <PinCard key={pin.id} pin={pin} compact />)}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">ยังไม่มีหมุดที่ปัก</div>
            )}
          </section>
        )}

        {/* My Favorites Section - Only visible on my own profile */}
        {isMe && (
          <section className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{t('profile.myFavorites')}</h2>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1 font-bold">
                {favorites.length} {t('profile.items')}
              </Badge>
            </div>

            {loadingFavs ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium">{t('common.loading')}</p>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favorites.map((pin: any) => {
                  const isDisabled = pin.isDeleted || pin.isExpired;
                  
                  return (
                    <div key={pin.id} className={cn("relative group", isDisabled && "opacity-75 grayscale-[0.5]")}>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingPinId(pin.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {/* Status Overlay for deleted/expired */}
                      {isDisabled && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-4">
                          <div className={cn(
                            "px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md border font-black text-xs uppercase tracking-widest rotate-[-12deg]",
                            pin.isDeleted ? "bg-red-500/90 text-white border-red-400" : "bg-orange-500/90 text-white border-orange-400"
                          )}>
                            {pin.isDeleted ? t('profile.pinDeleted') : t('profile.pinExpired')}
                          </div>
                        </div>
                      )}
                      
                      <div className={cn(isDisabled && "pointer-events-none select-none")}>
                        <PinCard 
                          pin={pin} 
                          compact 
                          onClick={isDisabled ? undefined : (p) => router.push(`/pin/${p.id}`)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card/50 border border-border/50 border-dashed rounded-[2.5rem] p-16 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6 grayscale">
                  <Heart className="w-8 h-8" />
                </div>
                <p className="font-bold text-lg">{t('profile.noFavorites')}</p>
                <p className="text-sm mt-2 max-w-xs mx-auto opacity-60">
                  {t('profile.noFavoritesHint')}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-8 rounded-2xl px-8"
                  onClick={() => router.push('/explore')}
                >
                  {t('profile.exploreNow')}
                </Button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Delete Favorite Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-2 bg-red-100 text-red-600">
              <Trash2 className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center tracking-tight">
              ลบหมุดโปรด
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium px-4">
              คุณแน่ใจหรือไม่ว่าต้องการลบหมุดนี้ออกจากรายการโปรด?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 hover:bg-muted font-bold flex-1">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-2xl h-12 font-bold flex-1 border-none bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (!user || !deletingPinId) return;
                setDeleting(true);
                try {
                  await removeFavorite(user.id, deletingPinId);
                  setFavorites(prev => prev.filter(p => p.id !== deletingPinId));
                  toast.success('ลบหมุดโปรดเรียบร้อย');
                  setShowDeleteConfirm(false);
                } catch (err: any) {
                  console.error('DELETE_FAVORITE_ERROR:', err);
                  toast.error('ลบไม่สำเร็จ: ' + err.message);
                } finally {
                  setDeleting(false);
                  setDeletingPinId(null);
                }
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ลบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
