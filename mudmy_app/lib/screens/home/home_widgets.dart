import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/category.dart';
import '../../core/models/chat.dart';
import '../../core/models/pin.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/image_widgets.dart';
import '../../core/widgets/pin_card.dart';
import 'home_data.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key, required this.name, required this.onAvatar});

  final String name;
  final VoidCallback onAvatar;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final me = auth.user;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: onAvatar,
            child: MudmyAvatar(
              imageUrl: me?.avatar,
              name: me?.displayName ?? 'M',
              radius: 22,
              showRing: true,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('สวัสดีคุณ $name 👋',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
                Text('วันนี้อยากปักหมุดอะไรดี?', style: AppTextStyles.title),
              ],
            ),
          ),
          // theme quick toggle handled in settings; keep header clean
          const _PulseDot(),
        ],
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  const _PulseDot();

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween(begin: 0.8, end: 1.2).animate(
        CurvedAnimation(parent: _c, curve: Curves.easeInOut),
      ),
      child: Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          color: AppColors.success,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: AppColors.success.withValues(alpha: 0.5), blurRadius: 8),
          ],
        ),
      ),
    );
  }
}

class HomeSearchBar extends StatelessWidget {
  const HomeSearchBar({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Theme.of(context).inputDecorationTheme.fillColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Row(
            children: [
              const Icon(Icons.search_rounded, color: AppColors.textMuted),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ค้นหาสินค้า บริการ ธุรกิจใกล้คุณ...',
                  style: AppTextStyles.body.copyWith(color: AppColors.textMuted),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('ค้นหา', style: AppTextStyles.caption.copyWith(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HeroBanner extends StatelessWidget {
  const HeroBanner({super.key, required this.title, required this.index});

  final String title;
  final int index;

  static const _gradients = [
    AppColors.brandGradient,
    LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF7C3AED)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFF059669), Color(0xFF0EA5E9)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFE11D48), Color(0xFFF59E0B)], begin: Alignment.topLeft, end: Alignment.bottomRight),
  ];

  @override
  Widget build(BuildContext context) {
    final gradient = _gradients[index % _gradients.length];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(26),
        ),
        child: Stack(
          children: [
            Positioned(
              right: -20,
              bottom: -30,
              child: Icon(Icons.push_pin_rounded, size: 160, color: Colors.white.withValues(alpha: 0.12)),
            ),
            Positioned(
              left: 20,
              top: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'หมุดหมาย',
                    style: AppTextStyles.caption.copyWith(
                      color: Colors.white.withValues(alpha: 0.9),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: 240,
                    child: Text(
                      title,
                      style: AppTextStyles.headline.copyWith(
                        color: Colors.white,
                        fontSize: 22,
                        height: 1.35,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      'สำรวจเลย',
                      style: AppTextStyles.label.copyWith(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BannerDots extends StatelessWidget {
  const BannerDots({super.key, required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: i == index ? 22 : 8,
            height: 8,
            margin: const EdgeInsets.only(right: 6),
            decoration: BoxDecoration(
              color: i == index ? AppColors.primary : AppColors.primary.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
      ],
    );
  }
}

class CategoryGrid extends StatelessWidget {
  const CategoryGrid({super.key, required this.onTap});

  final ValueChanged<PinCategory> onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          mainAxisSpacing: 6,
          crossAxisSpacing: 6,
          childAspectRatio: 0.72,
        ),
        itemCount: PinCategory.values.length,
        itemBuilder: (_, i) {
          final c = PinCategory.values[i];
          return _CategoryTile(
            category: c,
            onTap: () => onTap(c),
            isDark: isDark,
          );
        },
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category, required this.onTap, required this.isDark});

  final PinCategory category;
  final VoidCallback onTap;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: category.color.withValues(alpha: isDark ? 0.2 : 0.13),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(category.icon, color: category.color, size: 24),
          ),
          const SizedBox(height: 7),
          Text(
            category.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.caption.copyWith(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textSecondary,
              fontSize: 10.5,
            ),
          ),
        ],
      ),
    );
  }
}

class CommunityTicker extends StatelessWidget {
  const CommunityTicker({super.key, required this.future});

  final Future<HomeData> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<HomeData>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: SkeletonBox(height: 64),
          );
        }
        if (snap.hasError) return const SizedBox.shrink();
        final events = snap.data!.events;
        if (events.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.secondary.withValues(alpha: 0.06)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
            ),
            child: _TickerList(events: events),
          ),
        );
      },
    );
  }
}

class _TickerList extends StatefulWidget {
  const _TickerList({required this.events});

  final List<ActivityEvent> events;

  @override
  State<_TickerList> createState() => _TickerListState();
}

class _TickerListState extends State<_TickerList> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final event = widget.events[_index % widget.events.length];
    return GestureDetector(
      onTap: () => setState(() => _index = (_index + 1) % widget.events.length),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 500),
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position: Tween(begin: const Offset(0.06, 0), end: Offset.zero).animate(anim),
            child: child,
          ),
        ),
        child: Row(
          key: ValueKey('$_index'),
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: (event.category?.color ?? AppColors.primary).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                event.type == 'pin' ? Icons.push_pin_rounded : Icons.star_rounded,
                color: event.category?.color ?? AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                  Text(
                    '${event.subtitle} · ${Fmt.timeAgo(event.createdAt)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const Icon(Icons.touch_app_outlined, size: 16, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class AiPromoCard extends StatelessWidget {
  const AiPromoCard({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.midnight,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('AI เช็คความพร้อมธุรกิจ',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                    SizedBox(height: 4),
                    Text('ตรวจสอบโปรไฟล์ของคุณและรับคะแนนความพร้อม',
                        style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white54, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class PinsSection extends StatelessWidget {
  const PinsSection({
    super.key,
    required this.title,
    required this.subtitle,
    required this.future,
    required this.selector,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final Future<HomeData> future;
  final List<Pin> Function(HomeData) selector;
  final ValueChanged<Pin> onTap;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<HomeData>(
      future: future,
      builder: (context, snap) {
        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: SectionHeader(title: title, subtitle: subtitle),
              ),
              if (snap.connectionState != ConnectionState.done)
                const SizedBox(
                  height: 210,
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20),
                    child: SkeletonBox(),
                  ),
                )
              else if (snap.hasError)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text('โหลดข้อมูลไม่สำเร็จ', style: AppTextStyles.body.copyWith(color: AppColors.danger)),
                )
              else ...[
                const SizedBox(height: 10),
                SizedBox(
                  height: 260,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: selector(snap.data!).length,
                    separatorBuilder: (_, __) => const SizedBox(width: 14),
                    itemBuilder: (_, i) {
                      final pin = selector(snap.data!)[i];
                      return PinCard(pin: pin, onTap: () => onTap(pin));
                    },
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
