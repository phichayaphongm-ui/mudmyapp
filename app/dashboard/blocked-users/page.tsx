'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Shield, Loader2, 
  UserPlus, Info
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { getBlockedUsers, toggleBlockUser } from '@/lib/services/users'
import type { User } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

export default function BlockedUsersPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  
  const [blockedUsers, setBlockedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchBlocked() {
      if (!user) return
      try {
        const data = await getBlockedUsers(user.id)
        setBlockedUsers(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBlocked()
  }, [user])

  const handleUnblock = async (targetId: string) => {
    if (!user) return
    setUnblockingId(targetId)
    try {
      await toggleBlockUser(user.id, targetId, false)
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
      toast.success('ปลดบล็อกเรียบร้อย')
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถปลดบล็อกได้')
    } finally {
      setUnblockingId(null)
    }
  }

  if (!user && !loading) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('profile.blockedUsers') || 'รายชื่อที่ถูกบล็อก'}</h1>
            <p className="text-sm text-muted-foreground">{t('profile.blockedUsersDesc') || 'จัดการรายชื่อผู้ใช้ที่คุณไม่ต้องการติดต่อด้วย'}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : blockedUsers.length > 0 ? (
          <div className="bg-card rounded-[2rem] border border-border/50 divide-y divide-border/50 overflow-hidden shadow-sm">
            {blockedUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <Link href={`/profile/${u.id}`} className="flex items-center gap-3 group">
                  <Avatar className="w-12 h-12 ring-2 ring-border/50 transition-transform group-hover:scale-105">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                      {(u.nickname || u.name)?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{u.nickname || u.name}</p>
                    <p className="text-xs text-muted-foreground">@{u.id.substring(0, 8)}</p>
                  </div>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all h-9 gap-2"
                  disabled={unblockingId === u.id}
                  onClick={() => {
                    setSelectedUser(u)
                    setShowConfirm(true)
                  }}
                >
                  {unblockingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {t('profile.unblock')}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/50 border border-border/50 border-dashed rounded-[2.5rem] p-16 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4 grayscale">
              <Shield className="w-8 h-8" />
            </div>
            <p className="font-medium">{t('profile.noBlockedUsers') || 'คุณยังไม่มีรายชื่อที่ถูกบล็อก'}</p>
            <p className="text-xs mt-1 opacity-60">{t('profile.noBlockedUsersHint') || 'คุณสามารถบล็อกผู้ใช้ได้ผ่านหน้าโปรไฟล์ของพวกเขา'}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-border/30 flex gap-3 items-start">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('profile.blockNotice') || 'การบล็อกผู้ใช้จะทำให้ทั้งคุณและผู้ใช้รายนั้นไม่สามารถส่งข้อความหากันได้ ข้อความเดิมจะยังคงอยู่แต่จะไม่สามารถสนทนาต่อได้จนกว่าจะมีการปลดบล็อก'}
          </p>
        </div>
      </main>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center tracking-tight">
              {t('profile.unblock')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium px-4">
              {t('profile.unblockConfirm')} {selectedUser && `(${selectedUser.nickname || selectedUser.name})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 hover:bg-muted font-bold flex-1">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-2xl h-12 font-bold flex-1 bg-emerald-600 hover:bg-emerald-700 border-none transition-all"
              onClick={() => selectedUser && handleUnblock(selectedUser.id)}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
