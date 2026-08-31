'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  Filter,
  MapPin,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  ADMIN_EMAIL,
  banUserByAdmin,
  deletePinByAdmin,
  getAdminOverview,
  getAllAdminPins,
  getAllAdminUsers,
  isAdminEmail,
  unbanUserByAdmin,
} from '@/lib/services/admin'
import type { Pin, User } from '@/lib/types'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalPins: 0,
    activePins: 0,
    bannedUsers: 0,
    newUsersThisMonth: 0,
    newPinsThisMonth: 0,
  })
  const [pins, setPins] = useState<Pin[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pinSearch, setPinSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [pinStatus, setPinStatus] = useState<'all' | 'active' | 'expired' | 'resolved'>('all')
  const [pinSortBy, setPinSortBy] = useState<'created_at' | 'views' | 'clicks' | 'rating' | 'title'>('created_at')
  const [pinOrder, setPinOrder] = useState<'asc' | 'desc'>('desc')
  const [userSortBy, setUserSortBy] = useState<'created_at' | 'name' | 'rating' | 'active_pins'>('created_at')
  const [userOrder, setUserOrder] = useState<'asc' | 'desc'>('desc')
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [busyPinId, setBusyPinId] = useState<string | null>(null)

  const isAdmin = useMemo(() => {
    const emailMatches = isAdminEmail(user?.email)
    const flagMatches = Boolean(user?.isAdmin)
    return emailMatches || flagMatches
  }, [user?.email, user?.isAdmin])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!authLoading && user && !isAdmin) {
      router.push('/dashboard')
      return
    }

    if (!authLoading && user && isAdmin) {
      loadAdminData()
    }
  }, [authLoading, user, isAdmin, router])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [overviewData, pinData, userData] = await Promise.all([
        getAdminOverview(),
        getAllAdminPins({
          search: pinSearch,
          status: pinStatus,
          sortBy: pinSortBy,
          order: pinOrder,
        }),
        getAllAdminUsers({
          search: userSearch,
          sortBy: userSortBy,
          order: userOrder,
        }),
      ])

      setOverview(overviewData)
      setPins(pinData)
      setUsers(userData)
    } catch (error) {
      console.error('Admin data load failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadAdminData()
    }
  }, [pinSearch, userSearch, pinStatus, pinSortBy, pinOrder, userSortBy, userOrder])

  const handleDeletePin = async (pinId: string) => {
    if (!confirm('ต้องการลบหมุดนี้ใช่หรือไม่')) return
    setBusyPinId(pinId)
    try {
      await deletePinByAdmin(pinId)
      setPins((current) => current.filter((pin) => pin.id !== pinId))
    } finally {
      setBusyPinId(null)
    }
  }

  const handleBanUser = async (userId: string, permanent = false) => {
    setBusyUserId(userId)
    try {
      await banUserByAdmin(userId, {
        permanent,
        days: permanent ? undefined : 7,
        reason: permanent ? 'Permanent admin ban' : 'Admin ban for 7 days',
      })
      await loadAdminData()
    } finally {
      setBusyUserId(null)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    setBusyUserId(userId)
    try {
      await unbanUserByAdmin(userId)
      await loadAdminData()
    } finally {
      setBusyUserId(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        กำลังตรวจสอบสิทธิ์เข้าถึง...
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-foreground">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">บัญชีนี้ไม่มีสิทธิ์เข้าหน้า Admin</p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Mudmy Admin</p>
            <h1 className="text-3xl font-black text-foreground">System Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
              {user.email === ADMIN_EMAIL ? 'Super Admin' : 'Admin'}
            </span>
            <Link href="/dashboard" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
              กลับ Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'ผู้ใช้ทั้งหมด', value: overview.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-700' },
            { label: 'หมุดทั้งหมด', value: overview.totalPins, icon: MapPin, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'หมุดใช้งาน', value: overview.activePins, icon: CheckCircle2, color: 'bg-violet-100 text-violet-700' },
            { label: 'ผู้ใช้ถูกแบน', value: overview.bannedUsers, icon: Ban, color: 'bg-rose-100 text-rose-700' },
            { label: 'ผู้ใช้ใหม่เดือนนี้', value: overview.newUsersThisMonth, icon: Users, color: 'bg-amber-100 text-amber-700' },
            { label: 'หมุดใหม่เดือนนี้', value: overview.newPinsThisMonth, icon: Eye, color: 'bg-cyan-100 text-cyan-700' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">รายการหมุด</h2>
                <p className="text-xs text-muted-foreground">Filter, Search, Sort และลบหมุด</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={pinSearch}
                    onChange={(e) => setPinSearch(e.target.value)}
                    placeholder="ค้นหาหมุด"
                    className="rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none ring-0"
                  />
                </div>
                <select
                  value={pinStatus}
                  onChange={(e) => setPinStatus(e.target.value as 'all' | 'active' | 'expired' | 'resolved')}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={pinSortBy}
                  onChange={(e) => setPinSortBy(e.target.value as 'created_at' | 'views' | 'clicks' | 'rating' | 'title')}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="created_at">วันที่ล่าสุด</option>
                  <option value="views">Views</option>
                  <option value="clicks">Clicks</option>
                  <option value="rating">Rating</option>
                  <option value="title">Title</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPinOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {pinOrder === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>

            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 font-medium">Owner</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Views</th>
                    <th className="py-2 pr-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((pin) => (
                    <tr key={pin.id} className="border-b border-border/70 align-top">
                      <td className="py-3 pr-3">
                        <Link href={`/pin/${pin.id}`} className="block font-semibold text-foreground transition-colors hover:text-primary">
                          {pin.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">{pin.category}</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {pin.ownerName || 'Unknown'}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${pin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : pin.status === 'expired' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                          {pin.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{pin.views}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/pin/${pin.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            ดู
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePin(pin.id)}
                            disabled={busyPinId === pin.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {busyPinId === pin.id ? 'ลบ...' : 'ลบ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pins.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        ไม่มีรายการหมุดที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-foreground">ผู้ใช้งาน</h2>
                <p className="text-xs text-muted-foreground">Ban / Unban / ดูข้อมูล</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ค้นหา user"
                  className="rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none ring-0"
                />
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <select
                value={userSortBy}
                onChange={(e) => setUserSortBy(e.target.value as 'created_at' | 'name' | 'rating' | 'active_pins')}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="created_at">วันที่สร้าง</option>
                <option value="name">ชื่อ</option>
                <option value="rating">Rating</option>
                <option value="active_pins">Active Pins</option>
              </select>
              <button
                type="button"
                onClick={() => setUserOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {userOrder === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-auto">
              {users.map((item) => {
                const isBanned = !!item.isPermanentlyBanned || (!!item.bannedUntil && new Date(item.bannedUntil) > new Date())
                return (
                  <div key={item.id} className="rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-foreground">{item.name || item.nickname || 'User'}</div>
                          {isBanned && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">BANNED</span>}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span className="rounded-full bg-slate-100 px-2 py-1">Plan: {item.plan}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">Pins: {item.activePins}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">Rating: {item.rating}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/profile/${item.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700 transition-colors hover:bg-sky-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูข้อมูล
                        </Link>
                        {isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleUnbanUser(item.id)}
                            disabled={busyUserId === item.id}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 disabled:opacity-60"
                          >
                            {busyUserId === item.id ? 'กำลังยกเลิก...' : 'Unban'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleBanUser(item.id, false)}
                              disabled={busyUserId === item.id}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 disabled:opacity-60"
                            >
                              {busyUserId === item.id ? 'กำลังแบน...' : 'Ban 7d'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBanUser(item.id, true)}
                              disabled={busyUserId === item.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 disabled:opacity-60"
                            >
                              {busyUserId === item.id ? 'กำลังแบน...' : 'Permanent Ban'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {users.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
                  ไม่มีผู้ใช้ที่ตรงกับเงื่อนไข
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
