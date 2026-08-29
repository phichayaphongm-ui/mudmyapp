class Review {
  final String id;
  final String pinId;
  final String userId;
  final String userName;
  final String? userAvatar;
  final double rating;
  final String comment;
  final List<String> images;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.pinId,
    required this.userId,
    required this.userName,
    required this.rating,
    required this.comment,
    this.userAvatar,
    this.images = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: (json['id'] ?? '').toString(),
        pinId: (json['pin_id'] ?? '').toString(),
        userId: (json['user_id'] ?? '').toString(),
        userName: json['user_name'] as String? ?? 'ผู้ใช้งาน',
        userAvatar: json['user_avatar'] as String?,
        rating: (json['rating'] as num?)?.toDouble() ?? 0,
        comment: json['comment'] as String? ?? '',
        images: (json['images'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'pin_id': pinId,
        'user_id': userId,
        'user_name': userName,
        'user_avatar': userAvatar,
        'rating': rating,
        'comment': comment,
        'images': images,
        'created_at': createdAt.toIso8601String(),
      };
}
