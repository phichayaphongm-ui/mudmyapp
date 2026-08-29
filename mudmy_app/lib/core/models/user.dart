/// A user profile (mirrors the Supabase `users` table).
class AppUser {
  final String id;
  final String name;
  final String? nickname;
  final String email;
  final String? avatar;
  final String? phone;
  final String? line;
  final String? facebook;
  final String plan;
  final int activePins;
  final double rating;
  final int reviewCount;
  final int heroCasesCount;
  final List<dynamic> heroCases;
  final String? province;
  final String userType;
  final String? businessName;
  final String? businessTaxId;
  final String? businessAddress;
  final String? businessCategory;
  final String? businessPhone;
  final bool hasUsedFreePin;
  final String? freePinId;
  final DateTime createdAt;
  final List<String> blockedUsers;
  final List<String> blockedBy;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.nickname,
    this.avatar,
    this.phone,
    this.line,
    this.facebook,
    this.plan = 'general',
    this.activePins = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.heroCasesCount = 0,
    this.heroCases = const [],
    this.province,
    this.userType = 'personal',
    this.businessName,
    this.businessTaxId,
    this.businessAddress,
    this.businessCategory,
    this.businessPhone,
    this.hasUsedFreePin = false,
    this.freePinId,
    this.blockedUsers = const [],
    this.blockedBy = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: (json['id'] ?? '').toString(),
        name: json['name'] as String? ?? 'ผู้ใช้งาน',
        nickname: json['nickname'] as String?,
        email: json['email'] as String? ?? '',
        avatar: json['avatar'] as String?,
        phone: json['phone'] as String?,
        line: json['line'] as String?,
        facebook: json['facebook'] as String?,
        plan: json['plan'] as String? ?? 'general',
        activePins: json['active_pins'] as int? ?? 0,
        rating: (json['rating'] as num?)?.toDouble() ?? 0,
        reviewCount: json['review_count'] as int? ?? 0,
        heroCasesCount: json['hero_cases_count'] as int? ?? 0,
        heroCases: (json['hero_cases'] as List?) ?? const [],
        province: json['province'] as String?,
        userType: json['user_type'] as String? ?? 'personal',
        businessName: json['business_name'] as String?,
        businessTaxId: json['business_tax_id'] as String?,
        businessAddress: json['business_address'] as String?,
        businessCategory: json['business_category'] as String?,
        businessPhone: json['business_phone'] as String?,
        hasUsedFreePin: json['has_used_free_pin'] as bool? ?? false,
        freePinId: json['free_pin_id'] as String?,
        blockedUsers: (json['blocked_users'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        blockedBy: (json['blocked_by'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'nickname': nickname,
        'email': email,
        'avatar': avatar,
        'phone': phone,
        'line': line,
        'facebook': facebook,
        'plan': plan,
        'active_pins': activePins,
        'rating': rating,
        'review_count': reviewCount,
        'hero_cases_count': heroCasesCount,
        'hero_cases': heroCases,
        'province': province,
        'user_type': userType,
        'business_name': businessName,
        'business_tax_id': businessTaxId,
        'business_address': businessAddress,
        'business_category': businessCategory,
        'business_phone': businessPhone,
        'has_used_free_pin': hasUsedFreePin,
        'free_pin_id': freePinId,
        'blocked_users': blockedUsers,
        'blocked_by': blockedBy,
        'created_at': createdAt.toIso8601String(),
      };

  String get displayName => nickname?.trim().isNotEmpty == true ? nickname! : name;

  bool isBlockedBy(String otherUserId) => blockedBy.contains(otherUserId);
  bool hasBlocked(String otherUserId) => blockedUsers.contains(otherUserId);

  AppUser copyWith({
    String? name,
    String? nickname,
    String? avatar,
    String? phone,
    String? line,
    String? facebook,
    String? province,
    int? activePins,
    bool? hasUsedFreePin,
    String? freePinId,
    String? plan,
  }) {
    return AppUser(
      id: id,
      name: name ?? this.name,
      nickname: nickname ?? this.nickname,
      email: email,
      avatar: avatar ?? this.avatar,
      phone: phone ?? this.phone,
      line: line ?? this.line,
      facebook: facebook ?? this.facebook,
      plan: plan ?? this.plan,
      activePins: activePins ?? this.activePins,
      rating: rating,
      reviewCount: reviewCount,
      heroCasesCount: heroCasesCount,
      heroCases: heroCases,
      province: province ?? this.province,
      userType: userType,
      businessName: businessName,
      businessTaxId: businessTaxId,
      businessAddress: businessAddress,
      businessCategory: businessCategory,
      businessPhone: businessPhone,
      hasUsedFreePin: hasUsedFreePin ?? this.hasUsedFreePin,
      freePinId: freePinId ?? this.freePinId,
      blockedUsers: blockedUsers,
      blockedBy: blockedBy,
      createdAt: createdAt,
    );
  }
}
