'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MapPin, Plus, Settings, CreditCard, BarChart3, Eye, Clock,
  Trash2, RefreshCw, Edit3, CheckCircle2, TrendingUp,
  User, Shield, ChevronRight, HeartHandshake, MousePointerClick,
  Sparkles, Package, Volume2, VolumeX, Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import { getUserPins, checkInFreePin, renewPaidPin } from '@/lib/services/pins'
import { getUserPayments } from '@/lib/services/payments'
import type { Pin, Payment } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getUserDailyAnalytics, type DailyAnalytics } from '@/lib/services/analytics'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ShoppingBag, Wrench, Briefcase, Building2, Car, Loader2 } from 'lucide-react'
import { getSoundManager, playSound, setSoundVolume, SOUND_OPTIONS } from '@/lib/utils/sounds'

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Wrench, Briefcase, HeartHandshake, Building2, Car,
}

const MAX_PINS = 5

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('pins')
  const [pins, setPins] = useState<Pin[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingPinId, setLoadingPinId] = useState<string | null>(null)
  
  // Sound notification settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationSound, setNotificationSound] = useState('default')
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    const manager = getSoundManager()
    setSoundEnabled(manager.isEnabled())
    setNotificationSound(manager.getSoundType())
    setVolume(manager.getVolume())
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoadingData(true)
        try {
          const [fetchedPins, fetchedPayments] = await Promise.all([
            getUserPins(user.id),
            getUserPayments(user.id)
          ])
          setPins(fetchedPins)
          setPayments(fetchedPayments)
          setLoadingData(false)
          const pinIds = fetchedPins.map(p => p.id)
          if (pinIds.length > 0) {
            getUserDailyAnalytics(pinIds, 7).then(analytics => {
              setDailyAnalytics(analytics)
            }).catch(console.error)
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error)
          setLoadingData(false)
        }
      }
    }
    fetchData()
  }, [user])

  if (authLoading || (user && loadingData)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar isLoggedIn={!!user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const activePins = pins.filter((p) => p.status === 'active')
  const historyPins = pins.filter((p) => p.status === 'expired' || p.status === 'resolved')
  
  const handleCheckIn = async (pinId: string) => {
    setLoadingPinId(pinId)
    try {
      await checkInFreePin(pinId)
      const fetchedPins = await getUserPins(user.id)
      setPins(fetchedPins)
      // Play success sound
      if (soundEnabled) {
        playSound('notification')
      }
    } catch (error) {
      console.error('Failed to check in:', error)
      // Play error sound
      if (soundEnabled) {
        playSound('gentle')
      }
    } finally {
      setLoadingPinId(null)
    }
  }

  const handleRenew = async (pinId: string) => {
    setLoadingPinId(pinId)
    try {
      await renewPaidPin(pinId)
      const fetchedPins = await getUserPins(user.id)
      setPins(fetchedPins)
      // Play success sound
      if (soundEnabled) {
        playSound('chime')
      }
    } catch (error) {
      console.error('Failed to renew:', error)
      // Play error sound
      if (soundEnabled) {
        playSound('gentle')
      }
    } finally {
      setLoadingPinId(null)
    }
  }

  const totalViews = pins.reduce((sum, pin) => sum + pin.views, 0)
  const totalClicks = pins.reduce((sum, pin) => sum + pin.clicks, 0)
  const totalSpent = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={!!user} />

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* ─── Hero Header ─────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-primary via-primary/90 to-secondary p-6 shadow-xl shadow-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-4 ring-white/30">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    {(user.nickname || user.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">ยินดีต้อนรับกลับ</p>
                <h1 className="text-white text-xl font-black truncate max-w-[180px]">
                  {user.nickname || user.name}
                </h1>
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] gap-1 mt-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {user.plan === 'enterprise' ? 'Enterprise' : 'General'}
                </Badge>
              </div>
            </div>
            <Link href="/create-pin">
              <Button className="rounded-2xl bg-white text-primary hover:bg-white/90 font-bold shadow-lg gap-2 text-sm px-5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">ปักหมุด</span>
              </Button>
            </Link>
          </div>

          {/* Quick stats row */}
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'หมุดใช้งาน', value: activePins.length, icon: MapPin },
              { label: 'ยอดเข้าชม', value: totalViews.toLocaleString(), icon: Eye },
              { label: 'คลิกทั้งหมด', value: totalClicks.toLocaleString(), icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <s.icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <p className="text-white font-black text-lg leading-none">{s.value}</p>
                <p className="text-white/60 text-[10px] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-2xl bg-muted/60 p-1 h-auto grid grid-cols-4 mb-6">
            <TabsTrigger value="pins" className="rounded-xl text-xs font-semibold py-2.5 gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <MapPin className="w-3.5 h-3.5" />หมุดของฉัน
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold py-2.5 gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <BarChart3 className="w-3.5 h-3.5" />สถิติ
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl text-xs font-semibold py-2.5 gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <CreditCard className="w-3.5 h-3.5" />ชำระเงิน
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-xs font-semibold py-2.5 gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Settings className="w-3.5 h-3.5" />ตั้งค่า
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: หมุดของฉัน ─────────────────────────────────── */}
          <TabsContent value="pins" className="space-y-5 animate-in fade-in duration-300">

            {/* Pin quota */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" /> โควตาหมุด
                </span>
                <span className="text-xs font-bold text-primary">{activePins.length} / {MAX_PINS}</span>
              </div>
              <Progress value={(activePins.length / MAX_PINS) * 100} className="h-2 rounded-full" />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                เหลือ {MAX_PINS - activePins.length} หมุดที่สามารถปักได้
              </p>
            </div>

            {/* Active Pins */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                หมุดที่ใช้งานอยู่
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">{activePins.length}</Badge>
              </h2>

              {activePins.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="font-bold text-foreground mb-1">ยังไม่มีหมุดที่ใช้งาน</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    เริ่มปักหมุดแรกของคุณเพื่อประกาศสินค้าหรือบริการ
                  </p>
                  <Link href="/create-pin">
                    <Button className="rounded-2xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 gap-2">
                      <Plus className="w-4 h-4" /> ปักหมุดแรกเลย
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePins.map((pin) => {
                    const cat = CATEGORIES.find((c) => c.id === pin.category)
                    const Icon = cat ? (ICON_MAP[cat.icon] || MapPin) : MapPin
                    return (
                      <div key={pin.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="flex">
                          {pin.images && pin.images.length > 0 ? (
                            <img
                              src={pin.images[0]}
                              alt={pin.title}
                              className="w-28 sm:w-36 h-auto object-cover shrink-0 self-stretch"
                            />
                          ) : (
                            <div className={cn('w-28 sm:w-36 min-h-[120px] flex items-center justify-center shrink-0', cat?.bgColor || 'bg-muted')}>
                              <Icon className={cn('w-8 h-8', cat?.color || 'text-muted-foreground')} />
                            </div>
                          )}

                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Link href={`/pin/${pin.id}`} className="font-bold text-foreground line-clamp-1 hover:text-primary transition-colors text-sm">
                                {pin.title}
                              </Link>
                              <div className="flex gap-1 shrink-0">
                                {pin.isFreePin && (
                                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-200 px-1.5 py-0">Free</Badge>
                                )}
                                <Badge className="text-[9px] bg-emerald-500 text-white border-0 px-1.5 py-0">ใช้งาน</Badge>
                              </div>
                            </div>

                            {cat && (
                              <Badge variant="outline" className={cn('text-[9px] mb-2 py-0', cat.bgColor, cat.color)}>
                                {t('categories.' + cat.id)}
                              </Badge>
                            )}

                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                              {[
                                { label: 'ยอดชม', value: pin.views, icon: Eye },
                                { label: 'คลิก', value: pin.clicks, icon: MousePointerClick },
                                { label: 'วันเหลือ', value: pin.daysLeft, icon: Clock },
                              ].map((s) => (
                                <div key={s.label} className="bg-muted/60 rounded-xl p-1.5 text-center">
                                  <s.icon className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
                                  <p className="font-bold text-xs text-foreground">{s.value}</p>
                                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/pin/${pin.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs h-8 gap-1">
                                  <Eye className="w-3 h-3" /> ดูหมุด
                                </Button>
                              </Link>
                              {pin.isFreePin ? (
                                <Button
                                  size="sm"
                                  className="flex-1 rounded-xl text-xs h-8 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() => handleCheckIn(pin.id)}
                                  disabled={loadingPinId === pin.id}
                                >
                                  {loadingPinId === pin.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <CheckCircle2 className="w-3 h-3" />}
                                  เช็คอิน
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1 rounded-xl text-xs h-8 gap-1 bg-primary text-white"
                                  onClick={() => handleRenew(pin.id)}
                                  disabled={loadingPinId === pin.id}
                                >
                                  {loadingPinId === pin.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <RefreshCw className="w-3 h-3" />}
                                  ต่ออายุ
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* History Pins */}
            {historyPins.length > 0 && (
              <div className="pt-2">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  ประวัติหมุด
                  <Badge variant="secondary" className="text-[10px]">{historyPins.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {historyPins.map((pin) => {
                    const isResolved = pin.status === 'resolved'
                    const cat = CATEGORIES.find((c) => c.id === pin.category)
                    const Icon = cat ? (ICON_MAP[cat.icon] || MapPin) : MapPin
                    return (
                      <div key={pin.id} className="bg-card border border-border/50 rounded-2xl p-3 flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', cat?.bgColor || 'bg-muted')}>
                          <Icon className={cn('w-5 h-5', cat?.color || 'text-muted-foreground')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/pin/${pin.id}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-1">
                            {pin.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {isResolved ? 'เสร็จสิ้น' : 'หมดอายุ'} · {new Date(pin.expiresAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <Badge
                          className={cn('text-[10px] shrink-0', isResolved ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground')}
                        >
                          {isResolved ? 'เสร็จสิ้น' : 'หมดอายุ'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab: สถิติ ────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'หมุดใช้งาน', value: activePins.length, icon: MapPin, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'ยอดเข้าชม', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'คลิกทั้งหมด', value: totalClicks.toLocaleString(), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'ยอดชำระ', value: `${totalSpent.toLocaleString()} ฿`, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {pins.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">ยังไม่มีข้อมูลสถิติ</p>
                <p className="text-xs text-muted-foreground/60 mt-1">ปักหมุดก่อนเพื่อดูสถิติ</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground">ยอดชม vs คลิก (7 วัน)</h3>
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">7 วันล่าสุด</Badge>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyAnalytics.map(d => ({ ...d, date: d.date.slice(5) }))}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="views" name="ยอดชม" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="clicks" name="คลิก" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab: ชำระเงิน ────────────────────────────────────── */}
          <TabsContent value="payments" className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> ประวัติการชำระเงิน
              </h2>
              {payments.length === 0 ? (
                <div className="text-center py-10">
                  <CreditCard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการชำระเงิน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', payment.status === 'paid' ? 'bg-emerald-500/10' : 'bg-destructive/10')}>
                        <CreditCard className={cn('w-5 h-5', payment.status === 'paid' ? 'text-emerald-500' : 'text-destructive')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">ชำระหมุด ({payment.method.toUpperCase()})</p>
                        <p className="text-xs text-muted-foreground">{payment.createdAt.split('T')[0]}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">{payment.amount} ฿</p>
                        <Badge className={cn('text-[10px]', payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20')}>
                          {payment.status === 'paid' ? 'ชำระแล้ว' : 'ล้มเหลว'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Tab: ตั้งค่า ─────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-4 animate-in fade-in duration-300">
            {/* Profile */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> โปรไฟล์ของฉัน
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg font-bold">
                    {(user.nickname || user.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">{user.nickname || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs border-primary/20 text-primary">
                    {user.plan === 'enterprise' ? 'Enterprise' : 'General'}
                  </Badge>
                </div>
              </div>
              <Link href={`/profile/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full rounded-2xl gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> แก้ไขโปรไฟล์
                </Button>
              </Link>
            </div>

            {/* Sound Notifications */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> การแจ้งเตือนเสียง
              </h2>
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

            {/* Security */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> ความปลอดภัย
              </h2>
              <div className="space-y-2">
                {['เปลี่ยนรหัสผ่าน', 'การยืนยันสองขั้นตอน', 'อุปกรณ์ที่เข้าสู่ระบบ'].map((label) => (
                  <Button key={label} variant="outline" className="w-full justify-between rounded-2xl text-sm font-normal">
                    {label}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                ))}
                <Link href="/dashboard/blocked-users" className="block w-full">
                  <Button variant="outline" className="w-full justify-between rounded-2xl text-sm font-normal border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> รายชื่อที่ถูกบล็อก
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

