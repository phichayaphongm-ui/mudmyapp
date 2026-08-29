import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/chat.dart';
import '../../core/models/pin.dart';
import '../../core/services/pin_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/state/location_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/geo.dart';
import '../../core/widgets/feedback.dart';
import '../explore/explore_screen.dart';
import '../pin_detail/pin_detail_screen.dart';
import '../shell/main_shell.dart';
import 'home_data.dart';
import 'home_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final PageController _bannerController;
  int _bannerIndex = 0;

  late Future<HomeData> _future;

  static const _bannerTitles = [
    'ทุกคนเป็นฮีโร่\nและผู้ประกอบการได้',
    'ปักหมุดโอกาส\nของคุณวันนี้',
    'ค้นหาเพื่อนบ้าน\nและธุรกิจใกล้ตัว',
    'ชุมชนเข้มแข็ง\nร่วมมือกันเติบโต',
  ];

  @override
  void initState() {
    super.initState();
    _bannerController = PageController(viewportFraction: 0.92);
    _future = _load();
    _bannerController.addListener(() {
      final page = _bannerController.page?.round() ?? 0;
      if (page != _bannerIndex) setState(() => _bannerIndex = page);
    });
  }

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  Future<HomeData> _load() async {
    final auth = context.read<AuthProvider>();
    final exclude = auth.user?.blockedUsers ?? const <String>[];
    final pins = await PinService.instance.getActivePins(excludeOwnerIds: exclude);
    final feed = await PinService.instance.getActivityFeed();

    final events = <ActivityEvent>[];
    for (final row in feed) {
      if (row.containsKey('category')) {
        events.add(ActivityEvent.fromPin(row));
      } else {
        events.add(ActivityEvent.fromReview(row));
      }
    }

    final loc = context.read<LocationProvider>();
    pins.sort((a, b) => GeoUtils.distanceMeters(loc.lat, loc.lng, a.lat, a.lng)
        .compareTo(GeoUtils.distanceMeters(loc.lat, loc.lng, b.lat, b.lng)));
    final nearby = pins.take(8).toList();

    final topRated = [...pins]..sort((a, b) => b.rating.compareTo(a.rating));
    final recommended = topRated.take(8).toList();

    return HomeData(pins: pins, recommended: recommended, nearby: nearby, events: events);
  }

  Future<void> _reload() {
    final future = _load();
    setState(() => _future = future);
    return future;
  }

  void _openExplore({String? query, String? category}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ExploreScreen(initialQuery: query, initialCategory: category),
      ),
    );
  }

  void _openPin(Pin pin) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PinDetailScreen(pinId: pin.id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final loc = context.watch<LocationProvider>();
    final me = auth.user;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: HomeHeader(name: me?.displayName ?? 'สวัสดี', onAvatar: () => MainShell.goToTab(4)),
            ),
            SliverToBoxAdapter(child: HomeSearchBar(onTap: () => _openExplore())),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 168,
                child: PageView.builder(
                  controller: _bannerController,
                  itemCount: _bannerTitles.length,
                  itemBuilder: (_, i) => HeroBanner(title: _bannerTitles[i], index: i),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Row(
                  children: [
                    BannerDots(count: _bannerTitles.length, index: _bannerIndex),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => loc.refresh(),
                      child: Row(
                        children: [
                          const Icon(Icons.my_location, size: 16, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${loc.lat.toStringAsFixed(2)}, ${loc.lng.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: SectionHeader(
                  title: 'หมวดหมู่',
                  subtitle: 'ค้นหาตามความสนใจของคุณ',
                  onSeeAll: () => _openExplore(),
                ),
              ),
            ),
            SliverToBoxAdapter(child: CategoryGrid(onTap: (c) => _openExplore(category: c.id))),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: SectionHeader(title: 'ชีพจรชุมชน', subtitle: 'กิจกรรมล่าสุดในพื้นที่ของคุณ'),
              ),
            ),
            SliverToBoxAdapter(child: CommunityTicker(future: _future)),
            SliverToBoxAdapter(child: AiPromoCard(onTap: () => MainShell.goToTab(4))),
            PinsSection(
              title: 'แนะนำสำหรับคุณ',
              subtitle: 'หมุดหมายยอดนิยมจากชุมชน',
              future: _future,
              selector: (d) => d.recommended,
              onTap: _openPin,
            ),
            PinsSection(
              title: 'ใกล้คุณ',
              subtitle: 'หมุดหมายรอบตัวคุณ',
              future: _future,
              selector: (d) => d.nearby,
              onTap: _openPin,
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 110)),
          ],
        ),
      ),
    );
  }
}
