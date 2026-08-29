'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X, Send, MapPin, User, ChevronRight, CheckCircle2,
  Loader2, Shield, Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { 
  getOrCreateConversation, 
  sendMessage, 
  subscribeToMessages,
  markConversationAsRead
} from '@/lib/services/messages'
import type { Message, Pin } from '@/lib/types'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { playNotificationAlert } from '@/lib/utils/sounds'

interface ChatModalProps {
  pin: Pin
  isOpen: boolean
  onClose: () => void
}

export function ChatModal({ pin, isOpen, onClose }: ChatModalProps) {
  const { user, isBanned } = useAuth()
  const banStatus = isBanned()
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatPrimedRef = useRef(false)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size too large. Please select an image under 10MB.')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Initialize conversation when modal opens
  useEffect(() => {
    if (!isOpen || !user) return

    let unsubscribe: () => void

    const initChat = async () => {
      setLoading(true)
      try {
        const convId = await getOrCreateConversation(
          user.id,
          user.nickname || user.name || 'User',
          user.avatar || '',
          pin.ownerId,
          pin.ownerName || 'Provider',
          pin.ownerAvatar || '',
          pin.id,
          pin.title
        )
        setConversationId(convId)
        chatPrimedRef.current = false

        unsubscribe = subscribeToMessages(convId, (newMessages) => {
          const last = newMessages[newMessages.length - 1]
          if (
            chatPrimedRef.current &&
            last &&
            last.senderId !== user.id &&
            !String(last.id).startsWith('optimistic')
          ) {
            playNotificationAlert()
          }
          chatPrimedRef.current = true
          setMessages(newMessages)
          setLoading(false)
          markConversationAsRead(convId, user.id).catch(console.error)
        })
      } catch (error: any) {
        if (error.message === 'BLOCK_EXISTS') {
          setIsBlocked(true)
        } else {
          console.error("Failed to initialize chat:", error)
        }
        setLoading(false)
      }
    }

    initChat()

    return () => {
      if (unsubscribe) unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, pin.id]) // only re-run when modal opens or pin changes, not entire objects

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !conversationId || !user || sending) return

    if (banStatus.banned) {
      alert(t('common.banWarning'))
      return
    }

    setSending(true)
    const textToSend = newMessage.trim()
    const imageToSend = selectedImage
    
    setNewMessage('')
    clearImage()

    // Optimistic update — show message immediately for sender
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId: conversationId,
      senderId: user.id,
      senderName: user.nickname || user.name || 'User',
      senderAvatar: user.avatar || '',
      text: textToSend,
      image: imageToSend ? URL.createObjectURL(imageToSend) : undefined,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      await sendMessage(
        conversationId,
        user.id,
        user.nickname || user.name || 'User',
        user.avatar || '',
        textToSend,
        imageToSend || undefined
      )
      // Realtime subscription will replace optimistic message with real data
    } catch (error: any) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      if (error.message === 'BLOCK_EXISTS') {
        setIsBlocked(true)
        toast.error(t('messages.blocked') || 'You cannot send messages to this user.')
      } else if (error.message === 'STORAGE_PERMISSION_DENIED') {
        toast.error('ไม่สามารถส่งรูปได้: กรุณาตรวจสอบสิทธิ์การใช้งาน Storage')
      } else {
        console.warn("Failed to send message:", error.message)
        toast.error('เกิดข้อผิดพลาดในการส่งข้อความ')
        setNewMessage(textToSend)
        if (imageToSend) {
          setSelectedImage(imageToSend)
          const reader = new FileReader()
          reader.onloadend = () => setImagePreview(reader.result as string)
          reader.readAsDataURL(imageToSend)
        }
      }
    } finally {
      setSending(false)
    }
  }

  // Handle Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex flex-col bg-background overflow-hidden',
        'h-[100dvh] w-full rounded-none',
        'animate-slide-up'
      )}
    >
        {/* Header */}
        <div className="flex flex-col border-b border-border/50 shrink-0 relative bg-muted/30">
          <div className="flex items-center justify-between px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link 
              href={`/profile/${pin.ownerId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={pin.ownerAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {pin.ownerName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-foreground text-sm">{pin.ownerName}</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                  {t('messages.online')}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Context Pin Info (Mini preview of what they are talking about) */}
          <div className="px-4 pb-4">
            <div className="bg-card border border-border/50 rounded-2xl p-3 flex items-center justify-between shadow-sm cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                {pin.images?.[0] ? (
                  <img src={pin.images[0]} alt={pin.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{pin.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{pin.priceLabel || t('pinDetail.noPriceSpecified')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-muted/10">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t('messages.startConversation')}</p>
                <p className="text-xs text-muted-foreground mt-1 px-8">
                  {t('messages.startConversationDesc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.id
                // Basic check to see if we should show avatar/name (only on first message of a group)
                const showDetails = index === 0 || messages[index - 1].senderId !== msg.senderId

                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "self-end items-end" : "self-start items-start",
                    showDetails ? "mt-2" : "mt-0.5"
                  )}>
                    {!isMe && showDetails && (
                      <Link 
                        href={`/profile/${msg.senderId}`}
                        className="text-[10px] text-muted-foreground ml-1 mb-1 font-medium hover:text-primary hover:underline transition-colors"
                      >
                        {msg.senderName}
                      </Link>
                    )}

                    <div className={cn(
                      "px-4 py-2.5 text-sm relative group transition-all",
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-sm" 
                        : "bg-background text-foreground border-2 border-muted rounded-2xl rounded-tl-none shadow-sm"
                    )}>
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden bg-muted/20">
                          <img 
                            src={msg.image} 
                            alt="Sent photo" 
                            className="max-w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.image, '_blank')}
                          />
                        </div>
                      )}
                      {msg.text && <div>{msg.text}</div>}
                      
                      {/* Read indicator for me */}
                      {isMe && (
                        <div className="flex justify-end mt-1">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground/70" />
                        </div>
                      )}

                      {/* Timestamp tooltip on hover */}
                      <div className={cn(
                        "absolute -bottom-5 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                        isMe ? "right-1" : "left-1"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] bg-card border-t border-border/50 shrink-0">
          {imagePreview && (
            <div className="mb-3 relative inline-block animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isBlocked || banStatus.banned ? (
            <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4 text-center">
              <p className="text-sm font-medium text-red-600 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {banStatus.banned ? t('common.banWarning') : (t('messages.userBlocked') || 'คุณไม่สามารถส่งข้อความได้เนื่องจากมีการบล็อกเกิดขึ้น')}
              </p>
            </div>
          ) : (
            <form 
              onSubmit={handleSend}
              className="flex items-end gap-2 bg-muted/50 p-1.5 rounded-[1.5rem] border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-2xl shrink-0 h-11 w-11 hover:bg-muted text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('messages.typeMessage')}
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none px-4 py-3 text-sm focus:outline-none custom-scrollbar"
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={(!newMessage.trim() && !selectedImage) || sending}
              className={cn(
                "rounded-2xl shrink-0 h-11 w-11 transition-all duration-300",
                (newMessage.trim() || selectedImage) && !sending 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </form>
          )}
        </div>
    </div>
  )
}
