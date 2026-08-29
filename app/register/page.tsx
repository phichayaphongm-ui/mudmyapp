'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { 
  Eye, EyeOff, MapPin, Loader2, CheckCircle2, 
  ArrowRight, Shield, Zap, Users, 
  Building2, ArrowLeft, Globe
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

const PASSWORD_RULES = (t: any) => [
  { label: t('register.passwordRules.length'), test: (p: string) => p.length >= 8 },
  { label: t('register.passwordRules.uppercase'), test: (p: string) => /[A-Z]/.test(p) },
  { label: t('register.passwordRules.number'), test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [userType, setUserType] = useState<'personal' | 'business' | null>(null)
  const [businessName, setBusinessName] = useState('')
  const router = useRouter()
  const { user, loading: authLoading, signUpWithEmail, signInWithGoogle, signInWithFacebook, signInWithLine } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return
    
    setLoading(true)
    setError('')
    
    try {
      await signUpWithEmail(email, password, name, {
        userType: userType || 'personal',
        businessName: userType === 'business' ? businessName : undefined,
      })
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error?.message || error)
      setError(error?.message || t('register.error'))
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch (error) {
      console.error('Google registration error:', error)
      setError(t('login.error'))
    }
  }

  const handleFacebookRegister = async () => {
    try {
      await signInWithFacebook()
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'เข้าสู่ระบบด้วย Facebook ไม่สำเร็จ')
    }
  }

  const handleLineRegister = async () => {
    try {
      await signInWithLine()
      router.push('/dashboard')
    } catch (error) {
      console.error('Line registration error:', error)
      setError('การสมัครสมาชิกด้วย LINE ยังไม่ได้เปิดใช้งานในระบบ')
    }
  }

  const rules = PASSWORD_RULES(t)
  const passwordStrength = rules.filter(r => r.test(password)).length

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 relative overflow-hidden border-r border-white/5 bg-slate-950">
        {/* Background Image with sophisticated Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] scale-110 hover:scale-100" 
          style={{ backgroundImage: "url('/loginpicture.jpg')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-secondary/20" />
        <div className="absolute inset-0 z-0 backdrop-blur-[1px]" />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg space-y-10"
        >
          {/* Logo Section - Floating effect */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-6"
          >
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-secondary to-blue-600 flex items-center justify-center shadow-2xl shadow-secondary/40 border border-white/20 backdrop-blur-xl">
              <MapPin className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-6xl font-black text-white tracking-tighter italic drop-shadow-2xl">
                {t('navbar.logoText')}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="h-[3px] w-12 bg-secondary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                <p className="text-sm font-bold text-secondary tracking-[0.3em] uppercase drop-shadow-md">Join Our Network</p>
              </div>
            </div>
          </motion.div>
          
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight drop-shadow-xl">
              {t('register.subtitle').split('! ')[0]}!<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-400 italic">
                {t('register.subtitle').split('! ')[1]}
              </span>
            </h2>
            <p className="text-xl text-slate-300/90 leading-relaxed font-medium max-w-md drop-shadow-md">
              {t('createPin.freeCharge')} - {t('landing.hero.title')}
            </p>
          </div>

          <div className="space-y-4">
            {(t('register.benefits') as any).map((text: string, i: number) => {
              const icons = [MapPin, Users, Zap, Shield];
              const colors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-violet-400'];
              const Icon = icons[i] || Zap;
              return (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  whileHover={{ x: 10, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  className="flex items-center gap-4 p-5 rounded-[24px] bg-white/10 border border-white/20 backdrop-blur-xl transition-all duration-300 group cursor-default"
                >
                  <div className={cn("p-3 rounded-2xl bg-slate-950/40 group-hover:scale-110 transition-transform shadow-inner", colors[i])}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">{text}</span>
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between p-8 rounded-[32px] bg-gradient-to-r from-white/10 to-white/5 border border-white/20 backdrop-blur-md shadow-2xl">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white tracking-tighter">10฿</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">/ 30 {t('pinCard.daysShort')}</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-secondary/20 border border-secondary/30 shadow-inner">
              <span className="text-xs font-black text-secondary uppercase tracking-[0.2em]">{t('createPin.bestValue')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative overflow-y-auto">
        {/* Mobile Background Decoration (Visible only on small screens) */}
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.08] grayscale" 
            style={{ backgroundImage: "url('/loginpicture.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-secondary/5" />
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[40%] bg-secondary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[60%] h-[30%] bg-primary/10 rounded-full blur-[80px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md space-y-8 sm:space-y-10 relative z-10 py-6 sm:py-10"
        >
          {/* Back button for mobile */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 text-sm font-black text-muted-foreground hover:text-primary transition-all group uppercase tracking-widest ml-1"
          >
            <div className="p-2.5 rounded-xl bg-muted/50 backdrop-blur-sm group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            {t('common.back')}
          </Link>

          {/* Mobile Header - More Premium Look */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-6 mb-12">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-secondary to-blue-600 flex items-center justify-center shadow-2xl border border-white/20">
                <MapPin className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-foreground tracking-tighter italic">
                {t('navbar.logoText')}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <span className="h-[2px] w-8 bg-secondary/50 rounded-full" />
                <p className="text-[10px] font-black text-secondary tracking-[0.4em] uppercase">Join Our Network</p>
                <span className="h-[2px] w-8 bg-secondary/50 rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-4 px-2">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground drop-shadow-sm">{t('register.title')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground font-semibold leading-snug">
              {userType === 'business' ? t('register.accountType.business') : t('register.subtitle')}
            </p>
          </div>

          {/* Social Logins for Register - Glassmorphism for mobile */}
          {!userType && (
            <div className="space-y-8 px-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'google', icon: <GoogleIcon />, onClick: handleGoogleRegister, hover: 'active:bg-red-50 active:border-red-200' },
                  { id: 'facebook', icon: <FacebookIcon />, onClick: handleFacebookRegister, hover: 'active:bg-blue-50 active:border-blue-200' },
                  { id: 'line', icon: <LineIcon />, onClick: handleLineRegister, hover: 'active:bg-green-50 active:border-green-200' }
                ].map((social) => (
                  <motion.button
                    key={social.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={social.onClick}
                    className={cn(
                      "h-16 flex items-center justify-center rounded-[24px] border border-border/60 bg-muted/40 backdrop-blur-sm transition-all duration-300 shadow-sm",
                      social.hover
                    )}
                  >
                    {social.icon}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-6 py-2 px-4">
                <Separator className="flex-1 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{t('login.or')}</span>
                <Separator className="flex-1 opacity-50" />
              </div>
            </div>
          )}

          {!userType ? (
            <div className="grid grid-cols-1 gap-6 px-1">
              <motion.button
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserType('personal')}
                className="group relative p-8 rounded-[32px] bg-muted/40 border-2 border-transparent hover:border-primary/50 hover:bg-background transition-all text-left overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-5">
                  <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors shadow-inner">
                    <Users className="w-8 h-8 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{t('register.accountType.personal')}</h3>
                    <p className="text-sm text-muted-foreground font-bold mt-2 leading-relaxed">{t('register.accountType.personalDesc')}</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserType('business')}
                className="group relative p-8 rounded-[32px] bg-muted/40 border-2 border-transparent hover:border-secondary/50 hover:bg-background transition-all text-left overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Building2 className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-5">
                  <div className="w-16 h-16 rounded-[24px] bg-secondary/10 flex items-center justify-center group-hover:bg-secondary transition-colors shadow-inner">
                    <Building2 className="w-8 h-8 text-secondary group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{t('register.accountType.business')}</h3>
                    <p className="text-sm text-muted-foreground font-bold mt-2 leading-relaxed">{t('register.accountType.businessDesc')}</p>
                  </div>
                </div>
              </motion.button>
            </div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegister} 
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-3 group">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                    {t('register.name')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-[24px] h-16 pl-14 bg-muted/40 border-border/60 focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all font-bold text-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                    {t('register.email')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[24px] h-16 pl-14 bg-muted/40 border-border/60 focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all font-bold text-lg"
                      required
                    />
                  </div>
                </div>

                {userType === 'business' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-2"
                  >
                    <Separator className="opacity-50" />
                    <div className="space-y-3 group">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-secondary transition-colors">
                        {t('register.businessName')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <Input
                          placeholder="Business Name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="rounded-[24px] h-16 pl-14 bg-muted/40 border-border/60 focus:bg-background focus:ring-8 focus:ring-secondary/5 transition-all font-bold text-lg"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3 group">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                    {t('register.password')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-[24px] h-16 pl-14 pr-14 bg-muted/40 border-border/60 focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all font-bold text-lg"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {password && (
                    <div className="pt-3 space-y-3 ml-1">
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-2 flex-1 rounded-full transition-all duration-700 shadow-inner",
                              i <= passwordStrength ? (passwordStrength === 3 ? "bg-emerald-500" : "bg-primary") : "bg-muted"
                            )} 
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {rules.map((r, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                              r.test(password) ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/30"
                            )}>
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <span className={cn("text-[11px] font-black uppercase tracking-tighter transition-colors", r.test(password) ? "text-foreground" : "text-muted-foreground/50")}>
                              {r.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-[24px] bg-muted/30 border border-border/50 group cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="relative flex items-center pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-muted-foreground/30 text-primary focus:ring-primary transition-all cursor-pointer"
                  />
                </div>
                <label htmlFor="agree" className="text-xs font-bold text-muted-foreground leading-relaxed cursor-pointer select-none">
                  ฉันยอมรับ <Link href="/terms" className="text-primary font-black hover:underline">เงื่อนไขการใช้บริการ</Link> และ <Link href="/privacy" className="text-primary font-black hover:underline">นโยบายความเป็นส่วนตัว</Link>
                </label>
              </div>
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-2xl border border-destructive/20 text-center animate-in fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  className={cn(
                    "w-full rounded-[24px] h-20 font-black text-xl gap-4 shadow-2xl shadow-primary/30",
                    "bg-gradient-to-r from-primary via-orange-500 to-orange-600 hover:scale-[1.02] active:scale-[0.98]",
                    "transition-all duration-300 relative overflow-hidden group",
                    !agreed && "opacity-50 cursor-not-allowed grayscale"
                  )}
                  disabled={loading || !agreed}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      {t('register.title')}
                      <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUserType(null)}
                  className="w-full h-12 text-xs font-black text-muted-foreground hover:text-foreground uppercase tracking-[0.2em]"
                >
                  {t('common.back')}
                </Button>
              </div>
            </motion.form>
          )}

          <div className="pt-8 border-t border-border/50 text-center">
            <div className="text-base font-bold text-muted-foreground">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-primary font-black hover:underline ml-2 transition-all hover:scale-105">
                เข้าสู่ระบบ
              </Link>
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

function LineIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#00C300">
      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.514 8.888 8.441 9.605.663.14 1.564.428 1.803 1.05.216.564.14 1.45.068 2.029-.089.7-.428 2.58-1 3.29-.445.553-.356.666-.356.666s.09.02.268.046c1.65.234 5.972-2.316 8.57-4.633 3.903-3.064 6.206-6.425 6.206-12.053z"/>
    </svg>
  )
}
