import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Simple device location provider with cached fallback (Bangkok default).
class LocationProvider extends ChangeNotifier {
  static const _prefsKey = 'mudmy_location';
  static const defaultLat = 13.7563;
  static const defaultLng = 100.5018;

  // Thailand bounding box. Rejects bogus GPS fixes, e.g. the Android
  // emulator default (Mountain View, CA) that would show the wrong
  // current location instead of the Bangkok fallback.
  static const _minLat = 5.6;
  static const _maxLat = 20.5;
  static const _minLng = 97.3;
  static const _maxLng = 105.7;

  Position? _position;
  bool _loading = false;

  Position? get position => _position;
  bool get hasLocation => _position != null;
  double get lat => _position?.latitude ?? defaultLat;
  double get lng => _position?.longitude ?? defaultLng;

  Future<void> load() async {
    if (_loading) return;
    _loading = true;

    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefsKey);
    if (saved != null) {
      try {
        final parts = saved.split(',');
        if (parts.length == 2) {
          final lat = double.parse(parts[0]);
          final lng = double.parse(parts[1]);
          if (_isInThailand(lat, lng)) {
            _position = _buildPosition(lat, lng);
          } else {
            await prefs.remove(_prefsKey);
          }
        }
      } catch (_) {
        await prefs.remove(_prefsKey);
      }
    }

    await _tryRefresh();
    _loading = false;
    notifyListeners();
  }

  Future<void> _tryRefresh() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final requested = await Geolocator.requestPermission();
        if (requested == LocationPermission.denied ||
            requested == LocationPermission.deniedForever) {
          return;
        }
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
      );
      // Ignore invalid fixes (offline mock, emulator default, etc.).
      if (!_isInThailand(pos.latitude, pos.longitude)) return;
      _position = pos;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, '${pos.latitude},${pos.longitude}');
    } catch (_) {
      // offline / denied: fall back to cached or default
    }
  }

  Future<void> refresh() async {
    await _tryRefresh();
    notifyListeners();
  }

  static bool _isInThailand(double lat, double lng) =>
      lat >= _minLat && lat <= _maxLat && lng >= _minLng && lng <= _maxLng;

  static Position _buildPosition(double lat, double lng) => Position(
        latitude: lat,
        longitude: lng,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      );
}
