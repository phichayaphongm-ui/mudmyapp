import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Centralized text styles using the Kanit Thai-ready font family.
class AppTextStyles {
  AppTextStyles._();

  static TextStyle get kanit =>
      GoogleFonts.kanit(fontWeight: FontWeight.w400, letterSpacing: 0);

  static TextStyle get display => GoogleFonts.kanit(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.2,
      );

  static TextStyle get headline => GoogleFonts.kanit(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        height: 1.3,
      );

  static TextStyle get title => GoogleFonts.kanit(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  static TextStyle get body => GoogleFonts.kanit(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.kanit(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.4,
      );

  static TextStyle get label => GoogleFonts.kanit(
        fontSize: 13,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get small => GoogleFonts.kanit(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get caption => GoogleFonts.kanit(
        fontSize: 11,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get button => GoogleFonts.kanit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.3,
      );

  static TextStyle get price => GoogleFonts.kanit(
        fontSize: 20,
        fontWeight: FontWeight.w700,
      );
}
