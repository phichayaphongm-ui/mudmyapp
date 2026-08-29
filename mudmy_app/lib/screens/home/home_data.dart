import '../../core/models/chat.dart';
import '../../core/models/pin.dart';

/// Aggregated data for the home screen.
class HomeData {
  const HomeData({
    required this.pins,
    required this.recommended,
    required this.nearby,
    required this.events,
  });

  final List<Pin> pins;
  final List<Pin> recommended;
  final List<Pin> nearby;
  final List<ActivityEvent> events;
}
