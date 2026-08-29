/// App configuration.
///
/// Override at build time with:
///   flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
class AppConfig {
  AppConfig._();

  static const String appName = 'หมุดหมาย';
  static const String appNameEn = 'Mudmy';

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://hbpatulzbnzosgklrozv.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicGF0dWx6Ym56b3Nna2xyb3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjI5MzUsImV4cCI6MjA5OTQzODkzNX0.gPpsMqXlpX3Cu-4WOGfcrwPSLiyZXQYmxhQHDLeflJc',
  );

  static const String storageBucket = 'mudmy';

  static const String appScheme = 'mudmy';
  static const String domain = 'mudmy.app';
}
