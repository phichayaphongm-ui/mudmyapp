import 'category.dart';

/// Lifecycle of a pin.
enum PinStatus {
  active('active'),
  expired('expired'),
  pendingPayment('pending_payment'),
  resolved('resolved');

  const PinStatus(this.id);
  final String id;

  static PinStatus fromId(String? id) {
    for (final s in PinStatus.values) {
      if (s.id == id) return s;
    }
    return PinStatus.active;
  }
}

enum UserPlan {
  general('general'),
  enterprise('enterprise');

  const UserPlan(this.id);
  final String id;

  static UserPlan fromId(String? id) => id == 'enterprise' ? UserPlan.enterprise : UserPlan.general;
}

class PinContact {
  const PinContact({this.phone, this.line, this.facebook});

  final String? phone;
  final String? line;
  final String? facebook;

  factory PinContact.fromJson(Map<String, dynamic> json) => PinContact(
        phone: json['phone'] as String?,
        line: json['line'] as String?,
        facebook: json['facebook'] as String?,
      );

  Map<String, dynamic> toJson() => {
        if (phone != null) 'phone': phone,
        if (line != null) 'line': line,
        if (facebook != null) 'facebook': facebook,
      };
}

/// A marketplace pin (classified ad pinned on the map).
class Pin {
  final String id;
  final String title;
  final PinCategory category;
  final String description;
  final List<String> images;
  final PinContact contact;
  final double? price;
  final String? priceLabel;
  final double lat;
  final double lng;
  final String address;
  final String district;
  final String province;
  final String ownerId;
  final String ownerName;
  final String? ownerAvatar;
  final String? ownerType;
  final PinStatus status;
  final UserPlan plan;
  final bool featured;
  final String? heroId;
  final String? thankYouMessage;
  final int views;
  final int clicks;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final double rating;
  final int reviewCount;
  final int favoriteCount;
  final String? pinNumber;
  final List<String> reports;
  final double? radius;
  final bool isFreePin;
  final DateTime? lastCheckedInAt;

  const Pin({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.images,
    required this.contact,
    required this.lat,
    required this.lng,
    required this.address,
    required this.district,
    required this.province,
    required this.ownerId,
    required this.ownerName,
    required this.ownerAvatar,
    required this.status,
    required this.plan,
    required this.featured,
    required this.views,
    required this.clicks,
    required this.createdAt,
    required this.rating,
    required this.reviewCount,
    required this.favoriteCount,
    required this.reports,
    this.ownerType,
    this.price,
    this.priceLabel,
    this.heroId,
    this.thankYouMessage,
    this.expiresAt,
    this.pinNumber,
    this.radius,
    this.isFreePin = false,
    this.lastCheckedInAt,
  });

  factory Pin.fromJson(Map<String, dynamic> json) {
    final cat = json['category'] as String?;
    return Pin(
      id: (json['id'] ?? '').toString(),
      title: json['title'] as String? ?? '',
      category: PinCategory.fromId(cat),
      description: json['description'] as String? ?? '',
      images: (json['images'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      contact: PinContact.fromJson((json['contact'] as Map?)?.cast<String, dynamic>() ?? const {}),
      lat: _toDouble(json['lat']) ?? 0,
      lng: _toDouble(json['lng']) ?? 0,
      address: json['address'] as String? ?? '',
      district: json['district'] as String? ?? '',
      province: json['province'] as String? ?? '',
      ownerId: (json['owner_id'] ?? '').toString(),
      ownerName: json['owner_name'] as String? ?? 'ผู้ใช้งาน',
      ownerAvatar: json['owner_avatar'] as String?,
      ownerType: json['owner_type'] as String?,
      status: PinStatus.fromId(json['status'] as String?),
      plan: UserPlan.fromId(json['plan'] as String?),
      featured: json['featured'] as bool? ?? false,
      heroId: json['hero_id'] as String?,
      thankYouMessage: json['thank_you_message'] as String?,
      views: json['views'] as int? ?? 0,
      clicks: json['clicks'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      expiresAt: json['expires_at'] == null ? null : DateTime.tryParse(json['expires_at'].toString()),
      rating: _toDouble(json['rating']) ?? 0,
      reviewCount: json['review_count'] as int? ?? 0,
      favoriteCount: json['favorite_count'] as int? ?? 0,
      pinNumber: json['pin_number'] as String?,
      reports: (json['reports'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      radius: _toDouble(json['radius']),
      isFreePin: json['is_free_pin'] as bool? ?? false,
      lastCheckedInAt: json['last_checked_in_at'] == null
          ? null
          : DateTime.tryParse(json['last_checked_in_at'].toString()),
      price: _toDouble(json['price']),
      priceLabel: json['price_label'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'category': category.id,
        'description': description,
        'images': images,
        'contact': contact.toJson(),
        'lat': lat,
        'lng': lng,
        'address': address,
        'district': district,
        'province': province,
        'owner_id': ownerId,
        'owner_name': ownerName,
        'owner_avatar': ownerAvatar,
        'owner_type': ownerType,
        'status': status.id,
        'plan': plan.id,
        'featured': featured,
        'hero_id': heroId,
        'thank_you_message': thankYouMessage,
        'views': views,
        'clicks': clicks,
        'created_at': createdAt.toIso8601String(),
        'expires_at': expiresAt?.toIso8601String(),
        'rating': rating,
        'review_count': reviewCount,
        'favorite_count': favoriteCount,
        'pin_number': pinNumber,
        'reports': reports,
        'radius': radius,
        'is_free_pin': isFreePin,
        'last_checked_in_at': lastCheckedInAt?.toIso8601String(),
        'price': price,
        'price_label': priceLabel,
      };

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  /// Days left until expiry (0 when expired).
  int get daysLeft {
    if (expiresAt == null) return 0;
    return expiresAt!.difference(DateTime.now()).inDays;
  }

  bool get isExpired => status == PinStatus.expired;
  bool get isResolved => status == PinStatus.resolved;
  bool get isEmergency => category == PinCategory.emergency;

  Pin copyWith({
    int? views,
    int? clicks,
    int? favoriteCount,
    double? rating,
    int? reviewCount,
    PinStatus? status,
  }) {
    return Pin(
      id: id,
      title: title,
      category: category,
      description: description,
      images: images,
      contact: contact,
      lat: lat,
      lng: lng,
      address: address,
      district: district,
      province: province,
      ownerId: ownerId,
      ownerName: ownerName,
      ownerAvatar: ownerAvatar,
      ownerType: ownerType,
      status: status ?? this.status,
      plan: plan,
      featured: featured,
      heroId: heroId,
      thankYouMessage: thankYouMessage,
      views: views ?? this.views,
      clicks: clicks ?? this.clicks,
      createdAt: createdAt,
      expiresAt: expiresAt,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      favoriteCount: favoriteCount ?? this.favoriteCount,
      pinNumber: pinNumber,
      reports: reports,
      radius: radius,
      isFreePin: isFreePin,
      lastCheckedInAt: lastCheckedInAt,
      price: price,
      priceLabel: priceLabel,
    );
  }
}
