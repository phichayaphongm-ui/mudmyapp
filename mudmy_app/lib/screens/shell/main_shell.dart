import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/auth_provider.dart';
import '../../core/state/message_count_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../create_pin/create_pin_screen.dart';
import '../explore/explore_screen.dart';
import '../home/home_screen.dart';
import '../messages/conversations_screen.dart';
import '../profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});

  final int initialIndex;

  /// Global tab controller so any screen can switch tabs.
  static final ValueNotifier<int> tabController = ValueNotifier<int>(0);

  static void goToTab(int index) => tabController.value = index.clamp(0, 4);

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late int _index = widget.initialIndex;

  late final List<Widget> _screens = [
    const HomeScreen(),
    const ExploreScreen(),
    const SizedBox.shrink(), // center + button opens create flow
    const ConversationsScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    MainShell.tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      final uid = auth.userId;
      if (uid != null) {
        context.read<MessageCountProvider>().start(uid);
      }
    });
  }

  @override
  void dispose() {
    MainShell.tabController.removeListener(_onTabChanged);
    super.dispose();
  }

  void _onTabChanged() {
    final v = MainShell.tabController.value;
    if (v != 2 && mounted && _index != v) {
      setState(() => _index = v);
    }
  }

  void _openCreate() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CreatePinScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<MessageCountProvider>().unread;

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _index, children: _screens),
      floatingActionButton: _index == 2 ? null : _CreateFab(onTap: _openCreate),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: _MudmyNavBar(
        currentIndex: _index < 2 ? _index : _index - 1,
        unread: unread,
        onSelect: (i) {
          if (i == 2) {
            _openCreate();
            return;
          }
          setState(() => _index = i < 2 ? i : i + 1);
        },
      ),
    );
  }
}

class _CreateFab extends StatelessWidget {
  const _CreateFab({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 62,
        height: 62,
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.5),
              blurRadius: 22,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(Icons.add_rounded, size: 34, color: Colors.white),
      ),
    );
  }
}

class _MudmyNavBar extends StatelessWidget {
  const _MudmyNavBar({
    required this.currentIndex,
    required this.unread,
    required this.onSelect,
  });

  final int currentIndex;
  final int unread;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.home_rounded, 'หน้าแรก'),
      (Icons.explore_rounded, 'สำรวจ'),
      (Icons.chat_bubble_rounded, 'แชท'),
      (Icons.person_rounded, 'ฉัน'),
    ];

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++) ...[
              if (i == 2) const SizedBox(width: 4),
              Expanded(
                child: _NavItem(
                  icon: items[i].$1,
                  label: items[i].$2,
                  selected: currentIndex == i,
                  badge: i == 2 && unread > 0 ? unread : 0,
                  onTap: () => onSelect(i < 2 ? i : i + 1),
                ),
              ),
              if (i == 2) const SizedBox(width: 4),
            ],
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.badge,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.primary : AppColors.textMuted;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary.withValues(alpha: 0.14) : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                if (badge > 0)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Theme.of(context).colorScheme.surface, width: 1.5),
                      ),
                      child: Text(
                        badge > 99 ? '99+' : '$badge',
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTextStyles.caption.copyWith(
                color: color,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
