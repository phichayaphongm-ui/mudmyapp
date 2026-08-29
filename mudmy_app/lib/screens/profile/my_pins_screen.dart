import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/pin.dart';
import '../../core/services/pin_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/image_widgets.dart';
import '../pin_detail/pin_detail_screen.dart';

class MyPinsScreen extends StatefulWidget {
  const MyPinsScreen({super.key});

  @override
  State<MyPinsScreen> createState() => _MyPinsScreenState();
}

class _MyPinsScreenState extends State<MyPinsScreen> {
  List<Pin> _pins = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    final pins = await PinService.instance.getUserPins(uid);
    if (!mounted) return;
    setState(() {
      _pins = pins;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('หมุดหมายของฉัน')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _pins.isEmpty
                ? const EmptyState(
                    icon: Icons.push_pin_outlined,
                    title: 'ยังไม่มีหมุดหมาย',
                    subtitle: 'กดปุ่ม + เพื่อปักหมุดแรกของคุณ',
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: _pins.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _MyPinTile(
                      pin: _pins[i],
                      onRefresh: _load,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => PinDetailScreen(pinId: _pins[i].id)),
                      ).then((_) => _load()),
                    ),
                  ),
      ),
    );
  }
}

class _MyPinTile extends StatelessWidget {
  const _MyPinTile({required this.pin, required this.onRefresh, required this.onTap});

  final Pin pin;
  final VoidCallback onRefresh;
  final VoidCallback onTap;

  Future<void> _checkIn() async {
    await PinService.instance.checkInFreePin(pin.id);
    onRefresh();
  }

  @override
  Widget build(BuildContext context) {
    final active = pin.status == PinStatus.active;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 82,
              height: 82,
              child: MudmyImage(
                url: pin.images.isNotEmpty ? pin.images.first : null,
                borderRadius: 14,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(pin.category.icon, size: 14, color: pin.category.color),
                      const SizedBox(width: 4),
                      Text(pin.category.label,
                          style: AppTextStyles.caption.copyWith(color: pin.category.color)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(pin.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.title.copyWith(fontSize: 15)),
                  const SizedBox(height: 4),
                  _StatusBadge(pin: pin),
                  const SizedBox(height: 2),
                  if (active)
                    Text('หมดอายุ ${Fmt.date(pin.expiresAt ?? DateTime.now())}',
                        style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (active && pin.isFreePin)
              _ActionChip(
                label: 'เช็คอิน',
                icon: Icons.touch_app_rounded,
                color: AppColors.success,
                onTap: _checkIn,
              )
            else if (active && !pin.isFreePin)
              _ActionChip(
                label: 'ต่ออายุ',
                icon: Icons.refresh_rounded,
                color: AppColors.primary,
                onTap: () async {
                  await PinService.instance.renewPaidPin(pin.id);
                  onRefresh();
                  if (context.mounted) showToast(context, 'ต่ออายุแล้ว 30 วัน');
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.pin});

  final Pin pin;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (pin.status) {
      PinStatus.active => ('ใช้งานอยู่', AppColors.success),
      PinStatus.expired => ('หมดอายุ', AppColors.textMuted),
      PinStatus.pendingPayment => ('รอชำระเงิน', AppColors.warning),
      PinStatus.resolved => ('ช่วยเหลือแล้ว', AppColors.info),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: AppTextStyles.caption.copyWith(color: color, fontWeight: FontWeight.w600)),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.label, required this.icon, required this.color, required this.onTap});

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 2),
            Text(label, style: AppTextStyles.caption.copyWith(color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
