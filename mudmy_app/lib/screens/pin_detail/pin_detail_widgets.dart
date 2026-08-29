import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/pin.dart';
import '../../core/models/review.dart';
import '../../core/services/pin_service.dart';
import '../../core/services/review_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/buttons.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/image_widgets.dart';

class RoundIconButton extends StatelessWidget {
  const RoundIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.color,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? AppColors.surfaceDarkElevated.withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(9),
          child: Icon(icon, size: 20, color: color ?? AppColors.textPrimary),
        ),
      ),
    );
  }
}

class PinGallery extends StatefulWidget {
  const PinGallery({
    super.key,
    required this.images,
    required this.pin,
    required this.imageIndex,
    required this.onImageChanged,
  });

  final List<String> images;
  final Pin pin;
  final int imageIndex;
  final ValueChanged<int> onImageChanged;

  @override
  State<PinGallery> createState() => _PinGalleryState();
}

class _PinGalleryState extends State<PinGallery> {
  late final PageController _controller = PageController(initialPage: widget.imageIndex);

  @override
  Widget build(BuildContext context) {
    final pin = widget.pin;
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          controller: _controller,
          itemCount: widget.images.length,
          onPageChanged: widget.onImageChanged,
          itemBuilder: (_, i) => MudmyImage(url: widget.images[i], borderRadius: 0),
        ),
        // bottom gradient
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black.withValues(alpha: 0.15), Colors.transparent, Colors.black.withValues(alpha: 0.25)],
              ),
            ),
          ),
        ),
        Positioned(
          left: 16,
          bottom: 14,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: pin.category.color.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  children: [
                    Icon(pin.category.icon, size: 15, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(pin.category.label,
                        style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              if (pin.featured) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.warning,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text('⭐ ยอดนิยม',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
        ),
        if (pin.pinNumber != null)
          Positioned(
            right: 16,
            bottom: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.45),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.copy_rounded, size: 13, color: Colors.white),
                  const SizedBox(width: 5),
                  Text('#${pin.pinNumber}',
                      style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        if (widget.images.length > 1)
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < widget.images.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: i == widget.imageIndex ? 20 : 7,
                      height: 7,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: i == widget.imageIndex ? 1 : 0.5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class InfoHeader extends StatelessWidget {
  const InfoHeader({super.key, required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(pin.title, style: AppTextStyles.headline.copyWith(fontSize: 20)),
            ),
            if (pin.isEmergency)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.danger,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Text('🆘 ช่วยด่วน',
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Icon(Icons.location_on_outlined, size: 15, color: AppColors.textMuted),
            const SizedBox(width: 3),
            Expanded(
              child: Text(
                '${pin.address.isEmpty ? '' : '${pin.address} · '}${pin.district} ${pin.province}',
                style: AppTextStyles.small.copyWith(color: AppColors.textSecondary),
              ),
            ),
            Text(Fmt.timeAgo(pin.createdAt),
                style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            RatingStars(rating: pin.rating, showValue: true, count: pin.reviewCount),
            const SizedBox(width: 12),
            _Stat(icon: Icons.visibility_outlined, label: '${pin.views} ครั้ง'),
            const SizedBox(width: 12),
            _Stat(icon: Icons.favorite_outline, label: '${pin.favoriteCount}'),
            if (pin.plan == UserPlan.enterprise) ...[
              const SizedBox(width: 12),
              const _Stat(icon: Icons.workspace_premium_outlined, label: 'Enterprise'),
            ],
          ],
        ),
        if (pin.isEmergency && pin.expiresAt != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined, color: AppColors.danger),
                const SizedBox(width: 8),
                Text(
                  'หมดเวลาช่วยเหลือในอีก ${Fmt.durationThai(pin.expiresAt!.difference(DateTime.now()).isNegative ? Duration.zero : pin.expiresAt!.difference(DateTime.now()))}',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 3),
        Text(label, style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
      ],
    );
  }
}

class ContactCard extends StatelessWidget {
  const ContactCard({super.key, required this.pin, required this.onCall, required this.onLine});

  final Pin pin;
  final VoidCallback onCall;
  final VoidCallback onLine;

  @override
  Widget build(BuildContext context) {
    final hasPhone = pin.contact.phone != null && pin.contact.phone!.isNotEmpty;
    final hasLine = pin.contact.line != null && pin.contact.line!.isNotEmpty;

    return _Card(
      title: 'ช่องทางติดต่อ',
      icon: Icons.contact_phone_outlined,
      child: Row(
        children: [
          if (hasPhone)
            Expanded(
              child: SoftButton(
                label: 'โทร',
                icon: Icons.call_rounded,
                color: AppColors.success,
                onPressed: onCall,
              ),
            )
          else
            const Spacer(),
          if (hasPhone && hasLine) const SizedBox(width: 10),
          if (hasLine)
            Expanded(
              child: SoftButton(
                label: 'ไลน์',
                icon: Icons.chat_rounded,
                color: AppColors.success,
                onPressed: onLine,
              ),
            ),
          if (!hasPhone && !hasLine)
            Text('ไม่มีช่องทางติดต่อ', style: AppTextStyles.body.copyWith(color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class DescriptionCard extends StatelessWidget {
  const DescriptionCard({super.key, required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    return _Card(
      title: 'รายละเอียด',
      icon: Icons.description_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (pin.price != null && pin.price! > 0)
            Row(
              children: [
                Text('ราคา ', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
                Text(Fmt.baht(pin.price), style: AppTextStyles.price.copyWith(color: AppColors.primary)),
              ],
            ),
          if (pin.price != null && pin.price! > 0) const SizedBox(height: 8),
          Text(pin.description, style: AppTextStyles.body, textAlign: TextAlign.justify),
        ],
      ),
    );
  }
}

class LocationCard extends StatelessWidget {
  const LocationCard({super.key, required this.pin, required this.onOpenMaps});

  final Pin pin;
  final VoidCallback onOpenMaps;

  @override
  Widget build(BuildContext context) {
    return _Card(
      title: 'ที่ตั้ง',
      icon: Icons.map_outlined,
      child: Column(
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(Icons.map_rounded, size: 56, color: AppColors.primary.withValues(alpha: 0.35)),
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: 10)],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: onOpenMaps,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.near_me_outlined, size: 18, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text('เปิดใน Google Maps', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OwnerCard extends StatelessWidget {
  const OwnerCard({super.key, required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    return _Card(
      title: 'เจ้าของหมุดหมาย',
      icon: Icons.person_outline,
      child: Row(
        children: [
          MudmyAvatar(imageUrl: pin.ownerAvatar, name: pin.ownerName, radius: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(pin.ownerName, style: AppTextStyles.title),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.warning),
                    Text(
                      ' ${pin.rating > 0 ? pin.rating.toStringAsFixed(1) : 'ใหม่'}',
                      style: AppTextStyles.caption.copyWith(color: AppColors.warning, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.push_pin_outlined, size: 13, color: AppColors.textMuted),
                    Text(' ${pin.ownerType == 'business' ? 'ธุรกิจ' : 'บุคคล'}',
                        style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class HeroResolveCard extends StatelessWidget {
  const HeroResolveCard({super.key, required this.pin, required this.onDone});

  final Pin pin;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.success.withValues(alpha: 0.12), AppColors.primary.withValues(alpha: 0.08)]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.emoji_events_rounded, color: AppColors.warning, size: 22),
              SizedBox(width: 8),
              Text('หมุดหมายเหตุฉุกเฉินนี้ช่วยเหลือแล้วหรือยัง?',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 10),
          FancyButton(
            label: 'ฉันคือฮีโร่ที่ช่วยเหลือ',
            icon: Icons.volunteer_activism_outlined,
            expanded: false,
            gradient: const LinearGradient(colors: [AppColors.success, Color(0xFF059669)]),
            onPressed: () async {
              final ok = await confirmDialog(
                context,
                title: 'ยืนยันการช่วยเหลือ',
                message: 'คุณช่วยเหลือหมุดหมายนี้จริง ๆ ใช่หรือไม่? ระบบจะบันทึกเป็นประวัติฮีโร่ของคุณ',
                confirmLabel: 'ยืนยัน',
              );
              if (!ok) return;
              final auth = context.read<AuthProvider>();
              final me = auth.user;
              if (me == null) return;
              await PinService.instance.resolvePin(pin.id, me.id, 'ขอบคุณมากสำหรับการช่วยเหลือ 🙏');
              showToast(context, 'ขอบคุณที่เป็นฮีโร่ของชุมชน! 🌟');
              onDone();
            },
          ),
        ],
      ),
    );
  }
}

class OwnerActions extends StatelessWidget {
  const OwnerActions({super.key, required this.pin, required this.onDelete, required this.onReport});

  final Pin pin;
  final VoidCallback onDelete;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SoftButton(
            label: 'ลบหมุดหมาย',
            icon: Icons.delete_outline,
            color: AppColors.danger,
            onPressed: onDelete,
          ),
        ),
        if (!pin.isFreePin) ...[
          const SizedBox(width: 10),
          Expanded(
            child: SoftButton(
              label: 'ต่ออายุ',
              icon: Icons.refresh_rounded,
              color: AppColors.primary,
              onPressed: () async {
                await PinService.instance.renewPaidPin(pin.id);
                showToast(context, 'ต่ออายุหมุดหมายแล้ว 30 วัน');
              },
            ),
          ),
        ],
      ],
    );
  }
}

class ReviewSection extends StatefulWidget {
  const ReviewSection({
    super.key,
    required this.pinId,
    required this.reviews,
    required this.onAdded,
  });

  final String pinId;
  final List<Review> reviews;
  final ValueChanged<Review> onAdded;

  @override
  State<ReviewSection> createState() => _ReviewSectionState();
}

class _ReviewSectionState extends State<ReviewSection> {
  int _rating = 5;
  final _comment = TextEditingController();

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    if (me == null) return;
    if (_comment.text.trim().isEmpty) {
      showToast(context, 'กรุณาเขียนรีวิว', error: true);
      return;
    }
    final review = Review(
      id: 'r_${DateTime.now().microsecondsSinceEpoch}',
      pinId: widget.pinId,
      userId: me.id,
      userName: me.displayName,
      userAvatar: me.avatar,
      rating: _rating.toDouble(),
      comment: _comment.text.trim(),
    );
    await ReviewService.instance.addReview(widget.pinId, review);
    widget.onAdded(review);
    _comment.clear();
    if (mounted) {
      showToast(context, 'บันทึกรีวิวแล้ว ขอบคุณค่ะ');
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: 'รีวิว', subtitle: '${widget.reviews.length} รีวิว'),
        const SizedBox(height: 8),
        _WriteReview(
          rating: _rating,
          comment: _comment,
          onRating: (r) => setState(() => _rating = r),
          onSubmit: _submit,
        ),
        const SizedBox(height: 12),
        if (widget.reviews.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: Text('ยังไม่มีรีวิว เริ่มรีวิวเป็นคนแรก!')),
          )
        else
          for (final r in widget.reviews)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _ReviewTile(review: r),
            ),
      ],
    );
  }
}

class _WriteReview extends StatelessWidget {
  const _WriteReview({
    required this.rating,
    required this.comment,
    required this.onRating,
    required this.onSubmit,
  });

  final int rating;
  final TextEditingController comment;
  final ValueChanged<int> onRating;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).inputDecorationTheme.fillColor,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('ให้คะแนน: ', style: AppTextStyles.label),
              const SizedBox(width: 6),
              for (var i = 1; i <= 5; i++)
                InkWell(
                  onTap: () => onRating(i),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Icon(
                      i <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: AppColors.warning,
                      size: 28,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: comment,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'เขียนรีวิวของคุณ...'),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: FancyButton(
              label: 'ส่งรีวิว',
              expanded: false,
              onPressed: onSubmit,
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              MudmyAvatar(imageUrl: review.userAvatar, name: review.userName, radius: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.userName, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                    Text(Fmt.timeAgo(review.createdAt),
                        style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
                  ],
                ),
              ),
              const Icon(Icons.star_rounded, size: 16, color: AppColors.warning),
              Text(' ${review.rating.toStringAsFixed(1)}',
                  style: AppTextStyles.caption.copyWith(color: AppColors.warning, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          Text(review.comment, style: AppTextStyles.body),
          if (review.images.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 72,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final img in review.images)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: MudmyImage(url: img, width: 72, height: 72, borderRadius: 10),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class BottomActionBar extends StatelessWidget {
  const BottomActionBar({super.key, required this.pin, required this.onCall, required this.onChat});

  final Pin pin;
  final VoidCallback onCall;
  final VoidCallback onChat;

  @override
  Widget build(BuildContext context) {
    final hasPhone = pin.contact.phone != null && pin.contact.phone!.isNotEmpty;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4)),
          ],
        ),
        child: Row(
          children: [
            if (hasPhone) ...[
              Expanded(
                child: SoftButton(
                  label: 'โทร',
                  icon: Icons.call_rounded,
                  color: AppColors.success,
                  onPressed: onCall,
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              flex: 2,
              child: FancyButton(
                label: 'คุยกับเจ้าของ',
                icon: Icons.chat_bubble_rounded,
                height: 50,
                onPressed: onChat,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.icon, required this.child});

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(title, style: AppTextStyles.title),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
