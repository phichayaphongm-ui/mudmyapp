import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/message_service.dart';

/// Tracks unread message count for the chat tab badge.
class MessageCountProvider extends ChangeNotifier {
  StreamSubscription<List<dynamic>>? _sub;

  int _unread = 0;
  int get unread => _unread;

  Future<void> start(String userId) async {
    await stop();
    MessageService.instance.getTotalUnread(userId).then((v) {
      _unread = v;
      notifyListeners();
    }).catchError((_) {});
    _sub = MessageService.instance.subscribeToConversations(userId).listen((list) {
      _unread = list.fold(0, (sum, c) => sum + c.unreadFor(userId));
      notifyListeners();
    });
  }

  Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
