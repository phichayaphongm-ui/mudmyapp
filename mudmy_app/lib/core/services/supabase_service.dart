import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

/// Singleton access to the Supabase client.
class SupabaseService {
  SupabaseService._();

  static final SupabaseService instance = SupabaseService._();

  SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
    );
  }

  /// Public URL for an object in the `mudmy` bucket.
  String storageUrl(String path) =>
      client.storage.from(AppConfig.storageBucket).getPublicUrl(path);

  /// Upload bytes and return the storage path.
  Future<String> uploadBytes({
    required String folder,
    required String path,
    required List<int> bytes,
    required String contentType,
  }) async {
    final fullPath = '$folder/$path';
    await client.storage
        .from(AppConfig.storageBucket)
        .uploadBinary(fullPath, Uint8List.fromList(bytes),
            fileOptions: FileOptions(upsert: true, contentType: contentType));
    return fullPath;
  }
}
