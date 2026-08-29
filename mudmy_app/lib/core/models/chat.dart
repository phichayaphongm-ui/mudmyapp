import 'category.dart';

class ChatMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final String text;
  final String? image;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.text,
    this.senderAvatar,
    this.image,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: (json['id'] ?? '').toString(),
        conversationId: (json['conversation_id'] ?? '').toString(),
        senderId: (json['sender_id'] ?? '').toString(),
        senderName: json['sender_name'] as String? ?? 'ผู้ใช้งาน',
        senderAvatar: json['sender_avatar'] as String?,
        text: json['text'] as String? ?? '',
        image: json['image'] as String?,
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'conversation_id': conversationId,
        'sender_id': senderId,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'text': text,
        'image': image,
        'created_at': createdAt.toIso8601String(),
      };

  bool get isImage => image != null && image!.isNotEmpty;
}

class Conversation {
  final String id;
  final List<String> participants;
  final Map<String, String> participantNames;
  final Map<String, String> participantAvatars;
  final String? pinId;
  final String? pinTitle;
  final String lastMessage;
  final DateTime lastMessageAt;
  final DateTime updatedAt;
  final Map<String, int> unreadCount;

  Conversation({
    required this.id,
    required this.participants,
    required this.participantNames,
    required this.participantAvatars,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.updatedAt,
    required this.unreadCount,
    this.pinId,
    this.pinTitle,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: (json['id'] ?? '').toString(),
        participants: (json['participants'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        participantNames: (json['participant_names'] as Map?)?.map((k, v) => MapEntry(k.toString(), v.toString())) ?? const {},
        participantAvatars: (json['participant_avatars'] as Map?)?.map((k, v) => MapEntry(k.toString(), v.toString())) ?? const {},
        pinId: json['pin_id'] as String?,
        pinTitle: json['pin_title'] as String?,
        lastMessage: json['last_message'] as String? ?? '',
        lastMessageAt: DateTime.tryParse(json['last_message_at']?.toString() ?? '') ?? DateTime.now(),
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ?? DateTime.now(),
        unreadCount: (json['unread_count'] as Map?)?.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0)) ?? const {},
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'participants': participants,
        'participant_names': participantNames,
        'participant_avatars': participantAvatars,
        'pin_id': pinId,
        'pin_title': pinTitle,
        'last_message': lastMessage,
        'last_message_at': lastMessageAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'unread_count': unreadCount,
      };

  String? otherParticipantId(String myUserId) {
    for (final p in participants) {
      if (p != myUserId) return p;
    }
    return null;
  }

  String otherName(String myUserId) =>
      participantNames[otherParticipantId(myUserId)] ?? 'ผู้ใช้งาน';

  String? otherAvatar(String myUserId) => participantAvatars[otherParticipantId(myUserId)];

  int unreadFor(String myUserId) => unreadCount[myUserId] ?? 0;
}

/// Community "pulse" activity item shown in the home ticker.
class ActivityEvent {
  PinCategory? get category => _category;

  final String type;
  final String title;
  final String subtitle;
  final DateTime createdAt;
  final PinCategory? _category;

  ActivityEvent({
    required this.type,
    required this.title,
    required this.subtitle,
    required this.createdAt,
    PinCategory? category,
  }) : _category = category;

  factory ActivityEvent.fromPin(Map<String, dynamic> pin) => ActivityEvent(
        type: 'pin',
        title: pin['title']?.toString() ?? '',
        subtitle: '${pin['owner_name'] ?? 'ผู้ใช้งาน'} · ${pin['district'] ?? ''}',
        category: PinCategory.fromId(pin['category']?.toString()),
        createdAt: DateTime.tryParse(pin['created_at']?.toString() ?? '') ?? DateTime.now(),
      );

  factory ActivityEvent.fromReview(Map<String, dynamic> review) => ActivityEvent(
        type: 'review',
        title: 'รีวิวใหม่: ${review['user_name'] ?? ''}',
        subtitle: 'ให้คะแนน ${(review['rating'] as num?)?.toInt() ?? 0} ดาว',
        createdAt: DateTime.tryParse(review['created_at']?.toString() ?? '') ?? DateTime.now(),
      );
}
