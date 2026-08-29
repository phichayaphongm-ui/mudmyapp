import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/pin.dart';
import '../models/review.dart';
import 'supabase_service.dart';

class ReviewService {
  ReviewService._();
  static final ReviewService instance = ReviewService._();

  SupabaseClient get _db => SupabaseService.instance.client;

  Future<List<Review>> getReviews(String pinId) async {
    final data = await _db
        .from('reviews')
        .select()
        .eq('pin_id', pinId)
        .order('created_at', ascending: false);
    return data.map((e) => Review.fromJson(e)).toList();
  }

  /// Add a review and recalculate the pin's running rating + review_count.
  Future<void> addReview(String pinId, Review review) async {
    await _db.from('reviews').insert(review.toJson());

    final pin = await _db.from('pins').select('rating, review_count').eq('id', pinId).maybeSingle();
    if (pin == null) return;
    final currentRating = (pin['rating'] as num?)?.toDouble() ?? 0;
    final currentCount = pin['review_count'] as int? ?? 0;
    final newCount = currentCount + 1;
    final newRating = ((currentRating * currentCount) + review.rating) / newCount;

    await _db.from('pins').update({
      'rating': double.parse(newRating.toStringAsFixed(2)),
      'review_count': newCount,
    }).eq('id', pinId);
  }
}

class FavoriteService {
  FavoriteService._();
  static final FavoriteService instance = FavoriteService._();

  SupabaseClient get _db => SupabaseService.instance.client;

  Future<bool> isFavorite(String userId, String pinId) async {
    final data = await _db
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('pin_id', pinId)
        .maybeSingle();
    return data != null;
  }

  Future<bool> toggleFavorite(String userId, String pinId) async {
    final id = '${userId}_$pinId';
    final existing = await isFavorite(userId, pinId);
    final pin = await _db.from('pins').select('favorite_count').eq('id', pinId).maybeSingle();
    final current = (pin?['favorite_count'] as num?)?.toInt() ?? 0;

    if (existing) {
      await _db.from('favorites').delete().eq('id', id);
      await _db.from('pins').update({'favorite_count': current - 1}).eq('id', pinId);
      return false;
    } else {
      await _db.from('favorites').insert({'id': id, 'user_id': userId, 'pin_id': pinId});
      await _db.from('pins').update({'favorite_count': current + 1}).eq('id', pinId);
      return true;
    }
  }

  Future<List<String>> getFavoritePinIds(String userId) async {
    final data = await _db.from('favorites').select('pin_id').eq('user_id', userId);
    return data.map((e) => e['pin_id'].toString()).toList();
  }

  Future<List<Pin>> getFavorites(String userId) async {
    final data = await _db
        .from('favorites')
        .select('pin_id')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    final ids = data.map((e) => e['pin_id'].toString()).toList();
    if (ids.isEmpty) return const [];
    final pins = await _db.from('pins').select().inFilter('id', ids);
    return pins.map((e) => Pin.fromJson(e)).toList();
  }
}
