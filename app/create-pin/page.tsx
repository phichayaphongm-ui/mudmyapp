'use client'

import { useState, useRef, ChangeEvent, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Upload, X, CheckCircle2, Loader2, Heart, Clock,
  ShoppingBag, Wrench, Briefcase, Car,
  Home, AlertTriangle,
  Store, Fuel, Calendar, Newspaper
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { createPin } from '@/lib/services/pins'
import { createPayment } from '@/lib/services/payments'
import { uploadPinImage } from '@/lib/services/storage'
import { compressImage } from '@/lib/utils/image'
import { incrementUserActivePins, getUserProfile, updateUserProfile } from '@/lib/services/users'
import { CATEGORIES, type PinCategory, type Pin } from '@/lib/types'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Wrench,
  Store,
  Briefcase,
  Car,
  Home,
  Fuel,
  Calendar,
  Newspaper,
  AlertTriangle
}

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-3xl" />
})

type Step = 1 | 2 | 3 | 4

// Static labels moved to component for i18n

function CreatePinContent() {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isBanned } = useAuth()
  const banStatus = isBanned()
  const [step, setStep] = useState<Step>(1)
  const [category, setCategory] = useState<PinCategory | null>(null)
  const [_userProfile, setUserProfile] = useState<any>(null)
  const [_loadingUser, setLoadingUser] = useState(true)
  const [isFreePin, setIsFreePin] = useState(false)

  // Auto-select category from URL
  useEffect(() => {
    const cat = searchParams.get('category') as PinCategory
    if (cat && CATEGORIES.some(c => c.id === cat)) {
      setCategory(cat)
      setStep(2) // Skip to details if category is provided
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return
      try {
        const profile = await getUserProfile(user.id)
        setUserProfile(profile)
        // Check if this is first pin (free)
        setIsFreePin(profile ? !profile.hasUsedFreePin : true)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUserProfile()
  }, [user])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(13.7563)
  const [lng, setLng] = useState(100.5018)
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [radius, setRadius] = useState<number>(0)

  const [images, setImages] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [createdPinId, setCreatedPinId] = useState<string | null>(null)
 
  if (banStatus.banned) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-[2rem] bg-red-100 flex items-center justify-center shadow-xl shadow-red-100">
            <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-red-600">
              {banStatus.permanent ? t('common.isPermanentlyBanned') : t('common.userBanned')}
            </h1>
            <p className="text-muted-foreground font-medium italic">
              {t('common.banWarning')}
            </p>
            {!banStatus.permanent && banStatus.until && (
              <Badge variant="outline" className="mt-4 px-4 py-2 rounded-full border-red-200 text-red-600 font-bold bg-red-50 shadow-sm">
                {t('common.bannedUntil', { date: new Date(banStatus.until).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}
              </Badge>
            )}
          </div>
          <Link href="/explore">
            <Button variant="outline" className="rounded-2xl px-8 h-12 font-bold hover:bg-muted/80 transition-all">
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const STEPS = [
    { id: 1, label: t('createPin.steps.category') },
    { id: 2, label: t('createPin.steps.details') },
    { id: 3, label: t('createPin.steps.location') },
    { id: 4, label: t('createPin.steps.payment') },
  ]
 
  // Dynamic placeholders
  const titlePlaceholder = category ? t(`createPin.placeholders.title.${category}`) : t('createPin.form.pricePlaceholder')
  const descPlaceholder = category ? t(`createPin.placeholders.description.${category}`) : t('createPin.form.description')

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const maxImages = 3
      if (images.length + files.length > maxImages) {
        alert(t('createPin.alerts.maxImages', { count: maxImages }))
        return
      }
      setImages((prev) => [...prev, ...files])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handlePayment = async () => {
    if (!user) {
      alert(t('createPin.alerts.loginRequired'))
      router.push('/login')
      return;
    }

    setPaymentLoading(true)
    try {
      // 1. Prepare Pin ID first for storage path
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const tempPinId = `pin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const imageUrls: string[] = [];
      for (const file of images) {
        const compressedFile = await compressImage(file);
        const url = await uploadPinImage(compressedFile, user.id, tempPinId);
        imageUrls.push(url);
      }

      // 3. Prep data
      const pinData: Omit<Pin, 'id' | 'daysLeft'> = {
        title,
        category: category!,
        description,
        images: imageUrls,
        contact: {
          phone: phone || null,
          line: lineId || null,
        },
        price: !isNaN(Number(price)) ? Number(price) : null,
        priceLabel: price ? (!isNaN(Number(price)) ? `${Number(price).toLocaleString()} ${t('createPin.payment.baht')}` : price) : t('pinDetail.provinceNotSpecified'),
        lat,
        lng,
        address,
        district: district || t('pinDetail.provinceNotSpecified'),
        province: province || t('pinDetail.provinceNotSpecified'),
        ownerId: user.id,
        ownerName: user.nickname || user.name || 'User',
        ownerAvatar: user.avatar,
        status: 'active',
        plan: 'general',
        featured: category === 'emergency',
        views: 0,
        clicks: 0,
        rating: 0,
        reviewCount: 0,
        favoriteCount: 0,
        createdAt: now.toISOString(),
        expiresAt: category === 'emergency' 
          ? new Date(now.getTime() + 30 * 60 * 1000).toISOString() 
          : expiresAt.toISOString(),
        radius: radius > 0 ? radius : undefined,
        ownerType: user.userType || 'personal',
        isFreePin: isFreePin, // Mark as free pin
      };
      
      // Validate coordinates before creating pin
      const isValidLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
      const isValidLng = typeof lng === 'number' && lng >= -180 && lng <= 180;
      
      if (!isValidLat || !isValidLng) {
        alert('พิกัดไม่ถูกต้อง กรุณาเลือกตำแหน่งใหม่');
        return;
      }
      
      // 4. Create pin
      const pinId = await createPin(pinData);
      setCreatedPinId(pinId);
      
      // 5. Create payment and update user quota
      if (pinId) {
        try {
          await incrementUserActivePins(user.id, 1);
          
          // Update user to mark free pin used if this was free
          if (isFreePin) {
            await updateUserProfile(user.id, {
              hasUsedFreePin: true,
              freePinId: pinId
            });
          }
          
          // Skip actual payment for emergency or free pin
          const isFree = category === 'emergency' || isFreePin;
          
          await createPayment({
            userId: user.id,
            pinId: pinId,
            amount: isFree ? 0 : 10,
            status: 'paid', 
            method: 'promptpay',
            createdAt: now.toISOString(),
            paidAt: now.toISOString(),
          });
          setPaymentDone(true);
        } catch (error) {
          console.error('Error in post-creation steps:', error);
          // Even if post-creation steps fail, the pin was created successfully
          setPaymentDone(true);
        }
      } else {
        throw new Error('Failed to create pin - no ID returned');
      }
    } catch (e) {
      console.error(e);
      alert(t('createPin.alerts.error'));
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={!!user} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/explore">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 shadow-sm" aria-label={t('common.back')}>
              <ArrowLeft className="w-4 h-4 text-orange-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{t('createPin.title')}</h1>
            <p className="text-xs text-muted-foreground font-medium">{t('createPin.subtitle')}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <Heart className="w-5 h-5 text-white fill-white/20" />
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0 mb-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-4 border border-orange-100 shadow-sm">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-semibold transition-all duration-300 shadow-md',
                    step > s.id ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-green-200' :
                    step === s.id ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200 scale-110' :
                    'bg-white text-muted-foreground border-2 border-orange-200'
                  )}
                >
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                </div>
                <span className={cn('text-[10px] mt-2 font-bold transition-colors', step === s.id ? 'text-orange-600' : step > s.id ? 'text-green-600' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('h-1 flex-1 mx-2 rounded-full transition-all duration-300', step > s.id ? 'bg-gradient-to-r from-green-400 to-green-500' : step === s.id ? 'bg-gradient-to-r from-orange-400 to-orange-300' : 'bg-orange-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Free pin info */}
            <div className={cn(
              'border rounded-3xl p-5 space-y-3 shadow-lg',
              isFreePin 
                ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-orange-200' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center',
                  isFreePin ? 'bg-orange-500' : 'bg-blue-500'
                )}>
                  <Heart className={cn('w-5 h-5 text-white fill-white/20')} />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  {isFreePin ? "หมุดแรกของคุณ ฟรี!" : "เพิ่มหมุดใหม่"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {isFreePin 
                  ? "หมุดแรกฟรี 30 วัน! คุณสามารถ Check-in เพื่อต่ออายุได้ตลอดเวลา"
                  : "หมุดถัดไป 10 บาท/30 วัน"}
              </p>
              {isFreePin && (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-200/50 rounded-full px-3 py-1.5 w-fit">
                  <Clock className="w-3 h-3" />
                  <span>30 วัน</span>
                </div>
              )}
            </div>

            <h2 className="text-base font-semibold text-foreground">{t('createPin.selectCategory')}</h2>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon]
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'p-5 rounded-3xl border-2 text-left transition-all duration-300 relative group overflow-hidden shadow-lg',
                      isSelected
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-orange-200 scale-[1.03]'
                        : 'border-border bg-gradient-to-br from-white to-gray-50 hover:border-orange-300 hover:shadow-orange-100'
                    )}
                  >
                    {cat.id === 'emergency' && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-2xl shadow-md animate-pulse">
                        {t('createPin.free')}
                      </div>
                    )}
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-md', 
                      cat.bgColor,
                      cat.id === 'emergency' && !isSelected && 'animate-pulse'
                    )}>
                      {Icon && <Icon className={cn('w-6 h-6', cat.color)} />}
                    </div>
                    <p className="font-bold text-sm text-foreground group-hover:text-orange-600 transition-colors">{t(`categories.${cat.id}`)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{cat.labelEn}</p>
                    {cat.id === 'emergency' && (
                      <p className="text-[9px] text-red-500 font-bold mt-2">{t('createPin.freeCharge')}</p>
                    )}
                  </button>
                )
              })}
            </div>
 
            <Button
              className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 text-white h-12 font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-300 hover:scale-[1.02]"
              disabled={!category}
              onClick={() => setStep(2)}
            >
              {t('createPin.next')}
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">{t('pinDetail.details')}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.title')}
                </label>
                <Input
                  placeholder={titlePlaceholder}
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground mt-2 text-right font-medium">{title.length}/80</p>
              </div>
 
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.description')}
                </label>
                <Textarea
                  placeholder={descPlaceholder}
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 resize-none transition-all duration-300"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2 text-right font-medium">{description.length}/500</p>
              </div>
 
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.price')}
                </label>
                <Input
                  placeholder={t('createPin.form.pricePlaceholder')}
                  value={price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                  className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                    {t('createPin.form.phone')}
                  </label>
                  <Input
                    placeholder="08x-xxx-xxxx (ไม่บังคับ)"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
                    type="tel"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                    {t('createPin.form.lineId')}
                  </label>
                  <Input
                    placeholder="@your_line (ไม่บังคับ)"
                    value={lineId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLineId(e.target.value)}
                    className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-5 space-y-2 shadow-md">
                <div className="flex items-center gap-3 text-amber-700">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-sm">คำแนะนำสำหรับการติดต่อ</p>
                </div>
                <ul className="text-xs text-amber-800 space-y-1.5 pl-11">
                  <li>• สำหรับผู้ใช้ทั่วไป ไม่จำเป็นต้องกรอกเบอร์โทรศัพท์หรือ Line ID หากไม่ใช่ร้านค้าจริง</li>
                  <li>• สามารถใช้ระบบแชทในแอพฯ ในการติดต่อกันได้</li>
                  <li>• หากรู้สึกว่ามีข้อความไม่เหมาะสม สามารถ Block ผู้ใช้งานได้</li>
                  <li>• ผู้ที่ถูก Block จะไม่สามารถมองเห็นหมุดของคุณและส่งข้อความหาคุณได้</li>
                </ul>
              </div>

              {/* Image upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.images')} ({t('createPin.form.maxImages', { count: 3 })})
                </label>
                <div 
                  className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 text-center hover:border-orange-400 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t('createPin.form.uploadHint')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('createPin.form.uploadType')}</p>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageChange}
                  />
                </div>
                
                {images.length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {images.map((file, idx) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-200 shadow-md group">
                          <img src={url} alt="upload preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <button
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                            onClick={() => removeImage(idx)}
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 font-semibold" onClick={() => setStep(1)}>{t('createPin.back')}</Button>
              <Button
                className="flex-1 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-300 hover:scale-[1.02]"
                disabled={!title || !description}
                onClick={() => setStep(3)}
              >
                {t('createPin.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">{t('createPin.steps.location')}</h2>

            {/* Real map picker */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-4 space-y-2 shadow-md">
                <div className="flex items-center gap-3 text-green-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      <circle cx="12" cy="12" r="8" strokeWidth="2" opacity="0.5" />
                    </svg>
                  </div>
                  <p className="font-bold text-sm">คำแนะนำการเลือกตำแหน่ง</p>
                </div>
                <p className="text-xs text-green-800 pl-13">• คุณสามารถกดปุ่มเพื่อใช้ตำแหน่งปัจจุบันของคุณได้ทันที!</p>
              </div>
              <LocationPicker 
                lat={lat} 
                lng={lng} 
                category={category || undefined}
                radius={radius}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }} 
                onAddressFound={(newAddress, newDistrict, newProvince) => {
                  setAddress(newAddress);
                  if (newDistrict) setDistrict(newDistrict);
                  if (newProvince) setProvince(newProvince);
                }}
              />
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.addressLandmark')}
                </label>
                <Input
                  placeholder={t('createPin.form.addressPlaceholder')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
                />
              </div>

              {/* Radius Selection */}
              <div className="space-y-4 pt-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  {t('createPin.form.radius')}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[-1, 50, 10, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={cn(
                        'py-3 px-2 rounded-2xl border-2 text-[10px] font-bold transition-all duration-300 shadow-md',
                        radius === r 
                          ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 shadow-orange-200 scale-105' 
                          : 'border-border bg-card text-muted-foreground hover:border-orange-300 hover:shadow-orange-100'
                      )}
                    >
                      {r === -1 ? t('createPin.form.nationwide') : 
                       t('createPin.form.radiusOption', { km: r })}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground px-1 italic">
                  * {t('createPin.form.radiusSelect')} สำหรับแสดงขอบเขตการให้บริการของคุณบนแผนที่
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-4 space-y-2 mt-2 shadow-md">
                  <div className="flex items-center gap-3 text-blue-700">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-sm">คำแนะนำสำหรับขอบเขตการให้บริการ</p>
                  </div>
                  <ul className="text-xs text-blue-800 space-y-1.5 pl-11">
                    <li>• สำหรับผู้ใช้งานทั่วไป ที่ให้บริการในพื้นที่ สามารถเลือกขอบเขต 5, 10 หรือ 50 กิโลเมตร</li>
                    <li>• หมุดของคุณจะปรากฏให้ผู้ใช้งานในพื้นที่ที่ระบุเท่านั้น</li>
                    <li>• ผู้ใช้งานที่อยู่นอกเหนือจากรัศมีจะไม่สามารถมองเห็นหมุดของคุณได้</li>
                  </ul>
                </div>
              </div>
            </div>
 
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                {t('createPin.form.address')}
              </label>
              <Input
                placeholder={t('createPin.form.addressDetailPlaceholder')}
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                className="rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100 transition-all duration-300"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 font-semibold" onClick={() => setStep(2)}>{t('createPin.back')}</Button>
              <Button
                className="flex-1 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => setStep(4)}
              >
                {t('createPin.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">{t('createPin.steps.payment')}</h2>

            {!paymentDone ? (
              <>
                {/* Order summary */}
                <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-orange-200 rounded-3xl p-6 space-y-4 shadow-lg">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                    {t('createPin.payment.summary')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('createPin.payment.pin')}</span>
                      <span className="font-medium line-clamp-1 max-w-[200px]">{title || t('createPin.payment.newPin')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('createPin.payment.duration')}</span>
                      <span className="font-medium">{category === 'emergency' ? t('createPin.payment.thirtyMins') : t('createPin.payment.thirtyDays')}</span>
                    </div>
                    <div className="border-t-2 border-orange-200 pt-3 flex justify-between font-bold text-lg">
                      <span>{t('createPin.payment.total')}</span>
                      <span className={cn(
                        category === 'emergency' || isFreePin ? "text-emerald-600" : "text-orange-600"
                      )}>
                        {category === 'emergency' || isFreePin ? t('createPin.payment.free') : '10 ' + t('createPin.payment.baht')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Free pin info or payment info */}
                {category === 'emergency' || isFreePin ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-lg animate-scale-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white shadow-lg shadow-emerald-200">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900">
                      {category === 'emergency' ? t('createPin.payment.noPayment') : 'หมุดฟรี!'}
                    </h3>
                    <p className="text-sm text-emerald-700/80 font-medium">
                      {category === 'emergency' 
                        ? t('createPin.payment.emergencyFree')
                        : 'หมุดแรกของคุณฟรี! คุณสามารถ Check-in เพื่อต่ออายุได้ตลอดเวลา'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-3xl p-6 text-center space-y-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-foreground">การชำระเงิน</h3>
                    <p className="text-xs text-muted-foreground">
                      ขณะนี้ระบบชำระเงินยังไม่พร้อมใช้งาน คุณสามารถสร้างหมุดได้เลยสำหรับการทดสอบ
                    </p>
                    <p className="text-3xl font-bold text-orange-600">10 {t('createPin.payment.baht')}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 font-semibold" onClick={() => setStep(3)}>{t('createPin.back')}</Button>
                  <Button
                    className="flex-1 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-300 hover:scale-[1.02] h-12"
                    onClick={handlePayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('createPin.payment.verifying')}
                      </>
                    ) : (
                      category === 'emergency' || isFreePin ? t('createPin.payment.confirmPin') : 'ยืนยันการสร้างหมุด'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Success */
              <div className="text-center py-8 space-y-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-200 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{t('createPin.success.title')}</h2>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">{t('createPin.success.desc')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 text-sm space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('createPin.payment.pin')}</span>
                    <span className="font-medium">{title || t('createPin.payment.newPin')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('createPin.success.expires')}</span>
                    <span className="font-medium">{t('createPin.payment.thirtyDays')}</span>
                  </div>
                  {isFreePin && (
                    <div className="pt-3 border-t-2 border-green-200 mt-3 text-xs text-green-700 font-semibold bg-green-100/50 rounded-xl p-3">
                      💡 คุณสามารถ Check-in ที่หน้า Dashboard เพื่อต่ออายุหมุดฟรีได้ตลอดเวลา!
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link href={createdPinId ? `/explore?pin=${createdPinId}&lat=${lat}&lng=${lng}` : '/explore'} className="flex-1">
                    <Button variant="outline" className="w-full rounded-2xl border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 font-semibold">{t('createPin.success.backToMap')}</Button>
                  </Link>
                  <Link href="/dashboard" className="flex-1">
                    <Button className="w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all duration-300 hover:scale-[1.02]">{t('createPin.success.viewMyPins')}</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function CreatePinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <CreatePinContent />
    </Suspense>
  )
}
