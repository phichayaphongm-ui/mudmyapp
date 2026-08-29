'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { subscribeToUserConversations, markConversationAsRead } from '@/lib/services/messages'
import type { Conversation, Pin } from '@/lib/types'
import { Navbar } from '@/components/navbar'
import { ChatModal } from '@/components/chat-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Ban, MessageCircle, Loader2, Search, X } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getPin } from '@/lib/services/pins'
import { cn } from '@/lib/utils'

// Highlights matching substring in text
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// Relative time formatter
function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'เมื่อกี้'
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`
  if (diffDay === 1) return 'เมื่อวาน'
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }

    // Cleanup previous subscription before creating new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    unsubscribeRef.current = subscribeToUserConversations(user.id, (convs) => {
      setConversations(convs)
      setLoading(false)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]) // only re-run when userId changes, not the full user object

  // Filtered conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase().trim()
    return conversations.filter((conv) => {
      const otherUserId = conv.participants.find((id) => id !== user?.id) || ''
      const otherUserName = conv.participantNames[otherUserId] || ''
      const pinTitle = conv.pinTitle || ''
      const lastMsg = conv.lastMessage || ''
      return (
        otherUserName.toLowerCase().includes(q) ||
        pinTitle.toLowerCase().includes(q) ||
        lastMsg.toLowerCase().includes(q)
      )
    })
  }, [conversations, searchQuery, user?.id])

  const openConversation = async (conv: Conversation) => {
    if (!user) return

    if (conv.unreadCount?.[user.id]) {
      // Optimistic update: clear badge immediately in local state without waiting for realtime
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, unreadCount: { ...c.unreadCount, [user.id]: 0 } }
            : c
        )
      )
      markConversationAsRead(conv.id, user.id).catch(console.error)
    }

    // We need to fetch the pin details to pass into the ChatModal
    // since ChatModal expects a full Pin object.
    try {
      const pin = await getPin(conv.pinId)
      if (pin) {
        setSelectedPin(pin)
      } else {
        // Fallback mock pin if deleted
        setSelectedPin({
          id: conv.pinId,
          title: conv.pinTitle,
          ownerId: conv.participants.find((p) => p !== user?.id) || '',
          ownerName:
            conv.participantNames[
              conv.participants.find((p) => p !== user?.id) || ''
            ] || 'Unknown',
          ownerAvatar:
            conv.participantAvatars[
              conv.participants.find((p) => p !== user?.id) || ''
            ] || '',
          category: 'service',
          description: '',
          images: [],
          contact: {},
          lat: 0,
          lng: 0,
          address: '',
          district: '',
          province: '',
          status: 'active',
          plan: 'general',
          featured: false,
          views: 0,
          clicks: 0,
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          daysLeft: 0,
          rating: 0,
          reviewCount: 0,
          favoriteCount: 0,
        })
      }
    } catch (e) {
      console.error('Failed to load pin for chat:', e)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount?.[user?.id || ''] || 0),
    0
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black">{t('messages.title')}</h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-destructive text-destructive-foreground text-xs font-black animate-in zoom-in duration-300">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {conversations.length > 0
              ? `${conversations.length} การสนทนา`
              : ''}
          </p>
        </div>

        {/* Search Bar */}
        {conversations.length > 0 && (
          <div
            className={cn(
              'relative flex items-center gap-3 mb-6 rounded-[1.5rem] border transition-all duration-300 bg-card shadow-sm',
              isSearchFocused
                ? 'border-primary/50 ring-2 ring-primary/15 shadow-primary/10'
                : 'border-border/50 hover:border-border'
            )}
          >
            <div className="pl-4 shrink-0">
              <Search
                className={cn(
                  'w-4 h-4 transition-colors duration-200',
                  isSearchFocused || searchQuery
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="ค้นหาชื่อ, หมุด, หรือข้อความ..."
              className="flex-1 py-3.5 bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none"
              id="messages-search-input"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="pr-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Search result count */}
        {searchQuery && !loading && (
          <p className="text-xs text-muted-foreground font-medium mb-4 pl-1">
            {filteredConversations.length > 0
              ? `พบ ${filteredConversations.length} การสนทนา`
              : 'ไม่พบการสนทนาที่ตรงกัน'}
          </p>
        )}

        {/* Conversation List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground mb-2">
              {t('messages.noMessagesTitle')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('messages.noMessagesDesc')}
            </p>
          </div>
        ) : filteredConversations.length === 0 && searchQuery ? (
          /* No search results state */
          <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-base font-bold text-foreground mb-1">
              ไม่พบผลลัพธ์สำหรับ "{searchQuery}"
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              ลองค้นหาด้วยชื่อ, ชื่อหมุด หรือเนื้อหาข้อความ
            </p>
            <button
              onClick={clearSearch}
              className="text-sm font-semibold text-primary hover:underline"
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => {
              const otherUserId =
                conv.participants.find((id) => id !== user.id) || ''
              const otherUserName =
                conv.participantNames[otherUserId] || 'Unknown User'
              const otherUserAvatar = conv.participantAvatars[otherUserId]
              const isOtherUserBlocked = user.blockedUsers?.includes(otherUserId) ?? false
              const unreadCount = conv.unreadCount?.[user.id] || 0
              const isUnread = unreadCount > 0
              const relativeTime = formatRelativeTime(conv.lastMessageAt)

              return (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    'bg-card border rounded-2xl p-4 flex gap-4 items-center cursor-pointer transition-all shadow-sm group relative',
                    isUnread
                      ? 'border-primary/40 bg-primary/5 shadow-primary/5'
                      : 'border-border/50 hover:bg-muted/50 hover:border-primary/30 hover:shadow-md'
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openConversation(conv)}
                >
                  {/* Unread left accent bar */}
                  {isUnread && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-primary" />
                  )}

                  <Avatar className="w-14 h-14 border border-primary/10 shrink-0">
                    <AvatarImage src={otherUserAvatar} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-lg">
                      {otherUserName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex min-w-0 items-center gap-2 pr-2">
                        <h3
                          className={cn(
                            'font-bold text-foreground truncate transition-colors',
                            isUnread
                              ? 'text-foreground'
                              : 'group-hover:text-primary'
                          )}
                        >
                          <HighlightText
                            text={otherUserName}
                            query={searchQuery}
                          />
                        </h3>
                        {isOtherUserBlocked && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive"
                            title="บล็อกแล้ว"
                          >
                            <Ban className="h-3 w-3" aria-hidden="true" />
                            <span>บล็อกแล้ว</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {relativeTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary/10 text-secondary truncate max-w-[180px]">
                        <HighlightText
                          text={conv.pinTitle || ''}
                          query={searchQuery}
                        />
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-sm truncate',
                        isUnread
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      <HighlightText
                        text={conv.lastMessage || t('messages.startConversation')}
                        query={searchQuery}
                      />
                    </p>
                  </div>

                  {isUnread && (
                    <div className="shrink-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground animate-in zoom-in">
                      {unreadCount}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Render Chat Modal if a pin is selected */}
      {selectedPin && (
        <ChatModal
          pin={selectedPin}
          isOpen={true}
          onClose={() => setSelectedPin(null)}
        />
      )}
    </div>
  )
}
