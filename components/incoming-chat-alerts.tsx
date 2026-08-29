'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { subscribeToUserConversations } from '@/lib/services/messages'
import { installSoundUnlock, playNotificationAlert } from '@/lib/utils/sounds'

/**
 * Always-mounted listener so chat sounds work on every page,
 * including Home which has no message badge.
 */
export function IncomingChatAlerts() {
  const { user } = useAuth()
  const lastTotalRef = useRef(0)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    installSoundUnlock()
  }, [])

  useEffect(() => {
    if (!user) return

    lastTotalRef.current = 0
    isFirstLoad.current = true

    const unsubscribe = subscribeToUserConversations(user.id, (conversations) => {
      let totalUnread = 0
      let latestMessagePreview = ''
      let latestSenderId = ''

      const sortedConvs = [...conversations].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )

      for (const conv of sortedConvs) {
        const count = conv.unreadCount?.[user.id] || 0
        totalUnread += count
        if (count > 0 && !latestMessagePreview) {
          latestMessagePreview = conv.lastMessage
          latestSenderId = conv.participants.find((p) => p !== user.id) || ''
        }
      }

      if (!isFirstLoad.current && totalUnread > lastTotalRef.current && latestMessagePreview) {
        const sender = sortedConvs.find((c) => c.participants.includes(latestSenderId))
        const senderName = sender?.participantNames[latestSenderId] || 'ใครบางคน'
        playNotificationAlert()
        toast.message(`ข้อความใหม่จาก ${senderName}`, {
          description: latestMessagePreview,
        })
      }

      lastTotalRef.current = totalUnread
      isFirstLoad.current = false
    })

    return () => unsubscribe()
  }, [user?.id])

  return null
}
