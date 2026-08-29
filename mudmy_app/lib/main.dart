import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'core/services/supabase_service.dart';
import 'core/state/auth_provider.dart';
import 'core/state/location_provider.dart';
import 'core/state/message_count_provider.dart';
import 'core/state/theme_provider.dart';
import 'core/theme/app_theme.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();

  // Portrait orientation for phone-first UX.
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  final themeProvider = ThemeProvider();
  await themeProvider.load();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider.value(value: themeProvider),
        ChangeNotifierProvider(create: (_) => LocationProvider()..load()),
        ChangeNotifierProvider(create: (_) => MessageCountProvider()),
      ],
      child: const MudmyApp(),
    ),
  );
}

class MudmyApp extends StatelessWidget {
  const MudmyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();

    return MaterialApp(
      title: 'หมุดหมาย - Mudmy',
      debugShowCheckedModeBanner: false,
      theme: theme.theme,
      darkTheme: AppTheme.dark,
      themeMode: theme.mode,
      home: const SplashScreen(),
      builder: (context, child) {
        // Transparent status bar handled per-screen with SafeArea.
        return child!;
      },
    );
  }
}
