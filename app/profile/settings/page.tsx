'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Camera, Loader2, User, Phone, 
  MessageCircle, Facebook, MapPin, Save, Bell,
  Volume2, VolumeX, Sparkles, HeartHandshake, Shield,
  Eye, EyeOff, Globe, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useThemeColor, THEME_COLORS, type ThemeColorId } from '@/contexts/theme-color-context'
import { getUserProfile, updateUserProfile } from '@/lib/services/users'
import { uploadAvatar } from '@/lib/services/storage'
import { compressImage } from '@/lib/utils/image'
import { toast } from 'sonner'
import { getSoundManager, playSound, setSoundVolume, getSoundVolume, SOUND_OPTIONS } from '@/lib/utils/sounds'
import { cn } from '@/lib/utils'

export default function ProfileSettingsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const { activeTheme, setThemeColor } = useThemeColor()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone: '',
    line: '',
    facebook: '',
    province: '',
    avatar: '',
    bio: ''
  })
  
  // Sound notification settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationSound, setNotificationSound] = useState('default')
  const [volume, setVolume] = useState(0.5)
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [showPhone, setShowPhone] = useState(true)
  const [showEmail, setShowEmail] = useState(true)
  const [showLocation, setShowLocation] = useState(true)
  const [showLine, setShowLine] = useState(false)
  const [showFacebook, setShowFacebook] = useState(false)
  const [showPins, setShowPins] = useState(true)
  const [showHeroHistory, setShowHeroHistory] = useState(true)

  useEffect(() => {
    const manager = getSoundManager()
    setSoundEnabled(manager.isEnabled())
    setNotificationSound(manager.getSoundType())
    setVolume(manager.getVolume())
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const profile = await getUserProfile(user.id)
        if (profile) {
          setFormData({
            name: profile.name || '',
            nickname: profile.nickname || profile.name || '',
            phone: profile.phone || '',
            line: profile.line || '',
            facebook: profile.facebook || '',
            province: profile.province || '',
            avatar: profile.avatar || '',
            bio: profile.bio || ''
          })
          setProfileVisibility(profile.profileVisibility || 'public')
          setShowPhone(profile.showPhone !== false)
          setShowEmail(profile.showEmail !== false)
          setShowLocation(profile.showLocation !== false)
          setShowLine(profile.showLine !== false)
          setShowFacebook(profile.showFacebook !== false)
          setShowPins(profile.showPins !== false)
          setShowHeroHistory(profile.showHeroHistory !== false)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      // Save profile data
      await updateUserProfile(user.id, {
        ...formData,
        profileVisibility: profileVisibility as 'public' | 'private',
        showPhone,
        showEmail,
        showLocation,
        showLine,
        showFacebook,
        showPins,
        showHeroHistory,
      })

      await refreshProfile()
      toast.success(t('profile.updateSuccess'))
    } catch (err) {
      console.error(err)
      toast.error(t('profile.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const compressedFile = await compressImage(file)
      const url = await uploadAvatar(compressedFile, user.id)
      setFormData(prev => ({ ...prev, avatar: url }))
      await updateUserProfile(user.id, { avatar: url })
      await refreshProfile()
      toast.success(t('profile.updateSuccess'))
    } catch (err) {
      console.error(err)
      toast.error(t('profile.updateError'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={!!user} />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-foreground sm:text-2xl">{t('profile.settings')}</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">{t('profile.settingsSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
          {/* Avatar Section */}
          <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-border/60 bg-card py-5 shadow-sm group sm:py-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-muted ring-4 ring-background shadow-xl transition-all group-hover:ring-primary/20 sm:h-28 sm:w-28">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{t('profile.uploadAvatar')}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 md:grid-cols-2">
            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="border-l-4 border-primary pl-3 text-xs font-black uppercase tracking-widest text-primary sm:text-sm">{t('profile.basicInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-2">{t('profile.nickname')} *</label>
                  <Input 
                    value={formData.nickname}
                    onChange={e => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
                    placeholder={t('profile.nicknamePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-2">{t('profile.province')}</label>
                  <div className="relative">
                    <Input 
                      value={formData.province}
                      onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
                      className="rounded-2xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/20"
                      placeholder={t('profile.provincePlaceholder')}
                    />
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium ml-2">แนะนำตัว</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 300) }))}
                    className="min-h-28 w-full resize-y rounded-2xl bg-muted/30 px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                    placeholder="เล่าเกี่ยวกับตัวคุณ ธุรกิจ หรือสิ่งที่อยากให้ชุมชนรู้จัก"
                    maxLength={300}
                  />
                  <p className="text-right text-[11px] text-muted-foreground">{formData.bio.length}/300</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 border-t border-border/60 pt-5 md:col-span-2">
              <h3 className="border-l-4 border-primary pl-3 text-xs font-black uppercase tracking-widest text-primary sm:text-sm">{t('profile.contactInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-2">{t('profile.phone')}</label>
                  <div className="relative">
                    <Input 
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-2xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/20"
                      placeholder="08x-xxx-xxxx"
                      type="tel"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-2">{t('profile.line')}</label>
                  <div className="relative">
                    <Input 
                      value={formData.line}
                      onChange={e => setFormData(prev => ({ ...prev, line: e.target.value }))}
                      className="rounded-2xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/20"
                      placeholder="@line_id"
                    />
                    <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium ml-2">{t('profile.facebook')}</label>
                  <div className="relative">
                    <Input 
                      value={formData.facebook}
                      onChange={e => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      className="rounded-2xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/20"
                      placeholder="facebook.com/your-profile"
                    />
                    <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Color Section */}
          <div className="space-y-5 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="border-l-4 border-primary pl-3 text-xs font-black uppercase tracking-widest text-primary sm:text-sm">ธีมสีหลัก</h3>
              <p className="text-xs text-muted-foreground">เลือกโทนสีพาสเทลที่ชอบ — มีผลทันทีทั่วทั้งแอป</p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {THEME_COLORS.map((theme) => {
                const isActive = activeTheme.id === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeColor(theme.id as ThemeColorId)}
                    className={[
                      'relative group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all duration-200',
                      isActive
                        ? 'border-primary bg-primary/10 shadow-md scale-105'
                        : 'border-transparent hover:border-border hover:bg-muted/40 hover:scale-[1.03]',
                    ].join(' ')}
                    title={theme.label}
                    aria-label={theme.label}
                    aria-pressed={isActive}
                  >
                    {/* Swatch circle */}
                    <span
                      className="w-10 h-10 rounded-full shadow-inner ring-2 ring-white/60 transition-transform"
                      style={{
                        background: `radial-gradient(circle at 38% 36%, ${theme.swatch}ee, ${theme.swatch}99)`,
                        boxShadow: isActive ? `0 0 0 3px ${theme.swatch}88` : undefined,
                      }}
                    />
                    <span className={['text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full', isActive ? 'text-primary' : 'text-muted-foreground'].join(' ')}>
                      {theme.label}
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow" aria-hidden="true">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Live preview strip */}
            <div className="flex items-center gap-3 mt-2 p-4 rounded-2xl bg-muted/30">
              <div
                className="w-10 h-10 rounded-xl shadow-md flex-shrink-0"
                style={{ background: activeTheme.swatch }}
              />
              <div>
                <p className="text-sm font-semibold">{activeTheme.label}</p>
                <p className="text-xs text-muted-foreground">ธีมปัจจุบัน · มีผลทันทีไม่ต้องบันทึก</p>
              </div>
              <div className="ml-auto w-7 h-7 rounded-full" style={{ background: activeTheme.swatch, boxShadow: `0 0 0 3px ${activeTheme.swatch}55` }} />
            </div>
          </div>

          {/* Sound Notifications Section */}
          <div className="space-y-5 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="flex items-center gap-2 border-l-4 border-primary pl-3 text-xs font-black uppercase tracking-widest text-primary sm:text-sm">
                <Bell className="w-4 h-4" />
                การแจ้งเตือนเสียง
              </h3>
              <p className="text-xs text-muted-foreground">ตั้งค่าเสียงแจ้งเตือนสำหรับการโต้ตอบในแอป</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">เปิดใช้งานเสียงแจ้งเตือน</p>
                    <p className="text-xs text-muted-foreground">รับเสียงแจ้งเตือนเมื่อมีการโต้ตอบ</p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={(checked) => {
                    setSoundEnabled(checked)
                    getSoundManager().setEnabled(checked)
                  }}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {soundEnabled && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">เลือกเสียงแจ้งเตือน</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SOUND_OPTIONS.map((sound) => (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => {
                          setNotificationSound(sound.id)
                          getSoundManager().setSoundType(sound.id)
                          if (soundEnabled) {
                            playSound(sound.id)
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                          notificationSound === sound.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        )}
                      >
                        <Volume2 className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{sound.name}</span>
                        {notificationSound === sound.id && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Volume Control */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">ระดับเสียง</p>
                      <span className="text-xs font-bold text-primary">{Math.round(volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newVolume = Math.max(0, volume - 0.1)
                          setVolume(newVolume)
                          setSoundVolume(newVolume)
                        }}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                        title="ลดเสียง"
                      >
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => {
                            const newVolume = parseFloat(e.target.value)
                            setVolume(newVolume)
                            setSoundVolume(newVolume)
                          }}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newVolume = Math.min(1, volume + 0.1)
                          setVolume(newVolume)
                          setSoundVolume(newVolume)
                        }}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                        title="เพิ่มเสียง"
                      >
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    
                    {/* Quick volume presets */}
                    <div className="flex items-center gap-2 mt-3">
                      {[0.2, 0.5, 0.8, 1.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setVolume(preset)
                            setSoundVolume(preset)
                            if (soundEnabled) {
                              playSound(notificationSound as any)
                            }
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            volume === preset
                              ? 'bg-primary text-white'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          )}
                        >
                          {Math.round(preset * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="space-y-5 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="flex items-center gap-2 border-l-4 border-primary pl-3 text-xs font-black uppercase tracking-widest text-primary sm:text-sm">
                <Shield className="w-4 h-4" />
                ความเป็นส่วนตัว
              </h3>
              <p className="text-xs text-muted-foreground">จัดการความเป็นส่วนตัวและการแสดงข้อมูลของคุณ</p>
            </div>

            <div className="space-y-4">
              {/* Profile Visibility */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    {profileVisibility === 'public' ? (
                      <Globe className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">การแสดงโปรไฟล์</p>
                    <p className="text-xs text-muted-foreground">
                      {profileVisibility === 'public' ? 'ทุกคนสามารถดูโปรไฟล์ของคุณ' : 'เฉพาะผู้ที่คุณอนุญาต'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProfileVisibility('public')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      profileVisibility === 'public'
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                  >
                    สาธารณะ
                  </button>
                  <button
                    onClick={() => setProfileVisibility('private')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      profileVisibility === 'private'
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                  >
                    ส่วนตัว
                  </button>
                </div>
              </div>

              {/* Contact Info Visibility */}
              <div className="space-y-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">การแสดงข้อมูลติดต่อ</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดงเบอร์โทรศัพท์</p>
                      <p className="text-xs text-muted-foreground">ผู้อื่นจะเห็นเบอร์โทรของคุณ</p>
                    </div>
                  </div>
                  <Switch
                    checked={showPhone}
                    onCheckedChange={setShowPhone}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดงอีเมล</p>
                      <p className="text-xs text-muted-foreground">ผู้อื่นจะเห็นอีเมลของคุณ</p>
                    </div>
                  </div>
                  <Switch
                    checked={showEmail}
                    onCheckedChange={setShowEmail}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดงที่อยู่/จังหวัด</p>
                      <p className="text-xs text-muted-foreground">ผู้อื่นจะเห็นจังหวัดของคุณ</p>
                    </div>
                  </div>
                  <Switch
                    checked={showLocation}
                    onCheckedChange={setShowLocation}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดง LINE</p>
                      <p className="text-xs text-muted-foreground">เปิดเผย LINE ในโปรไฟล์สาธารณะ</p>
                    </div>
                  </div>
                  <Switch checked={showLine} onCheckedChange={setShowLine} className="data-[state=checked]:bg-blue-500" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดง Facebook</p>
                      <p className="text-xs text-muted-foreground">เปิดเผย Facebook ในโปรไฟล์สาธารณะ</p>
                    </div>
                  </div>
                  <Switch checked={showFacebook} onCheckedChange={setShowFacebook} className="data-[state=checked]:bg-blue-500" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดงหมุดที่ปัก</p>
                      <p className="text-xs text-muted-foreground">ผู้เข้าชมจะเห็นหมุดของคุณในโปรไฟล์</p>
                    </div>
                  </div>
                  <Switch checked={showPins} onCheckedChange={setShowPins} className="data-[state=checked]:bg-blue-500" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <HeartHandshake className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">แสดงประวัติช่วยเหลือ</p>
                      <p className="text-xs text-muted-foreground">ผู้เข้าชมจะเห็นผลงาน Hero ของคุณ</p>
                    </div>
                  </div>
                  <Switch checked={showHeroHistory} onCheckedChange={setShowHeroHistory} className="data-[state=checked]:bg-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="h-12 w-full rounded-2xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 sm:h-14"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                {t('profile.saveProfile')}
              </div>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
