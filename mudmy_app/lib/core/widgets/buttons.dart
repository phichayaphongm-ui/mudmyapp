import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Primary gradient CTA button with glow, matching the web app's "fancy button".
class FancyButton extends StatelessWidget {
  const FancyButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.expanded = true,
    this.gradient = AppColors.brandGradient,
    this.height = 54,
    this.danger = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool expanded;
  final LinearGradient gradient;
  final double height;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    final bg = danger
        ? const LinearGradient(colors: [AppColors.danger, Color(0xFFB91C1C)])
        : gradient;

    final button = AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: enabled ? 1 : 0.55,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          gradient: bg,
          borderRadius: BorderRadius.circular(18),
          boxShadow: enabled && !danger
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: enabled ? onPressed : null,
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[
                          Icon(icon, color: Colors.white, size: 20),
                          const SizedBox(width: 8),
                        ],
                        Text(label, style: AppTextStyles.button.copyWith(color: Colors.white)),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );

    return expanded
        ? SizedBox(width: double.infinity, child: button)
        : button;
  }
}

/// Soft secondary button.
class SoftButton extends StatelessWidget {
  const SoftButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.color = AppColors.primary,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final bg = Color.alphaBlend(color.withValues(alpha: 0.12), Colors.transparent);
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onPressed,
        child: Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
              ],
              Text(label, style: AppTextStyles.button.copyWith(color: color)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Pills / filter chip with category-aware color.
class FilterChipPill extends StatelessWidget {
  const FilterChipPill({
    super.key,
    required this.label,
    this.selected = false,
    this.color,
    this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final Color? color;
  final VoidCallback? onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppColors.primary;
    final theme = Theme.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? accent : (isDark ? AppColors.surfaceDark : Colors.white),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: selected ? accent : theme.dividerColor,
            width: 1.4,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: selected ? Colors.white : accent),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: AppTextStyles.label.copyWith(
                color: selected ? Colors.white : theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
