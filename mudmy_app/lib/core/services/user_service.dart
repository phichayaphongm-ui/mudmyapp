import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/user.dart';
import 'supabase_service.dart';

class UserService {
  UserService._();
  static final UserService instance = UserService._();

  static const _table = 'users';

  SupabaseClient get _db => SupabaseService.instance.client;

  Future<AppUser?> getProfile(String userId) async {
    final data = await _db.from(_table).select().eq('id', userId).maybeSingle();
    return data == null ? null : AppUser.fromJson(data);
  }

  Future<void> upsertProfile(AppUser user) async {
    await _db.from(_table).upsert(user.toJson());
  }

  Future<void> updateProfile(String userId, Map<String, dynamic> values) async {
    await _db
        .from(_table)
        .update({...values, 'updated_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', userId);
  }

  Future<List<AppUser>> searchUsers(String query, {int limit = 10}) async {
    final data = await _db
        .from(_table)
        .select()
        .or('nickname.ilike.%$query%,name.ilike.%$query%')
        .limit(limit);
    return data.map((e) => AppUser.fromJson(e)).toList();
  }

  Future<void> blockUser(String userId, String targetId) async {
    final me = await getProfile(userId);
    if (me == null) return;
    final blocked = [...me.blockedUsers];
    if (!blocked.contains(targetId)) blocked.add(targetId);
    await updateProfile(userId, {'blocked_users': blocked});
  }

  Future<void> unblockUser(String userId, String targetId) async {
    final me = await getProfile(userId);
    if (me == null) return;
    final blocked = me.blockedUsers.where((e) => e != targetId).toList();
    await updateProfile(userId, {'blocked_users': blocked});
  }

  Future<void> addHeroCase(String userId, Map<String, dynamic> heroCase) async {
    final me = await getProfile(userId);
    if (me == null) return;
    await updateProfile(userId, {
      'hero_cases': [...me.heroCases, heroCase],
    });
  }
}
