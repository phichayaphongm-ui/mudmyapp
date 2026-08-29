import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/models/pin.dart';
import '../../core/models/review.dart';
import '../../core/services/pin_service.dart';
import '../../core/services/review_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/feedback.dart';
import '../messages/chat_screen.dart';
import 'pin_detail_widgets.dart';

class PinDetailScreen extends StatefulWidget {
  const PinDetailScreen({super.key, required this.pinId});

  final String pinId;

  @override
  State<PinDetailScreen> createState() => _PinDetailScreenState();
}

class _PinDetailScreenState extends State<PinDetailScreen> {
  Pin? _pin;
  List<Review> _reviews = [];
  bool _loading = true;
  bool _isFavorite = false;
  int _imageIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final pin = await PinService.instance.getPin(widget.pinId);
      if (!mounted) return;
      setState(() {
        _pin = pin;
        _loading = false;
      });
      if (pin != null) {
        PinService.instance.incrementViews(pin.id);
        final reviews = await ReviewService.instance.getReviews(pin.id);
        final auth = context.read<AuthProvider>();
        final uid = auth.userId;
        if (uid != null) {
          _isFavorite = await FavoriteService.instance.isFavorite(uid, pin.id);
        }
        if (mounted) setState(() => _reviews = reviews);
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleFavorite() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null || _pin == null) return;
    final now = await FavoriteService.instance.toggleFavorite(uid, _pin!.id);
    setState(() => _isFavorite = now);
  }

  Future<void> _call() async {
    final phone = _pin?.contact.phone;
    if (phone == null || phone.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: phone.replaceAll('-', ''));
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _openLine() async {
    final line = _pin?.contact.line;
    if (line == null || line.isEmpty) return;
    final uri = Uri(scheme: 'https', path: 'line.me/ti/p/~$line');
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _openMaps() async {
    final p = _pin;
    if (p == null) return;
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}');
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _share() async {
    final p = _pin;
    if (p == null) return;
    final uri = Uri.parse('https://${AppConfig.domain}/pin/${p.id}');
    showToast(context, 'ลิงก์หมุดหมาย: $uri');
  }

  Future<void> _report() async {
    final reasons = [
      'สแปม / ซ้ำ',
      'หลอกลวง',
      'เนื้อหาไม่เหมาะสม',
      'ตำแหน่งไม่ถูกต้อง',
      'อื่น ๆ',
    ];
    final reason = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('รายงานหมุดหมายนี้', style: AppTextStyles.headline),
            ),
            for (final r in reasons)
              ListTile(
                leading: const Icon(Icons.flag_outlined, color: AppColors.danger),
                title: Text(r, style: AppTextStyles.bodyMedium),
                onTap: () => Navigator.pop(ctx, r),
              ),
          ],
        ),
      ),
    );
    if (reason == null) return;
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    await PinService.instance.reportPin(_pin!.id, uid, reason, '');
    showToast(context, 'ขอบคุณที่ช่วยดูแลชุมชน');
  }

  Future<void> _delete() async {
    final ok = await confirmDialog(
      context,
      title: 'ลบหมุดหมาย?',
      message: 'การลบนี้ไม่สามารถย้อนกลับได้ คุณต้องการดำเนินการต่อหรือไม่?',
      confirmLabel: 'ลบ',
      danger: true,
    );
    if (!ok) return;
    await PinService.instance.deletePin(_pin!.id);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _chat() async {
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    final p = _pin;
    if (me == null || p == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          otherUserId: p.ownerId,
          otherName: p.ownerName,
          otherAvatar: p.ownerAvatar,
          pinId: p.id,
          pinTitle: p.title,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final pin = _pin;
    if (pin == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const EmptyState(
          icon: Icons.link_off,
          title: 'ไม่พบหมุดหมาย',
          subtitle: 'หมุดหมายนี้อาจถูกลบไปแล้ว',
        ),
      );
    }

    final auth = context.watch<AuthProvider>();
    final isOwner = auth.userId == pin.ownerId;
    final imageUrls = pin.images.isEmpty ? [''] : pin.images;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            leading: RoundIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              onTap: () => Navigator.of(context).pop(),
            ),
            actions: [
              RoundIconButton(
                icon: _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                color: _isFavorite ? AppColors.danger : null,
                onTap: _toggleFavorite,
              ),
              RoundIconButton(icon: Icons.share_rounded, onTap: _share),
              const SizedBox(width: 12),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: PinGallery(
                images: imageUrls,
                pin: pin,
                onImageChanged: (i) => setState(() => _imageIndex = i),
                imageIndex: _imageIndex,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InfoHeader(pin: pin),
                  const SizedBox(height: 18),
                  ContactCard(pin: pin, onCall: _call, onLine: _openLine),
                  const SizedBox(height: 14),
                  DescriptionCard(pin: pin),
                  const SizedBox(height: 14),
                  LocationCard(pin: pin, onOpenMaps: _openMaps),
                  const SizedBox(height: 14),
                  OwnerCard(pin: pin),
                  const SizedBox(height: 14),
                  if (pin.isEmergency && !isOwner)
                    HeroResolveCard(pin: pin, onDone: () => setState(() {}))
                  else if (isOwner && !pin.isResolved)
                    OwnerActions(pin: pin, onDelete: _delete, onReport: _report),
                  const SizedBox(height: 14),
                  ReviewSection(
                    pinId: pin.id,
                    reviews: _reviews,
                    onAdded: (r) => setState(() => _reviews = [r, ..._reviews]),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: isOwner
          ? null
          : BottomActionBar(pin: pin, onCall: _call, onChat: _chat),
    );
  }
}
