import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/image_widgets.dart';
import 'favorites_screen.dart';
import 'my_pins_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Future<void> _refresh() async {
    setState(() {});
    await context.read<AuthProvider>().refreshProfile();
    if (mounted) setState(() {});
  }

  Future<void> _signOut() async {
    final ok = await confirmDialog(
      context,
      title: 'ออกจากระบบ?',
      message: 'คุณต้องการออกจากระบบตอนนี้หรือไม่?',
      confirmLabel: 'ออกจากระบบ',
    );
    if (!ok) return;
    await context.read<AuthProvider>().signOut();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final me = auth.user;

    if (me == null) {
      return const SizedBox.shrink();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
          children: [
            _ProfileHeader(
              name: me.displayName,
              email: me.email,
              avatar: me.avatar,
              isBusiness: me.userType == 'business',
              businessName: me.businessName,
              plan: me.plan,
              isDark: isDark,
            ),
            const SizedBox(height: 16),
            _StatsRow(user: me),
            const SizedBox(height: 24),
            _MenuTile(
              icon: Icons.push_pin_rounded,
              color: AppColors.primary,
              title: 'หมุดหมายของฉัน',
              subtitle: '${me.activePins} หมุดที่ใช้งานอยู่',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MyPinsScreen()),
              ),
            ),
            _MenuTile(
              icon: Icons.favorite_rounded,
              color: AppColors.secondary,
              title: 'รายการโปรด',
              subtitle: 'หมุดหมายที่คุณกดถูกใจ',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const FavoritesScreen()),
              ),
            ),
            _MenuTile(
              icon: Icons.settings_outlined,
              color: AppColors.info,
              title: 'ตั้งค่า',
              subtitle: 'แก้ไขโปรไฟล์ ธีม การแจ้งเตือน',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              ),
            ),
            _MenuTile(
              icon: Icons.workspace_premium_outlined,
              color: AppColors.warning,
              title: 'โปรโมตเป็น Enterprise',
              subtitle: 'ขายของได้ไม่จำกัด พร้อมฟีเจอร์สุดพิเศษ',
              badge: me.plan == 'enterprise' ? 'ใช้งานอยู่' : null,
              onTap: () => showToast(context, 'ฟีเจอร์นี้กำลังจะมาเร็ว ๆ นี้'),
            ),
            const SizedBox(height: 8),
            _MenuTile(
              icon: Icons.logout_rounded,
              color: AppColors.danger,
              title: 'ออกจากระบบ',
              subtitle: '',
              onTap: _signOut,
              isDanger: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.name,
    required this.email,
    required this.avatar,
    required this.isBusiness,
    required this.businessName,
    required this.plan,
    required this.isDark,
  });

  final String name;
  final String email;
  final String? avatar;
  final bool isBusiness;
  final String? businessName;
  final String plan;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.secondary],
        ),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        children: [
          MudmyAvatar(
            imageUrl: avatar,
            name: name,
            radius: 34,
            showRing: true,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        isBusiness && businessName != null ? businessName! : name,
                        style: AppTextStyles.title.copyWith(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    if (plan == 'enterprise')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('Enterprise',
                            style: AppTextStyles.caption.copyWith(color: Colors.white)),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(email, style: AppTextStyles.small.copyWith(color: Colors.white70)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isBusiness ? AppColors.warning : Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isBusiness ? 'บัญชีธุรกิจ' : 'บัญชีบุคคล',
                    style: AppTextStyles.caption.copyWith(
                      color: isBusiness ? Colors.black87 : Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.user});

  final dynamic user;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          _StatItem(value: '${user.activePins}', label: 'หมุดที่ใช้งาน'),
          _divider(context),
          _StatItem(value: user.rating > 0 ? user.rating.toStringAsFixed(1) : 'ใหม่', label: 'คะแนน'),
          _divider(context),
          _StatItem(value: '${user.reviewCount}', label: 'รีวิว'),
          _divider(context),
          _StatItem(value: '${user.heroCasesCount}', label: 'ฮีโร่'),
        ],
      ),
    );
  }

  Widget _divider(BuildContext context) => Container(
        width: 1,
        height: 30,
        color: Theme.of(context).dividerColor,
      );
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: AppTextStyles.title.copyWith(color: AppColors.primary, fontSize: 18)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge,
    this.isDanger = false,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? badge;
  final bool isDanger;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(icon, color: isDanger ? AppColors.danger : color, size: 22),
        ),
        title: Text(
          title,
          style: AppTextStyles.bodyMedium.copyWith(
            color: isDanger ? AppColors.danger : null,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: subtitle.isEmpty
            ? null
            : Text(subtitle, style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(badge!,
                    style: AppTextStyles.caption.copyWith(color: AppColors.success)),
              ),
            Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}
