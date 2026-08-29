import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../core/models/category.dart';
import '../../core/models/pin.dart';
import '../../core/services/pin_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/state/location_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/geo.dart';
import '../../core/widgets/buttons.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/pin_card.dart';
import '../pin_detail/pin_detail_screen.dart';
import '../shell/main_shell.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key, this.initialQuery, this.initialCategory});

  final String? initialQuery;
  final String? initialCategory;

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  late final TextEditingController _search = TextEditingController(text: widget.initialQuery);
  String? _category;
  String _radius = 'all';
  String _sort = 'near';
  bool _showMap = true;
  bool _loading = true;
  String? _error;
  List<Pin> _allPins = [];
  List<Pin> _filtered = [];

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategory;
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthProvider>();
      final exclude = auth.user?.blockedUsers ?? const <String>[];
      final pins = await PinService.instance.getActivePins(excludeOwnerIds: exclude);
      if (!mounted) return;
      setState(() {
        _allPins = pins;
        _loading = false;
      });
      _applyFilters();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _applyFilters() {
    final q = _search.text.trim().toLowerCase();
    final loc = context.read<LocationProvider>();
    final radiusMeters = switch (_radius) {
      '5' => 5000.0,
      '10' => 10000.0,
      '50' => 50000.0,
      _ => null,
    };

    final result = _allPins.where((p) {
      if (_category != null && p.category.id != _category) return false;
      if (q.isNotEmpty) {
        final haystack =
            '${p.title} ${p.description} ${p.district} ${p.province} ${p.pinNumber ?? ''}'.toLowerCase();
        if (!haystack.contains(q)) return false;
      }
      if (radiusMeters != null) {
        final d = GeoUtils.distanceMeters(loc.lat, loc.lng, p.lat, p.lng);
        if (d > radiusMeters) return false;
      }
      return true;
    }).toList();

    result.sort((a, b) {
      if (_sort == 'new') {
        return b.createdAt.compareTo(a.createdAt);
      }
      return GeoUtils.distanceMeters(loc.lat, loc.lng, a.lat, a.lng)
          .compareTo(GeoUtils.distanceMeters(loc.lat, loc.lng, b.lat, b.lng));
    });

    if (mounted) setState(() => _filtered = result);
  }

  void _openPin(Pin pin) {
    PinService.instance.incrementViews(pin.id);
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => PinDetailScreen(pinId: pin.id)));
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.watch<LocationProvider>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              searchController: _search,
              onSearch: _applyFilters,
              onClear: () {
                _search.clear();
                _applyFilters();
              },
              showMap: _showMap,
              onToggle: () => setState(() => _showMap = !_showMap),
              onOpenCreate: () => MainShell.goToTab(2),
            ),
            _CategoryChips(
              selected: _category,
              onSelect: (c) {
                setState(() => _category = c);
                _applyFilters();
              },
            ),
            _FilterBar(
              radius: _radius,
              sort: _sort,
              count: _filtered.length,
              onRadius: (v) {
                setState(() => _radius = v);
                _applyFilters();
              },
              onSort: (v) {
                setState(() => _sort = v);
                _applyFilters();
              },
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? EmptyState(
                          icon: Icons.cloud_off_outlined,
                          title: 'โหลดข้อมูลไม่สำเร็จ',
                          subtitle: 'กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่',
                          action: _load,
                          actionLabel: 'ลองใหม่',
                        )
                      : _showMap
                          ? _MapView(
                              pins: _filtered,
                              center: LatLng(loc.lat, loc.lng),
                              onPinTap: _openPin,
                              onCreateHere: () => MainShell.goToTab(2),
                            )
                          : _ListView(pins: _filtered, onTap: _openPin),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.searchController,
    required this.onSearch,
    required this.onClear,
    required this.showMap,
    required this.onToggle,
    required this.onOpenCreate,
  });

  final TextEditingController searchController;
  final VoidCallback onSearch;
  final VoidCallback onClear;
  final bool showMap;
  final VoidCallback onToggle;
  final VoidCallback onOpenCreate;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).inputDecorationTheme.fillColor,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search_rounded, color: AppColors.textMuted),
                  Expanded(
                    child: TextField(
                      controller: searchController,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => onSearch(),
                      decoration: const InputDecoration(
                        hintText: 'ค้นหาในพื้นที่...',
                        border: InputBorder.none,
                        filled: false,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      ),
                      style: AppTextStyles.body,
                    ),
                  ),
                  if (searchController.text.isNotEmpty)
                    IconButton(icon: const Icon(Icons.close), onPressed: onClear, iconSize: 18),
                  GestureDetector(
                    onTap: onSearch,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('ค้นหา',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          _ToggleButton(showMap: showMap, onToggle: onToggle),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({required this.showMap, required this.onToggle});

  final bool showMap;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(showMap ? Icons.view_list_rounded : Icons.map_rounded, color: Colors.white),
      ),
    );
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({required this.selected, required this.onSelect});

  final String? selected;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        children: [
          FilterChipPill(
            label: 'ทั้งหมด',
            selected: selected == null,
            onTap: () => onSelect(null),
          ),
          const SizedBox(width: 8),
          for (final c in PinCategory.values) ...[
            FilterChipPill(
              label: c.label,
              icon: c.icon,
              color: c.color,
              selected: selected == c.id,
              onTap: () => onSelect(c.id),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.radius,
    required this.sort,
    required this.count,
    required this.onRadius,
    required this.onSort,
  });

  final String radius;
  final String sort;
  final int count;
  final ValueChanged<String> onRadius;
  final ValueChanged<String> onSort;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Row(
        children: [
          _Dropdown(
            value: radius,
            icon: Icons.radar_outlined,
            label: switch (radius) {
              'all' => 'ทุกพื้นที่',
              '5' => 'ภายใน 5 กม.',
              '10' => 'ภายใน 10 กม.',
              '50' => 'ภายใน 50 กม.',
              _ => 'ทุกพื้นที่',
            },
            items: {
              'all': 'ทุกพื้นที่',
              '5': 'ภายใน 5 กม.',
              '10': 'ภายใน 10 กม.',
              '50': 'ภายใน 50 กม.',
            },
            onChanged: onRadius,
          ),
          const SizedBox(width: 8),
          _Dropdown(
            value: sort,
            icon: Icons.swap_vert_rounded,
            label: sort == 'new' ? 'ใหม่สุด' : 'ใกล้สุด',
            items: {'near': 'ใกล้สุด', 'new': 'ใหม่สุด'},
            onChanged: onSort,
          ),
          const Spacer(),
          Text('$count หมุด', style: AppTextStyles.caption.copyWith(color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class _Dropdown extends StatelessWidget {
  const _Dropdown({
    required this.value,
    required this.icon,
    required this.label,
    required this.items,
    required this.onChanged,
  });

  final String value;
  final IconData icon;
  final String label;
  final Map<String, String> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final selected = await showModalBottomSheet<String>(
          context: context,
          builder: (ctx) => SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final entry in items.entries)
                    ListTile(
                      leading: Icon(icon),
                      title: Text(entry.value,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: entry.key == value ? AppColors.primary : null,
                            fontWeight: entry.key == value ? FontWeight.w700 : FontWeight.w400,
                          )),
                      trailing: entry.key == value ? const Icon(Icons.check, color: AppColors.primary) : null,
                      onTap: () => Navigator.pop(ctx, entry.key),
                    ),
                ],
              ),
            ),
          ),
        );
        if (selected != null && selected != value) onChanged(selected);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).inputDecorationTheme.fillColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(label, style: AppTextStyles.label.copyWith(fontWeight: FontWeight.w600)),
            const Icon(Icons.arrow_drop_down, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _MapView extends StatelessWidget {
  const _MapView({
    required this.pins,
    required this.center,
    required this.onPinTap,
    required this.onCreateHere,
  });

  final List<Pin> pins;
  final LatLng center;
  final ValueChanged<Pin> onPinTap;
  final VoidCallback onCreateHere;

  @override
  Widget build(BuildContext context) {
    final current = pins.isEmpty ? center : null;
    return Stack(
      children: [
        FlutterMap(
          options: MapOptions(
            initialCenter: current ?? LatLng(pins.first.lat, pins.first.lng),
            initialZoom: 12,
            minZoom: 4,
            maxZoom: 18,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.mudmy.app',
            ),
            MarkerLayer(
              markers: pins.map((p) {
                return Marker(
                  point: LatLng(p.lat, p.lng),
                  width: 42,
                  height: 48,
                  alignment: Alignment.topCenter,
                  child: _MapPin(pin: p, onTap: () => onPinTap(p)),
                );
              }).toList(),
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: center,
                  width: 26,
                  height: 26,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.info,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(color: AppColors.info.withValues(alpha: 0.5), blurRadius: 10),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        if (pins.isEmpty)
          Positioned.fill(
            child: Container(
              color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.7),
              alignment: Alignment.center,
              child: Text('ไม่พบหมุดหมายในพื้นที่นี้',
                  style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
            ),
          ),
        Positioned(
          right: 14,
          bottom: 18,
          child: FloatingActionButton.small(
            heroTag: 'create_here',
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            tooltip: 'ปักหมุดที่นี่',
            onPressed: onCreateHere,
            child: const Icon(Icons.add_location_alt_outlined),
          ),
        ),
      ],
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({required this.pin, required this.onTap});

  final Pin pin;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: pin.category.color,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(color: pin.category.color.withValues(alpha: 0.5), blurRadius: 8),
              ],
            ),
            child: Icon(pin.category.icon, size: 16, color: Colors.white),
          ),
          Transform.translate(
            offset: const Offset(0, -2),
            child: Container(
              width: 0,
              height: 0,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.transparent, width: 6),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ListView extends StatelessWidget {
  const _ListView({required this.pins, required this.onTap});

  final List<Pin> pins;
  final ValueChanged<Pin> onTap;

  @override
  Widget build(BuildContext context) {
    if (pins.isEmpty) {
      return const EmptyState(
        icon: Icons.location_searching,
        title: 'ไม่พบหมุดหมาย',
        subtitle: 'ลองเปลี่ยนหมวดหมู่หรือระยะการค้นหา',
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.66,
      ),
      itemCount: pins.length,
      itemBuilder: (_, i) => PinCard(pin: pins[i], compact: true, onTap: () => onTap(pins[i])),
    );
  }
}
