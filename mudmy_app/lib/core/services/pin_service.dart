import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/pin.dart';
import 'supabase_service.dart';

class PinService {
  PinService._();
  static final PinService instance = PinService._();

  static const _table = 'pins';

  SupabaseClient get _db => SupabaseService.instance.client;

  /// Fetch all active pins, optionally excluding blocked users' pins.
  Future<List<Pin>> getActivePins({List<String>? excludeOwnerIds}) async {
    var query = _db
        .from(_table)
        .select()
        .eq('status', 'active');
    if (excludeOwnerIds != null && excludeOwnerIds.isNotEmpty) {
      query = query.not('owner_id', 'in', '(${excludeOwnerIds.join(',')})');
    }
    final data = await query.order('created_at', ascending: false);
    return data.map((e) => Pin.fromJson(e)).toList();
  }

  Future<List<Pin>> getFeaturedPins({int limit = 8}) async {
    final data = await _db
        .from(_table)
        .select()
        .eq('status', 'active')
        .eq('featured', true)
        .order('rating', ascending: false)
        .limit(limit);
    return data.map((e) => Pin.fromJson(e)).toList();
  }

  Future<List<Pin>> getRecommendedPins({int limit = 8}) async {
    final data = await _db
        .from(_table)
        .select()
        .eq('status', 'active')
        .order('rating', ascending: false)
        .limit(limit);
    return data.map((e) => Pin.fromJson(e)).toList();
  }

  Future<List<Pin>> getUserPins(String userId) async {
    final data = await _db
        .from(_table)
        .select()
        .eq('owner_id', userId)
        .order('created_at', ascending: false);
    return data.map((e) => Pin.fromJson(e)).toList();
  }

  Future<Pin?> getPin(String id) async {
    final data = await _db.from(_table).select().eq('id', id).maybeSingle();
    return data == null ? null : Pin.fromJson(data);
  }

  /// Create a pin and increment the owner's active_pins counter.
  Future<Pin> createPin(Pin pin) async {
    final json = Map<String, dynamic>.from(pin.toJson())
      ..['created_at'] = DateTime.now().toUtc().toIso8601String()
      ..['updated_at'] = DateTime.now().toUtc().toIso8601String();
    final data = await _db.from(_table).insert(json).select().single();
    await incrementUserActivePins(pin.ownerId, 1);
    return Pin.fromJson(data);
  }

  Future<void> updatePin(String id, Map<String, dynamic> values) async {
    await _db
        .from(_table)
        .update({...values, 'updated_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', id);
  }

  Future<void> deletePin(String id) async {
    await _db.from(_table).delete().eq('id', id);
  }

  Future<void> incrementViews(String id) async {
    try {
      final pin = await _db.from(_table).select('views').eq('id', id).maybeSingle();
      if (pin != null) {
        await _db
            .from(_table)
            .update({'views': (pin['views'] as num? ?? 0) + 1})
            .eq('id', id);
      }
    } catch (_) {
      // non-blocking analytics
    }
  }

  Future<void> incrementClicks(String id) async {
    try {
      final pin = await _db.from(_table).select('clicks').eq('id', id).maybeSingle();
      if (pin != null) {
        await _db
            .from(_table)
            .update({'clicks': (pin['clicks'] as num? ?? 0) + 1})
            .eq('id', id);
      }
    } catch (_) {
      // non-blocking analytics
    }
  }

  Future<void> reportPin(String pinId, String userId, String reason, String details) async {
    final pin = await getPin(pinId);
    if (pin == null) return;

    final reports = [...pin.reports];
    if (reports.contains(userId)) return; // prevent duplicates

    await _db.from('detailed_reports').insert({
      'pin_id': pinId,
      'user_id': userId,
      'reason': reason,
      'details': details,
    });

    final newReports = [...reports, userId];
    final threshold = 5; // personal threshold used by web app default
    if (newReports.length >= threshold) {
      await _db
          .from(_table)
          .update({'status': 'expired', 'reports': newReports})
          .eq('id', pinId);
      // Basic owner ban bookkeeping
      final owner = await _db.from('users').select('ban_count, ban_history').eq('id', pin.ownerId).maybeSingle();
      if (owner != null) {
        final newBanCount = (owner['ban_count'] as num? ?? 0) + 1;
        await _db.from('users').update({
          'ban_count': newBanCount,
          'banned_until': DateTime.now().add(const Duration(days: 7)).toUtc().toIso8601String(),
          'ban_history': [
            ...(owner['ban_history'] as List? ?? const []),
            {'reason': 'Pin $pinId reported $threshold times', 'bannedAt': DateTime.now().toIso8601String()},
          ],
        }).eq('id', pin.ownerId);
      }
    } else {
      await _db.from(_table).update({'reports': newReports}).eq('id', pinId);
    }
  }

  Future<void> checkInFreePin(String pinId) async {
    await _db.from(_table).update({
      'last_checked_in_at': DateTime.now().toUtc().toIso8601String(),
      'expires_at': DateTime.now().add(const Duration(days: 30)).toUtc().toIso8601String(),
    }).eq('id', pinId);
  }

  Future<void> renewPaidPin(String pinId) async {
    final pin = await getPin(pinId);
    if (pin == null) return;
    final base = (pin.expiresAt ?? DateTime.now()).isBefore(DateTime.now())
        ? DateTime.now()
        : pin.expiresAt!;
    await _db.from(_table).update({
      'expires_at': base.add(const Duration(days: 30)).toUtc().toIso8601String(),
    }).eq('id', pinId);
  }

  /// Resolve an emergency pin by assigning a hero.
  Future<void> resolvePin(String pinId, String heroId, String message) async {
    await _db.from(_table).update({
      'status': 'resolved',
      'hero_id': heroId,
      'thank_you_message': message,
    }).eq('id', pinId);
    final hero = await _db.from('users').select('hero_cases_count').eq('id', heroId).maybeSingle();
    if (hero != null) {
      await _db
          .from('users')
          .update({'hero_cases_count': (hero['hero_cases_count'] as num? ?? 0) + 1})
          .eq('id', heroId);
    }
  }

  Future<void> incrementUserActivePins(String userId, int amount) async {
    final user = await _db.from('users').select('active_pins').eq('id', userId).maybeSingle();
    if (user == null) return;
    await _db
        .from('users')
        .update({'active_pins': (user['active_pins'] as num? ?? 0) + amount})
        .eq('id', userId);
  }

  /// Community ticker feed: latest pins + latest reviews.
  Future<List<Map<String, dynamic>>> getActivityFeed({int pinLimit = 5, int reviewLimit = 5}) async {
    final pins = await _db
        .from(_table)
        .select('title, owner_name, district, category, created_at')
        .eq('status', 'active')
        .order('created_at', ascending: false)
        .limit(pinLimit);
    final reviews = await _db
        .from('reviews')
        .select('user_name, rating, created_at')
        .order('created_at', ascending: false)
        .limit(reviewLimit);
    return [...pins, ...reviews];
  }
}
