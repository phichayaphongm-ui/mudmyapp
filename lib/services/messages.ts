'use client'

import { supabase } from '@/lib/supabase'
import type { Conversation, Message } from '@/lib/types'

function mapRowToConversation(row: any): Conversation {
  return {
    id: row.id,
    participants: row.participants,
    participantNames: row.participant_names || {},
    participantAvatars: row.participant_avatars || {},
    pinId: row.pin_id,
    pinTitle: row.pin_title,
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at || '',
    updatedAt: row.updated_at || '',
    unreadCount: row.unread_count || {},
  }
}

const CHAT_IMAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

function mapRowToMessage(row: any): Message {
  const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0
  const isExpired = !!row.image && createdAt > 0 && Date.now() - createdAt > CHAT_IMAGE_RETENTION_MS

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    text: row.text,
    image: isExpired ? null : (row.image || null),
    createdAt: row.created_at,
  }
}

/**
 * Get or create a conversation between two users about a pin.
 */
export async function getOrCreateConversation(
  senderId: string,
  senderName: string,
  senderAvatar: string,
  receiverId: string,
  receiverName: string,
  receiverAvatar: string,
  pinId: string,
  pinTitle: string
): Promise<string> {
  // Check if either user is blocked
  const [senderRow, receiverRow] = await Promise.all([
    supabase.from('users').select('blocked_users').eq('id', senderId).single(),
    supabase.from('users').select('blocked_users').eq('id', receiverId).single(),
  ])

  const senderBlocked: string[] = senderRow.data?.blocked_users || []
  const receiverBlocked: string[] = receiverRow.data?.blocked_users || []

  if (senderBlocked.includes(receiverId) || receiverBlocked.includes(senderId)) {
    throw new Error('BLOCK_EXISTS')
  }

  // Look for an existing conversation for this sender+receiver+pin
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, participants, pin_id')
    .contains('participants', [senderId])
    .contains('participants', [receiverId])

  const existingConv = (existing || []).find(
    (c) => c.pin_id === pinId && c.participants.includes(senderId) && c.participants.includes(receiverId)
  )
  if (existingConv) return existingConv.id

  // Create new conversation
  const conversationId = crypto.randomUUID()
  const now = new Date().toISOString()

  const { error } = await supabase.from('conversations').insert({
    id: conversationId,
    participants: [senderId, receiverId],
    participant_names: {
      [senderId]: senderName,
      [receiverId]: receiverName,
    },
    participant_avatars: {
      [senderId]: senderAvatar || '',
      [receiverId]: receiverAvatar || '',
    },
    pin_id: pinId,
    pin_title: pinTitle,
    last_message: '',
    last_message_at: now,
    updated_at: now,
    unread_count: {
      [senderId]: 0,
      [receiverId]: 0,
    },
  })

  if (error) throw error
  return conversationId
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string,
  imageFile?: File
): Promise<void> {
  // Get conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convErr || !conv) throw new Error('Conversation not found')

  const participants: string[] = conv.participants || []
  const receiverId = participants.find((p: string) => p !== senderId) || ''
  if (!receiverId) throw new Error('Receiver not found')

  // Check block status
  const [senderRow, receiverRow] = await Promise.all([
    supabase.from('users').select('blocked_users').eq('id', senderId).single(),
    supabase.from('users').select('blocked_users').eq('id', receiverId).single(),
  ])

  const senderBlocked: string[] = senderRow.data?.blocked_users || []
  const receiverBlocked: string[] = receiverRow.data?.blocked_users || []

  if (senderBlocked.includes(receiverId) || receiverBlocked.includes(senderId)) {
    throw new Error('BLOCK_EXISTS')
  }

  // Upload image if provided
  let imageUrl = ''
  if (imageFile) {
    try {
      const { compressImage } = await import('@/lib/utils')
      const compressedBlob = await compressImage(imageFile, 800, 0.6)
      const extension = imageFile.name.split('.').pop() || 'jpg'
      const fileName = `chats/${conversationId}/${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('mudmy')
        .upload(fileName, compressedBlob)

      if (uploadError) {
        console.warn('Upload to Storage failed:', uploadError.message)
        throw new Error('STORAGE_PERMISSION_DENIED')
      }

      const { data: urlData } = supabase.storage.from('mudmy').getPublicUrl(fileName)
      imageUrl = urlData?.publicUrl || ''
    } catch (uploadErr: any) {
      console.warn('Upload to Storage failed:', uploadErr.message)
      throw uploadErr
    }
  }

  const messageId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert message
  const { error: msgError } = await supabase.from('messages').insert({
    id: messageId,
    conversation_id: conversationId,
    sender_id: senderId,
    sender_name: senderName,
    sender_avatar: senderAvatar || '',
    text,
    image: imageUrl || null,
    created_at: now,
  })

  if (msgError) throw msgError

  // Update conversation metadata
  const currentUnread: Record<string, number> = conv.unread_count || {}
  const updatedUnread = {
    ...currentUnread,
    [receiverId]: (currentUnread[receiverId] || 0) + 1,
  }

  await supabase.from('conversations').update({
    last_message: imageFile ? (text ? text : 'Sent a photo') : text,
    last_message_at: now,
    updated_at: now,
    unread_count: updatedUnread,
  }).eq('id', conversationId)
}

/**
 * Mark a conversation as read for a specific user.
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  const { data: conv } = await supabase
    .from('conversations')
    .select('unread_count')
    .eq('id', conversationId)
    .single()

  if (!conv) return

  const updatedUnread = { ...conv.unread_count, [userId]: 0 }

  await supabase.from('conversations').update({ unread_count: updatedUnread }).eq('id', conversationId)
}

/**
 * Get all conversations for a user, sorted by latest message.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participants', [userId])
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data || []).map(mapRowToConversation)
}

/**
 * Subscribe to all conversations for a user to get real-time updates.
 * Returns an unsubscribe function.
 */
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  // Use a unique suffix per subscription so multiple components
  // (e.g. Navbar badge + messages page) can coexist without killing each other.
  const uniqueSuffix = Math.random().toString(36).slice(2, 8)
  const channelName = `user-conversations:${userId}:${uniqueSuffix}`

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        // NOTE: Supabase Realtime does NOT support array-contains filters.
        // We subscribe to ALL conversation changes and re-fetch the user's subset.
      },
      async () => {
        const convs = await getConversations(userId)
        callback(convs)
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] conversations (${uniqueSuffix}) status:`, status)
    })

  // Initial fetch
  getConversations(userId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time messages in a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const channelName = `messages:${conversationId}`

  // Remove any existing channel with the same name to prevent duplicate subscriptions
  const existingChannels = supabase.getChannels().filter(ch => ch.topic.includes(channelName))
  existingChannels.forEach(ch => supabase.removeChannel(ch))

  // First, load existing messages
  supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .then(({ data }) => {
      callback((data || []).map(mapRowToMessage))
    })

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (_payload) => {
        // Use payload.new directly for instant update, then re-fetch to ensure consistency
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        callback((data || []).map(mapRowToMessage))
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] messages:${conversationId} status:`, status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
