import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Circular avatar with network image, colored-initial fallback, and optional ring.
class MudmyAvatar extends StatelessWidget {
  const MudmyAvatar({
    super.key,
    this.imageUrl,
    required this.name,
    this.radius = 24,
    this.showRing = false,
    this.onTap,
  });

  final String? imageUrl;
  final String name;
  final double radius;
  final bool showRing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final fallbackColor = _colorFor(name);

    final avatar = Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: fallbackColor.withValues(alpha: 0.18),
        border: showRing ? Border.all(color: AppColors.primary, width: 2.5) : null,
        boxShadow: [
          BoxShadow(
            color: fallbackColor.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: imageUrl!,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => _Initials(name: name, color: fallbackColor),
            )
          : _Initials(name: name, color: fallbackColor),
    );

    if (onTap == null) return avatar;
    return GestureDetector(onTap: onTap, child: avatar);
  }

  static Color _colorFor(String name) {
    const palette = [
      AppColors.primary,
      Color(0xFF3B82F6),
      Color(0xFF10B981),
      Color(0xFF8B5CF6),
      Color(0xFFEC4899),
      Color(0xFFF59E0B),
      Color(0xFF06B6D4),
    ];
    var hash = 0;
    for (final c in name.codeUnits) {
      hash = (hash + c) % 997;
    }
    return palette[hash % palette.length];
  }
}

class _Initials extends StatelessWidget {
  const _Initials({required this.name, required this.color});

  final String name;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isEmpty
        ? '?'
        : name.trim().characters.first.toUpperCase();
    return Center(
      child: Text(
        initials,
        style: AppTextStyles.title.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
      ),
    );
  }
}

/// Network image with rounded corners and graceful placeholder/error states.
class MudmyImage extends StatelessWidget {
  const MudmyImage({
    super.key,
    required this.url,
    this.borderRadius = 16,
    this.fit = BoxFit.cover,
    this.height,
    this.width,
  });

  final String? url;
  final double borderRadius;
  final BoxFit fit;
  final double? height;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final placeholderColor = isDark ? AppColors.skeletonDark : AppColors.skeleton;

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        height: height,
        width: width,
        child: url == null || url!.isEmpty
            ? Container(
                color: placeholderColor,
                alignment: Alignment.center,
                child: Icon(Icons.image_outlined, color: AppColors.textMuted, size: 34),
              )
            : CachedNetworkImage(
                imageUrl: url!,
                fit: fit,
                width: width,
                height: height,
                placeholder: (_, __) => Container(
                  color: placeholderColor,
                  child: const Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: placeholderColor,
                  alignment: Alignment.center,
                  child: Icon(Icons.broken_image_outlined, color: AppColors.textMuted, size: 30),
                ),
              ),
      ),
    );
  }
}
