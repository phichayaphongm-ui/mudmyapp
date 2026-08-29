import 'package:flutter/material.dart';

/// Canonical pin categories (matches the Supabase/web app).
enum PinCategory {
  sell('sell', 'ขายสินค้า', 'Sell', Icons.shopping_bag_outlined, Color(0xFF3B82F6)),
  service('service', 'รับจ้าง', 'Services', Icons.build_outlined, Color(0xFF10B981)),
  marketplace('marketplace', 'ร้านค้า/ร้านอาหาร', 'Marketplace', Icons.storefront_outlined, Color(0xFF0EA5E9)),
  jobs('jobs', 'หาคน/หางาน', 'Jobs', Icons.business_center_outlined, Color(0xFFF59E0B)),
  taxi('taxi', 'วินและแท็กซี่', 'Taxi/Win', Icons.local_taxi_outlined, Color(0xFFEAB308)),
  property('property', 'บ้านและที่ดิน', 'Property', Icons.home_outlined, Color(0xFF4F46E5)),
  fuelEv('fuel_ev', 'ปั๊มน้ำมันและEV', 'Fuel/EV', Icons.local_gas_station_outlined, Color(0xFF0891B2)),
  events('events', 'Event/กิจกรรม', 'Events', Icons.event_outlined, Color(0xFF9333EA)),
  news('news', 'ข่าวสารในชุมชน', 'Community News', Icons.newspaper_outlined, Color(0xFF475569)),
  emergency('emergency', 'เหตุฉุกเฉิน', 'Emergency', Icons.warning_amber_outlined, Color(0xFFDC2626));

  const PinCategory(this.id, this.label, this.labelEn, this.icon, this.color);

  final String id;
  final String label;
  final String labelEn;
  final IconData icon;
  final Color color;

  /// Simple id -> category lookup; falls back to [sell].
  static PinCategory fromId(String? id) {
    for (final c in PinCategory.values) {
      if (c.id == id) return c;
    }
    return PinCategory.sell;
  }

  /// Optional gradient background tint derived from color.
  Color get softColor => Color.alphaBlend(color.withValues(alpha: 0.12), Colors.transparent);
}
