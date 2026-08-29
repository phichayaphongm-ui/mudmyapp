import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/chat.dart';
import 'supabase_service.dart';

class MessageService {
  MessageService._();
  static final MessageService instance = MessageService._();

  SupabaseClient get _db => SupabaseService.instance.client;

  /// Find or create a conversation between two users about a pin.
  /// Returns null when the two users have blocked each other.
  Future<Conversation?> getOrCreateConversation({
    required String myUserId,
    required String myName,
    required String? myAvatar,
    required String otherUserId,
    required String otherName,
    required String? otherAvatar,
    required String pinId,
    required String pinTitle,
  }) async {
    final data = await _db
        .from('conversations')
        .select()
        .contains('participants', [myUserId, otherUserId])
        .maybeSingle();

    if (data != null) {
      return Conversation.fromJson(data);
    }

    final participants = [myUserId, otherUserId];
    final id = '${myUserId}_${otherUserId}_$pinId';
    final conversation = Conversation(
      id: id,
      participants: participants,
      participantNames: {myUserId: myName, otherUserId: otherName},
      participantAvatars: {
        if (myAvatar != null) myUserId: myAvatar,
        if (otherAvatar != null) otherUserId: otherAvatar,
      },
      pinId: pinId,
      pinTitle: pinTitle,
      lastMessage: '',
      lastMessageAt: DateTime.now(),
      updatedAt: DateTime.now(),
      unreadCount: {myUserId: 0, otherUserId: 0},
    );

    final inserted = await _db
        .from('conversations')
        .insert(conversation.toJson())
        .select()
        .single();
    return Conversation.fromJson(inserted);
  }

  Future<List<Conversation>> getConversations(String userId) async {
    final data = await _db
        .from('conversations')
        .select()
        .contains('participants', [userId])
        .order('updated_at', ascending: false);
    return data.map((e) => Conversation.fromJson(e)).toList();
  }

  Future<List<ChatMessage>> getMessages(String conversationId, {int limit = 100}) async {
    final data = await _db
        .from('messages')
        .select()
        .eq('conversation_id', conversationId)
        .order('created_at', ascending: true)
        .limit(limit);
    return data.map((e) => ChatMessage.fromJson(e)).toList();
  }

  Future<void> sendMessage({
    required String conversationId,
    required String senderId,
    required String senderName,
    String? senderAvatar,
    required String text,
    String? image,
  }) async {
    final message = ChatMessage(
      id: _uuid(),
      conversationId: conversationId,
      senderId: senderId,
      senderName: senderName,
      senderAvatar: senderAvatar,
      text: text,
      image: image,
    );
    await _db.from('messages').insert(message.toJson());

    final conv = await _db
        .from('conversations')
        .select('unread_count, participants')
        .eq('id', conversationId)
        .maybeSingle();
    if (conv == null) return;
    final participants = (conv['participants'] as List).map((e) => e.toString()).toList();
    final unread = Map<String, dynamic>.from(conv['unread_count'] as Map? ?? const {});
    for (final p in participants) {
      if (p != senderId) {
        unread[p] = ((unread[p] as num?) ?? 0) + 1;
      } else {
        unread[p] = 0;
      }
    }
    await _db.from('conversations').update({
      'last_message': text,
      'last_message_at': DateTime.now().toUtc().toIso8601String(),
      'updated_at': DateTime.now().toUtc().toIso8601String(),
      'unread_count': unread,
    }).eq('id', conversationId);
  }

  Future<void> markAsRead(String conversationId, String userId) async {
    final conv = await _db
        .from('conversations')
        .select('unread_count')
        .eq('id', conversationId)
        .maybeSingle();
    if (conv == null) return;
    final unread = Map<String, dynamic>.from(conv['unread_count'] as Map? ?? const {});
    unread[userId] = 0;
    await _db.from('conversations').update({'unread_count': unread}).eq('id', conversationId);
  }

  Future<int> getTotalUnread(String userId) async {
    final data = await _db
        .from('conversations')
        .select('unread_count')
        .contains('participants', [userId]);
    var total = 0;
    for (final row in data) {
      final m = row['unread_count'] as Map? ?? const {};
      total += (m[userId] as num?)?.toInt() ?? 0;
    }
    return total;
  }

  /// Real-time conversation list subscription.
  Stream<List<Conversation>> subscribeToConversations(String userId) {
    final controller = StreamController<List<Conversation>>.broadcast();
    final channel = _db
        .channel('conversations:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'conversations',
          callback: (payload) async {
            final list = await getConversations(userId);
            if (!controller.isClosed) controller.add(list);
          },
        )
        .subscribe();

    // Initial load
    getConversations(userId).then((list) {
      if (!controller.isClosed) controller.add(list);
    });

    controller.onCancel = () => channel.unsubscribe();
    return controller.stream;
  }

  /// Real-time messages subscription for one conversation.
  Stream<List<ChatMessage>> subscribeToMessages(String conversationId) {
    final controller = StreamController<List<ChatMessage>>.broadcast();
    final channel = _db
        .channel('messages:$conversationId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: conversationId,
          ),
          callback: (payload) async {
            final list = await getMessages(conversationId);
            if (!controller.isClosed) controller.add(list);
          },
        )
        .subscribe();

    controller.onCancel = () => channel.unsubscribe();
    return controller.stream;
  }

  String _uuid() => 'c_${DateTime.now().microsecondsSinceEpoch}_${_rand()}';
  int _i = 0;
  int _rand() => ++_i & 0x7fffffff;
}
