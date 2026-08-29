import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../models/user.dart';
import '../services/supabase_service.dart';
import '../services/user_service.dart';

enum AuthStatus { unknown, unauthenticated, authenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _init();
  }

  final _supabase = SupabaseService.instance.client;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  String? _error;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  String? get userId => _supabase.auth.currentUser?.id;

  Future<void> _init() async {
    final session = _supabase.auth.currentSession;
    if (session != null) {
      await _loadProfile(session.user.id);
    } else {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }

    _supabase.auth.onAuthStateChange.listen((data) async {
      final s = data.session;
      if (s != null) {
        await _loadProfile(s.user.id);
      } else {
        _user = null;
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      }
    });
  }

  Future<void> _loadProfile(String id) async {
    try {
      var profile = await UserService.instance.getProfile(id);
      if (profile == null) {
        // Fallback row built from auth meta, matching the DB trigger.
        final meta = _supabase.auth.currentUser?.userMetadata ?? const {};
        profile = AppUser(
          id: id,
          name: meta['full_name']?.toString() ?? meta['name']?.toString() ?? 'ผู้ใช้งาน',
          nickname: meta['name']?.toString(),
          email: _supabase.auth.currentUser?.email ?? '',
        );
        await UserService.instance.upsertProfile(profile);
      }
      _user = profile;
      _status = AuthStatus.authenticated;
    } catch (e) {
      _error = e.toString();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    final id = userId;
    if (id == null) return;
    final profile = await UserService.instance.getProfile(id);
    if (profile != null) {
      _user = profile;
      notifyListeners();
    }
  }

  Future<void> signInWithEmail(String email, String password) async {
    _error = null;
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
    } on AuthException catch (e) {
      _error = _friendlyAuthError(e.message);
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String name,
    String? nickname,
    String userType = 'personal',
  }) async {
    _error = null;
    try {
      await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': name, 'name': nickname ?? name, 'user_type': userType},
      );
    } on AuthException catch (e) {
      _error = _friendlyAuthError(e.message);
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    _error = null;
    try {
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: '${AppConfig.appScheme}://login',
      );
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  String _friendlyAuthError(String raw) {
    final m = raw.toLowerCase();
    if (m.contains('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    if (m.contains('email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
    if (m.contains('already registered')) return 'อีเมลนี้ถูกใช้แล้ว กรุณาเข้าสู่ระบบ';
    if (m.contains('password')) return 'รหัสผ่านไม่ถูกต้อง (อย่างน้อย 6 ตัวอักษร)';
    if (m.contains('network')) return 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้';
    return raw;
  }
}
