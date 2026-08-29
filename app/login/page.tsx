'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Eye, EyeOff, MapPin, Loader2, Sparkles, 
  ArrowRight, ShieldCheck, Zap, Users,
  Globe, Star
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { LoginPromotionModal } from '@/components/login-promotion-modal'

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, loading: authLoading, signInWithEmail, signInWithGoogle, signInWithFacebook } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmail(email, password)
      router.push('/dashboard')
    } catch (_err: any) {
      setError(t('login.error'))
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      if (user) router.push('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ')
    }
  }

  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook()
      if (user) router.push('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'เข้าสู่ระบบด้วย Facebook ไม่สำเร็จ')
    }
  }

  const handlePhoneLogin = () => undefined

  const features = [
    { icon: MapPin, title: t('landing.benefits.items.0.title'), color: 'text-blue-400' },
    { icon: Zap, title: t('landing.benefits.items.1.title'), color: 'text-amber-400' },
    { icon: ShieldCheck, title: t('landing.benefits.items.2.title'), color: 'text-emerald-400' },
    { icon: Users, title: t('landing.benefits.items.3.title'), color: 'text-purple-400' }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <LoginPromotionModal />
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 relative overflow-hidden border-r border-white/5">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] scale-110 hover:scale-100" 
          style={{ backgroundImage: "url('/landingapp.jpg')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_30%)]" />

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[650px]"
        >
          <div className="pt-[190px] flex min-h-[760px] flex-col justify-end">
            <div className="space-y-5 max-w-[560px]">
              <h2 className="text-[2rem] xl:text-[2.8rem] font-extrabold text-white leading-[0.78] tracking-tight drop-shadow-[0_10px_22px_rgba(0,0,0,0.38)] [text-shadow:0_1px_0_rgba(0,0,0,0.98),0_2px_0_rgba(0,0,0,0.96),0_3px_0_rgba(0,0,0,0.94),0_4px_0_rgba(0,0,0,0.92),0_6px_12px_rgba(0,0,0,0.28)]">
                {t('login.subtitle').split('\n').map((line, i) => (
                  <span key={i} className="block" style={{ marginBottom: i === 0 ? '0.22em' : 0 }}>
                    {i === 1 ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-amber-500 italic [text-shadow:none]">
                        {line}
                      </span>
                    ) : line}
                  </span>
                ))}
              </h2>
              <p className="max-w-md text-lg text-white/95 leading-relaxed font-medium drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]">
                {t('metadata.description')}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 max-w-[620px]">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  whileHover={{ y: -4 }}
                  className="flex items-center gap-4 rounded-[24px] border border-white/20 bg-white/12 p-4 backdrop-blur-sm shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
                >
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/20 shadow-inner ring-1 ring-white/15", f.color)}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">{f.title}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-[30px] border border-white/20 bg-white/10 p-5 backdrop-blur-sm shadow-[0_18px_40px_rgba(17,24,39,0.15)]">
              {[
                { val: '50K+', lab: t('navbar.user') },
                { val: '120K+', lab: t('map.pinCount') },
                { val: '77', lab: t('profile.province') }
              ].map((s, i) => (s.val && (
                <div key={i} className="flex-1 text-center">
                  <p className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">{s.val}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/80 font-black">{s.lab}</p>
                </div>
              )))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-6 flex gap-4 rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-sm shadow-[0_12px_24px_rgba(16,185,129,0.12)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200 shadow-inner">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div className="space-y-1">
                <p className="text-base text-slate-100 italic font-medium leading-relaxed">
                  "{t('login.testimonial')}"
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                  คุณสมหญิง, เจ้าของธุรกิจออนไลน์
                </p>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative overflow-y-auto">
        {/* Mobile Background Decoration (Visible only on small screens) */}
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Base Light Orange/Peach Tint */}
          <div className="absolute inset-0 bg-[#FFF5EE]" />
          
          {/* Subtle Map Texture Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-multiply" 
            style={{ backgroundImage: "url('/landingapp.jpg')" }}
          />
          
          {/* Soft Orange Glow from top */}
          <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-orange-200/40 via-orange-100/20 to-transparent" />
          
          {/* Decorative Map-like Elements (Circles & Lines) */}
          <div className="absolute top-[10%] left-[-10%] w-40 h-40 border border-orange-200/30 rounded-full" />
          <div className="absolute top-[25%] right-[-5%] w-24 h-24 border border-orange-200/20 rounded-full" />
          <div className="absolute top-[40%] left-[20%] w-2 h-2 bg-orange-300/20 rounded-full" />
          
          {/* Subtle diagonal line */}
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-orange-200/20 via-orange-200/5 to-transparent -rotate-12 transform origin-top" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[420px] relative z-10 py-6 sm:py-10"
        >
          <div className="rounded-[30px] border border-white/40 bg-[#f4efe9]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[2.2rem] font-black tracking-tighter text-[#1d1d1d]">{t('login.title')}</h2>
                <p className="mt-2 text-sm text-[#4a4a4a]">ยินดีต้อนรับกลับ! <span className="font-semibold">เข้าสู่ระบบเพื่อจัดการหมุดของคุณ</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'google', icon: <GoogleIcon />, onClick: handleGoogleLogin },
                  { id: 'facebook', icon: <FacebookIcon />, onClick: handleFacebookLogin }
                ].map((social) => (
                  <motion.button
                    key={social.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={social.onClick}
                    className="h-16 flex items-center justify-center rounded-[22px] border border-[#d7d2cc] bg-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-orange-200 hover:bg-orange-50"
                  >
                    {social.icon}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-3 px-1">
                <Separator className="flex-1 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{t('login.or')}</span>
                <Separator className="flex-1 opacity-50" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#3b3b3b] pl-1">
                    {t('login.email')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5a5a]">
                      <Globe className="w-5 h-5" />
                    </div>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[18px] h-14 pl-12 bg-white/65 border-[#d8d3ce] focus:bg-white focus:ring-6 focus:ring-orange-100 transition-all font-bold text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <label className="block text-sm font-bold text-[#3b3b3b]">
                      {t('login.password')}
                    </label>
                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                      ลืมรหัสผ่าน?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5a5a]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-[18px] h-14 pl-12 pr-12 bg-white/65 border-[#d8d3ce] focus:bg-white focus:ring-6 focus:ring-orange-100 transition-all font-bold text-base"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a5a] hover:text-primary transition-colors p-1"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-[18px] flex items-center gap-3 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <span className="text-xs">!</span>
                      </div>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className={cn(
                    "w-full rounded-[20px] h-16 font-black text-[1.7rem] gap-3 shadow-[0_10px_20px_rgba(245,124,31,0.25)]",
                    "bg-[#f57c1f] hover:bg-[#ea6f12] active:scale-[0.98] border border-orange-400/40",
                    "transition-all duration-300 relative overflow-hidden group"
                  )}
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {loading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      {t('login.loginBtn')}
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="mt-4 pt-4 border-t border-[#d8d3ce]/80 text-center">
              <div className="text-sm font-bold text-[#4d4d4d]">
                {t('login.noAccount')}{' '}
                <Link href="/register" className="text-primary font-black hover:underline inline-flex items-center gap-2 ml-2">
                  {t('login.register')}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper icons for social login
function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 18 18">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

