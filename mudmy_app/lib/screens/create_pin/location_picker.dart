import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../core/state/location_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/geo.dart';

/// Interactive map to pick a location for a new pin.
/// Tap anywhere to move the marker; reverse-geocodes to district/province.
class LocationPicker extends StatefulWidget {
  const LocationPicker({
    super.key,
    this.initialLat,
    this.initialLng,
    this.onLocationChanged,
  });

  final double? initialLat;
  final double? initialLng;
  final ValueChanged<({double lat, double lng, String district, String province})>? onLocationChanged;

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  late double _lat = widget.initialLat ?? LocationProvider.defaultLat;
  late double _lng = widget.initialLng ?? LocationProvider.defaultLng;
  bool _geocoding = false;
  String? _district;
  String? _province;

  Future<void> _onTap(LatLng point) async {
    setState(() {
      _lat = point.latitude;
      _lng = point.longitude;
      _geocoding = true;
    });
    final result = await GeoUtils.reverseGeocode(point.latitude, point.longitude);
    if (!mounted) return;
    setState(() {
      _geocoding = false;
      _district = result?.district;
      _province = result?.province;
    });
    widget.onLocationChanged?.call((
      lat: _lat,
      lng: _lng,
      district: _district ?? '',
      province: _province ?? '',
    ));
  }

  Future<void> _useCurrent() async {
    final loc = LocationProvider();
    await loc.refresh();
    await _onTap(LatLng(loc.lat, loc.lng));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 320,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(_lat, _lng),
                  initialZoom: 13,
                  onTap: (_, point) => _onTap(point),
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.mudmy.app',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: LatLng(_lat, _lng),
                        width: 44,
                        height: 44,
                        child: _PinMarker(),
                      ),
                    ],
                  ),
                ],
              ),
              // instructions hint
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.touch_app_rounded, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text('แตะแผนที่เพื่อปักหมุด', style: AppTextStyles.label.copyWith(color: AppColors.textPrimary)),
                    ],
                  ),
                ),
              ),
              Positioned(
                right: 12,
                bottom: 12,
                child: FloatingActionButton.small(
                  heroTag: 'current_loc',
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  onPressed: _useCurrent,
                  child: const Icon(Icons.my_location),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: _geocoding
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.location_on_rounded, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _geocoding
                    ? 'กำลังค้นหาที่อยู่...'
                    : (_district != null || _province != null)
                        ? '${_district ?? ''} ${_province ?? ''}'.trim()
                        : 'ยังไม่ได้เลือกตำแหน่งที่ชัดเจน',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: _district != null ? AppColors.textPrimary : AppColors.textMuted,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PinMarker extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: 12),
            ],
          ),
          child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
        ),
        Transform.translate(
          offset: const Offset(0, -1),
          child: CustomPaint(
            size: const Size(18, 10),
            painter: _ArrowPainter(),
          ),
        ),
      ],
    );
  }
}

class _ArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    final path = ui.Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
