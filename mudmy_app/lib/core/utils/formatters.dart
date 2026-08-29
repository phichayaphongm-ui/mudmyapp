import 'dart:math' as math;

import 'package:intl/intl.dart';

class Fmt {
  Fmt._();

  static final NumberFormat _currency = NumberFormat.decimalPattern('th');
  static final DateFormat _date = DateFormat('d MMM yyyy', 'th');
  static final DateFormat _time = DateFormat('HH:mm', 'th');
  static final DateFormat _dateTime = DateFormat('d MMM yyyy, HH:mm', 'th');

  /// "฿1,500" or empty string when price is null.
  static String baht(num? price) {
    if (price == null) return '';
    return '฿${_currency.format(price)}';
  }

  static String bahtOrLabel(double? price, String? label) {
    if (price != null && price > 0) return baht(price);
    if (label != null && label.isNotEmpty) return label;
    return '';
  }

  static String number(num v) => _currency.format(v);

  static String date(DateTime d) => _date.format(d);

  static String dateTime(DateTime d) => _dateTime.format(d);

  static String time(DateTime d) => _time.format(d);

  /// Friendly relative time in Thai: "เมื่อ 5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว"...
  static String timeAgo(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inSeconds < 60) return 'เมื่อสักครู่';
    if (diff.inMinutes < 60) return 'เมื่อ ${diff.inMinutes} นาทีที่แล้ว';
    if (diff.inHours < 24) return 'เมื่อ ${diff.inHours} ชั่วโมงที่แล้ว';
    if (diff.inDays < 7) return 'เมื่อ ${diff.inDays} วันที่แล้ว';
    return _date.format(d);
  }

  static String distanceKm(double? meters) {
    if (meters == null) return '';
    if (meters < 1000) return '${meters.round()} ม.';
    return '${(meters / 1000).toStringAsFixed(1)} กม.';
  }

  /// Convert duration to "X วัน" / "X ชม." / "X นาที".
  static String durationThai(Duration d) {
    if (d.inDays > 0) return '${d.inDays} วัน';
    if (d.inHours > 0) return '${d.inHours} ชั่วโมง';
    return '${math.max(1, d.inMinutes)} นาที';
  }

  /// Short random pin number, e.g. "AB12345678".
  static String generatePinNumber() {
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    final rnd = math.Random();
    final l1 = letters[rnd.nextInt(letters.length)];
    final l2 = letters[rnd.nextInt(letters.length)];
    final digits = List.generate(8, (_) => rnd.nextInt(10)).join();
    return '$l1$l2$digits';
  }
}
