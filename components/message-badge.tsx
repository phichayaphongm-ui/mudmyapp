'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { subscribeToUserConversations } from '@/lib/services/messages'
import type { Message, Pin } from '@/lib/types'

export function MessageBadge() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToUserConversations(user.id, (conversations) => {
      let totalUnread = 0
      for (const conv of conversations) {
        totalUnread += conv.unreadCount?.[user.id] || 0
      }
      setUnreadCount(totalUnread)
    })

    return () => unsubscribe()
  }, [user])

  if (!user) return null

  return (
    <Link href="/messages">
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-2xl w-9 h-9 hover:bg-muted relative group"
      >
        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-primary" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
