import 'package:flutter/material.dart';

import '../models/pin.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../utils/formatters.dart';
import 'image_widgets.dart';

/// Premium pin card used in home rows and explore lists.
class PinCard extends StatelessWidget {
  const PinCard({
    super.key,
    required this.pin,
    this.onTap,
    this.distanceMeters,
    this.compact = false,
    this.showOwner = true,
  });

  final Pin pin;
  final VoidCallback? onTap;
  final double? distanceMeters;
  final bool compact;
  final bool showOwner;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: compact ? null : 240,
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.35 : 0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CardImage(pin: pin, height: compact ? 130 : 150),
            Padding(
              padding: EdgeInsets.all(compact ? 10 : 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (pin.isEmergency)
                    _EmergencyCountdown(pin: pin)
                  else if (pin.price != null && pin.price! > 0)
                    Text(
                      Fmt.baht(pin.price),
                      style: AppTextStyles.price.copyWith(color: AppColors.primary),
                    )
                  else if (pin.priceLabel != null && pin.priceLabel!.isNotEmpty)
                    Text(
                      pin.priceLabel!,
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    pin.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.title.copyWith(fontSize: compact ? 14 : 15),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          '${pin.district.isEmpty ? pin.province : pin.district}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                        ),
                      ),
                    ],
                  ),
                  if (distanceMeters != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      '${Fmt.distanceKm(distanceMeters)} จากคุณ',
                      style: AppTextStyles.caption.copyWith(color: AppColors.info),
                    ),
                  ],
                  if (showOwner) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        MudmyAvatar(imageUrl: pin.ownerAvatar, name: pin.ownerName, radius: 9),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            pin.ownerName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                        const Icon(Icons.star_rounded, size: 14, color: AppColors.warning),
                        const SizedBox(width: 2),
                        Text(
                          pin.rating > 0 ? pin.rating.toStringAsFixed(1) : 'ใหม่',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.warning,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardImage extends StatelessWidget {
  const _CardImage({required this.pin, required this.height});

  final Pin pin;
  final double height;

  @override
  Widget build(BuildContext context) {
    final image = pin.images.isNotEmpty
        ? pin.images.first
        : null;

    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          MudmyImage(url: image, borderRadius: 0),
          // gradient for text legibility
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.35),
                  ],
                ),
              ),
            ),
          ),
          // category badge
          Positioned(
            top: 8,
            left: 8,
            child: _CategoryBadge(pin: pin),
          ),
          // featured / emergency badges
          Positioned(
            top: 8,
            right: 8,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (pin.featured)
                  _Badge(
                    label: '⭐ ยอดนิยม',
                    color: AppColors.warning,
                    textColor: Colors.white,
                  ),
                if (pin.isEmergency) ...[
                  const SizedBox(height: 4),
                  _Badge(
                    label: 'ช่วยด่วน',
                    color: AppColors.danger,
                    textColor: Colors.white,
                    pulse: true,
                  ),
                ],
              ],
            ),
          ),
          if (pin.isEmergency && pin.expiresAt != null)
            Positioned(
              left: 8,
              bottom: 8,
              child: _EmergencyCountdownOverlay(pin: pin),
            ),
        ],
      ),
    );
  }
}

class _CategoryBadge extends StatelessWidget {
  const _CategoryBadge({required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: pin.category.color.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(pin.category.icon, size: 13, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            pin.category.label,
            style: AppTextStyles.caption.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color, required this.textColor, this.pulse = false});

  final String label;
  final Color color;
  final Color textColor;
  final bool pulse;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.5),
            blurRadius: 10,
            spreadRadius: pulse ? 1 : 0,
          ),
        ],
      ),
      child: Text(
        label,
        style: AppTextStyles.caption.copyWith(color: textColor, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _EmergencyCountdown extends StatelessWidget {
  const _EmergencyCountdown({required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    final left = (pin.expiresAt?.difference(DateTime.now()) ?? Duration.zero).isNegative
        ? const Duration(minutes: 0)
        : pin.expiresAt?.difference(DateTime.now()) ?? Duration.zero;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.timer_outlined, size: 14, color: AppColors.danger),
        const SizedBox(width: 4),
        Text(
          'ช่วยด่วน: อีก ${Fmt.durationThai(left)}',
          style: AppTextStyles.caption.copyWith(color: AppColors.danger, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _EmergencyCountdownOverlay extends StatelessWidget {
  const _EmergencyCountdownOverlay({required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    final left = pin.expiresAt?.difference(DateTime.now()) ?? Duration.zero;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.danger,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '⏱ ${Fmt.durationThai(left.isNegative ? Duration.zero : left)}',
        style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
      ),
    );
  }
}
