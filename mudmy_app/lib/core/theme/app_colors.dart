import 'package:flutter/material.dart';

/// Mudmy brand palette.
class AppColors {
  AppColors._();

  // Brand
  static const Color primary = Color(0xFFFF7E36);
  static const Color primaryDark = Color(0xFFF0611F);
  static const Color secondary = Color(0xFFF43F5E);
  static const Color champagne = Color(0xFFFFF5F0);
  static const Color midnight = Color(0xFF1A1A1A);

  // Functional
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Text
  static const Color textPrimary = Color(0xFF1C1B1F);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);

  // Surfaces (light)
  static const Color backgroundLight = Color(0xFFFBF7F4);
  static const Color surfaceLight = Colors.white;
  static const Color dividerLight = Color(0xFFEFE6E0);

  // Surfaces (dark)
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color surfaceDarkElevated = Color(0xFF2A2A2A);
  static const Color dividerDark = Color(0xFF333333);
  static const Color textPrimaryDark = Color(0xFFF3F4F6);
  static const Color textSecondaryDark = Color(0xFFB0B0B0);

  /// Gradient used for primary CTAs and headers.
  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFFFF7E36), Color(0xFFF43F5E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient brandGradientSoft = LinearGradient(
    colors: [Color(0xFFFFAD7E), Color(0xFFFF7E36)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Shimmer / skeleton placeholder color.
  static const Color skeleton = Color(0xFFE8E0DB);
  static const Color skeletonDark = Color(0xFF2E2E2E);
}
