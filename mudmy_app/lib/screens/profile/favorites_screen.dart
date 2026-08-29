import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/pin.dart';
import '../../core/services/review_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/pin_card.dart';
import '../pin_detail/pin_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Pin> _pins = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    final pins = await FavoriteService.instance.getFavorites(uid);
    if (!mounted) return;
    setState(() {
      _pins = pins;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('รายการโปรด')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _pins.isEmpty
                ? const EmptyState(
                    icon: Icons.favorite_border_rounded,
                    title: 'ยังไม่มีรายการโปรด',
                    subtitle: 'กดหัวใจบนหมุดหมายที่คุณชอบ',
                  )
                : GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.66,
                    ),
                    itemCount: _pins.length,
                    itemBuilder: (_, i) => PinCard(
                      pin: _pins[i],
                      compact: true,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => PinDetailScreen(pinId: _pins[i].id)),
                      ).then((_) => _load()),
                    ),
                  ),
      ),
    );
  }
}
