import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_text_styles.dart';

/// Application theme: light + dark, brand orange, generous rounded corners.
class AppTheme {
  AppTheme._();

  static const double radius = 20;
  static const double radiusLg = 26;
  static const double radiusXl = 32;

  static ThemeData get light => _build(_ColorTokens.light(), Brightness.light);

  static ThemeData get dark => _build(_ColorTokens.dark(), Brightness.dark);

  static ThemeData _build(_ColorTokens c, Brightness brightness) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.primary,
      onPrimary: Colors.white,
      secondary: c.secondary,
      onSecondary: Colors.white,
      error: AppColors.danger,
      onError: Colors.white,
      surface: c.surface,
      onSurface: c.textPrimary,
      surfaceContainerHighest: c.divider,
      onSurfaceVariant: c.textSecondary,
      outline: c.divider,
      shadow: Colors.black.withValues(alpha: 0.1),
      surfaceTint: Colors.transparent,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.background,
      fontFamily: GoogleFonts.kanit().fontFamily,
      splashFactory: InkSparkle.splashFactory,
    );

    return base.copyWith(
      textTheme: GoogleFonts.kanitTextTheme(base.textTheme).copyWith(
        displayLarge: AppTextStyles.display.copyWith(color: c.textPrimary),
        headlineLarge: AppTextStyles.headline.copyWith(color: c.textPrimary),
        titleLarge: AppTextStyles.title.copyWith(color: c.textPrimary),
        bodyLarge: AppTextStyles.body.copyWith(color: c.textPrimary),
        bodyMedium: AppTextStyles.bodyMedium.copyWith(color: c.textPrimary),
        labelLarge: AppTextStyles.button.copyWith(color: c.textPrimary),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        foregroundColor: c.textPrimary,
        titleTextStyle: AppTextStyles.title.copyWith(
          color: c.textPrimary,
          fontWeight: FontWeight.w700,
          fontSize: 19,
        ),
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.inputFill,
        hintStyle: AppTextStyles.body.copyWith(color: c.textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: c.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: c.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.danger, width: 1.8),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          textStyle: AppTextStyles.button,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.primary,
          minimumSize: const Size.fromHeight(50),
          textStyle: AppTextStyles.button,
          side: BorderSide(color: c.primary, width: 1.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.primary,
          textStyle: AppTextStyles.button,
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: c.surface,
        selectedColor: c.primary,
        labelStyle: AppTextStyles.label.copyWith(color: c.textPrimary),
        secondaryLabelStyle: AppTextStyles.label.copyWith(color: Colors.white),
        side: BorderSide(color: c.divider),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: c.surface,
        selectedItemColor: c.primary,
        unselectedItemColor: c.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusLg)),
        titleTextStyle: AppTextStyles.headline.copyWith(color: c.textPrimary),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(radiusXl)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.textPrimary,
        contentTextStyle: AppTextStyles.body.copyWith(color: c.background),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      dividerColor: c.divider,
      progressIndicatorTheme: ProgressIndicatorThemeData(color: c.primary),
      listTileTheme: ListTileThemeData(
        iconColor: c.textSecondary,
        textColor: c.textPrimary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}

class _ColorTokens {
  _ColorTokens({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.divider,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.primary,
    required this.secondary,
    required this.inputFill,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color divider;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color primary;
  final Color secondary;
  final Color inputFill;

  factory _ColorTokens.light() => _ColorTokens(
        background: AppColors.backgroundLight,
        surface: AppColors.surfaceLight,
        surfaceAlt: AppColors.champagne,
        divider: AppColors.dividerLight,
        textPrimary: AppColors.textPrimary,
        textSecondary: AppColors.textSecondary,
        textMuted: AppColors.textMuted,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        inputFill: const Color(0xFFF5F0ED),
      );

  factory _ColorTokens.dark() => _ColorTokens(
        background: AppColors.backgroundDark,
        surface: AppColors.surfaceDark,
        surfaceAlt: AppColors.surfaceDarkElevated,
        divider: AppColors.dividerDark,
        textPrimary: AppColors.textPrimaryDark,
        textSecondary: AppColors.textSecondaryDark,
        textMuted: AppColors.textMuted,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        inputFill: const Color(0xFF252525),
      );
}
