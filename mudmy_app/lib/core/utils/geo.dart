import 'dart:math' as math;
import 'dart:convert';

import 'package:http/http.dart' as http;

class GeoPoint {
  const GeoPoint(this.lat, this.lng);

  final double lat;
  final double lng;
}

class GeoUtils {
  GeoUtils._();

  static const double earthRadiusMeters = 6371000;

  /// Haversine distance between two points in meters.
  static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
    final dLat = _toRad(lat2 - lat1);
    final dLng = _toRad(lng2 - lng1);
    final a = math.pow(math.sin(dLat / 2), 2) +
        math.cos(_toRad(lat1)) * math.cos(_toRad(lat2)) * math.pow(math.sin(dLng / 2), 2);
    return earthRadiusMeters * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  static double _toRad(double deg) => deg * math.pi / 180;

  /// Reverse geocode using OpenStreetMap Nominatim.
  /// Returns (displayName, district, province) or null on failure.
  static Future<({String displayName, String district, String province})?>
      reverseGeocode(double lat, double lng) async {
    try {
      final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=$lat&lon=$lng&accept-language=th');
      final res = await http.get(uri, headers: {'User-Agent': 'MudmyApp/1.0'});
      if (res.statusCode != 200) return null;
      final json = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;

      final address = (json['address'] as Map<String, dynamic>?) ?? const {};
      String pick(List<String> keys) {
        for (final k in keys) {
          final v = address[k];
          if (v != null && v.toString().isNotEmpty) return v.toString();
        }
        return '';
      }

      final district = pick(['city_district', 'suburb', 'town', 'city_district', 'county']);
      final province = pick(['state', 'province']);
      return (
        displayName: json['display_name']?.toString() ?? '',
        district: district,
        province: province,
      );
    } catch (_) {
      return null;
    }
  }
}
