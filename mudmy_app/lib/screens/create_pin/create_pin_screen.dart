import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/models/category.dart';
import '../../core/models/pin.dart';
import '../../core/services/pin_service.dart';
import '../../core/services/supabase_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/buttons.dart';
import 'location_picker.dart';

class CreatePinScreen extends StatefulWidget {
  const CreatePinScreen({super.key});

  @override
  State<CreatePinScreen> createState() => _CreatePinScreenState();
}

class _CreatePinScreenState extends State<CreatePinScreen> {
  int _step = 0;

  // step 1: category
  PinCategory? _category;

  // step 2: details
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _phone = TextEditingController();
  final _line = TextEditingController();
  final List<XFile> _images = [];
  bool _uploadingImages = false;

  // step 3: location
  double? _lat;
  double? _lng;
  String _district = '';
  String _province = '';

  // step 4: publish
  bool _publishing = false;
  String? _publishedId;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    _phone.dispose();
    _line.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final count = _images.length;
    if (count >= 3) {
      showToast(context, 'ทั่วไปสามารถอัปโหลดได้สูงสุด 3 รูป', error: true);
      return;
    }
    setState(() => _uploadingImages = true);
    try {
      final picked = await ImagePicker().pickMultiImage(maxWidth: 1200, imageQuality: 80);
      final remaining = 3 - count;
      setState(() => _images.addAll(picked.take(remaining)));
    } catch (e) {
      showToast(context, 'เลือกรูปไม่สำเร็จ', error: true);
    } finally {
      if (mounted) setState(() => _uploadingImages = false);
    }
  }

  Future<List<String>> _uploadImages(String ownerId, String pinId) async {
    final urls = <String>[];
    for (var i = 0; i < _images.length; i++) {
      final bytes = await _images[i].readAsBytes();
      final path = await SupabaseService.instance.uploadBytes(
        folder: 'pins',
        path: '$ownerId/$pinId/${i}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        bytes: bytes,
        contentType: 'image/jpeg',
      );
      urls.add(SupabaseService.instance.storageUrl(path));
    }
    return urls;
  }

  Future<void> _publish() async {
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    if (me == null || _category == null) return;
    setState(() => _publishing = true);
    try {
      final tempId = 'pin_${DateTime.now().microsecondsSinceEpoch}';
      final imageUrls = await _uploadImages(me.id, tempId);

      final pin = Pin(
        id: tempId,
        title: _title.text.trim(),
        category: _category!,
        description: _description.text.trim(),
        images: imageUrls,
        contact: PinContact(
          phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          line: _line.text.trim().isEmpty ? null : _line.text.trim(),
        ),
        price: _price.text.trim().isEmpty ? null : double.tryParse(_price.text.trim()),
        lat: _lat ?? LocationPicker0.defaultLat,
        lng: _lng ?? LocationPicker0.defaultLng,
        address: '',
        district: _district,
        province: _province,
        ownerId: me.id,
        ownerName: me.displayName,
        ownerAvatar: me.avatar,
        status: PinStatus.active,
        plan: UserPlan.general,
        featured: _category == PinCategory.emergency,
        views: 0,
        clicks: 0,
        createdAt: DateTime.now(),
        expiresAt: _category == PinCategory.emergency
            ? DateTime.now().add(const Duration(minutes: 30))
            : DateTime.now().add(const Duration(days: 30)),
        rating: 0,
        reviewCount: 0,
        favoriteCount: 0,
        reports: const [],
        pinNumber: Fmt.generatePinNumber(),
        radius: 5,
        isFreePin: true,
      );

      final created = await PinService.instance.createPin(pin);
      if (!mounted) return;
      setState(() {
        _publishedId = created.id;
        _publishing = false;
        _step = 4;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _publishing = false);
        showToast(context, 'โพสต์ไม่สำเร็จ: ${e.toString().replaceFirst('Exception: ', '')}', error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_publishedId != null ? 'สำเร็จ!' : 'ปักหมุดใหม่'),
        actions: [
          if (_step < 4)
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('ปิด'),
            ),
        ],
      ),
      body: _publishedId != null
          ? _SuccessView(pinId: _publishedId!)
          : Column(
              children: [
                _StepIndicator(current: _step),
                const SizedBox(height: 8),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: switch (_step) {
                      0 => _StepCategory(
                          key: const ValueKey('cat'),
                          selected: _category,
                          onSelect: (c) => setState(() => _category = c),
                        ),
                      1 => _StepDetails(
                          key: const ValueKey('det'),
                          title: _title,
                          description: _description,
                          price: _price,
                          phone: _phone,
                          line: _line,
                          images: _images,
                          uploading: _uploadingImages,
                          onPickImages: _pickImages,
                          onRemoveImage: (i) => setState(() => _images.removeAt(i)),
                        ),
                      2 => _StepLocation(
                          key: const ValueKey('loc'),
                          onChanged: (p) => setState(() {
                            _lat = p.lat;
                            _lng = p.lng;
                            _district = p.district;
                            _province = p.province;
                          }),
                        ),
                      3 => _StepReview(
                          key: const ValueKey('rev'),
                          category: _category!,
                          title: _title.text,
                          description: _description.text,
                          price: _price.text,
                          phone: _phone.text,
                          line: _line.text,
                          imageCount: _images.length,
                          district: _district,
                          province: _province,
                          publishing: _publishing,
                          onPublish: _publish,
                        ),
                      _ => const SizedBox.shrink(),
                    },
                  ),
                ),
                if (_step < 4)
                  _NavBar(
                    step: _step,
                    canNext: _canNext(),
                    onNext: () => setState(() => _step = _step + 1),
                    onBack: _step > 0 ? () => setState(() => _step = _step - 1) : null,
                  ),
              ],
            ),
    );
  }

  bool _canNext() {
    return switch (_step) {
      0 => _category != null,
      1 => _title.text.trim().isNotEmpty && _description.text.trim().isNotEmpty,
      2 => _lat != null,
      _ => true,
    };
  }
}

/// Minimal default constants mirroring LocationProvider defaults.
class LocationPicker0 {
  static const double defaultLat = 13.7563;
  static const double defaultLng = 100.5018;
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current});

  final int current;

  static const _labels = ['หมวดหมู่', 'รายละเอียด', 'ที่ตั้ง', 'ยืนยัน'];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Row(
        children: [
          for (var i = 0; i < _labels.length; i++) ...[
            if (i > 0) ...[
              Expanded(
                child: Container(
                  height: 3,
                  color: i <= current ? AppColors.primary : Theme.of(context).dividerColor,
                ),
              ),
              const SizedBox(width: 6),
            ],
            _StepDot(index: i, current: current, label: _labels[i]),
            const SizedBox(width: 6),
          ],
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({required this.index, required this.current, required this.label});

  final int index;
  final int current;
  final String label;

  @override
  Widget build(BuildContext context) {
    final done = index < current;
    final active = index == current;
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: active ? AppColors.primary : (done ? AppColors.success : Theme.of(context).colorScheme.surface),
            shape: BoxShape.circle,
            border: Border.all(color: active || done ? AppColors.primary : Theme.of(context).dividerColor, width: 2),
          ),
          child: Icon(
            done ? Icons.check_rounded : Icons.circle_outlined,
            size: 16,
            color: active || done ? Colors.white : AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: AppTextStyles.caption.copyWith(
            color: active ? AppColors.primary : AppColors.textMuted,
            fontWeight: active ? FontWeight.w700 : FontWeight.w400,
            fontSize: 9.5,
          ),
        ),
      ],
    );
  }
}

class _NavBar extends StatelessWidget {
  const _NavBar({required this.step, required this.canNext, required this.onNext, required this.onBack});

  final int step;
  final bool canNext;
  final VoidCallback onNext;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
        child: Row(
          children: [
            if (onBack != null)
              SoftButton(label: 'ย้อนกลับ', icon: Icons.arrow_back_rounded, onPressed: onBack),
            const SizedBox(width: 12),
            Expanded(
              child: FancyButton(
                label: step == 3 ? 'โพสต์หมุดหมาย' : 'ต่อไป',
                icon: step == 3 ? Icons.check_circle_outline_rounded : Icons.arrow_forward_rounded,
                onPressed: canNext ? onNext : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepCategory extends StatelessWidget {
  const _StepCategory({super.key, required this.selected, required this.onSelect});

  final PinCategory? selected;
  final ValueChanged<PinCategory> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('เลือกหมวดหมู่', style: AppTextStyles.headline),
        const SizedBox(height: 4),
        Text('หมุดหมายนี้เกี่ยวกับอะไร?', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
          ),
          itemCount: PinCategory.values.length,
          itemBuilder: (_, i) {
            final c = PinCategory.values[i];
            final isSelected = selected == c;
            return GestureDetector(
              onTap: () => onSelect(c),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSelected ? c.color : Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isSelected ? c.color : Theme.of(context).dividerColor,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(c.icon, color: isSelected ? Colors.white : c.color, size: 26),
                    const Spacer(),
                    Text(
                      c.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: isSelected ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (c == PinCategory.emergency)
                      Text('ฟรี 30 นาที', style: AppTextStyles.caption.copyWith(color: isSelected ? Colors.white70 : AppColors.danger)),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _StepDetails extends StatelessWidget {
  const _StepDetails({
    super.key,
    required this.title,
    required this.description,
    required this.price,
    required this.phone,
    required this.line,
    required this.images,
    required this.uploading,
    required this.onPickImages,
    required this.onRemoveImage,
  });

  final TextEditingController title;
  final TextEditingController description;
  final TextEditingController price;
  final TextEditingController phone;
  final TextEditingController line;
  final List<XFile> images;
  final bool uploading;
  final VoidCallback onPickImages;
  final ValueChanged<int> onRemoveImage;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('รายละเอียดหมุดหมาย', style: AppTextStyles.headline),
        const SizedBox(height: 16),
        TextFormField(
          controller: title,
          decoration: const InputDecoration(labelText: 'หัวข้อ *', prefixIcon: Icon(Icons.title_rounded)),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: description,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'รายละเอียด *',
            alignLabelWithHint: true,
            prefixIcon: Icon(Icons.notes_rounded),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: price,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'ราคา (บาท)',
                  prefixIcon: Icon(Icons.attach_money_rounded),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'เบอร์โทร',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: line,
          decoration: const InputDecoration(labelText: 'LINE ID', prefixIcon: Icon(Icons.chat_outlined)),
        ),
        const SizedBox(height: 20),
        Text('รูปภาพ (สูงสุด 3 รูป)', style: AppTextStyles.title),
        const SizedBox(height: 10),
        SizedBox(
          height: 92,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (var i = 0; i < images.length; i++)
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: Stack(
                    children: [
                      _PickedImage(file: images[i]),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => onRemoveImage(i),
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (images.length < 3)
                GestureDetector(
                  onTap: uploading ? null : onPickImages,
                  child: Container(
                    width: 92,
                    height: 92,
                    decoration: BoxDecoration(
                      color: Theme.of(context).inputDecorationTheme.fillColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Theme.of(context).dividerColor, style: BorderStyle.solid),
                    ),
                    child: uploading
                        ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.add_a_photo_outlined, color: AppColors.textMuted),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.info.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Row(
            children: [
              Icon(Icons.health_and_safety_outlined, color: AppColors.info, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'เคล็ดลับ: นัดเจอในที่สาธารณะ และอย่าโอนเงินล่วงหน้าให้คนแปลกหน้า',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StepLocation extends StatelessWidget {
  const _StepLocation({super.key, required this.onChanged});

  final ValueChanged<({double lat, double lng, String district, String province})> onChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('เลือกตำแหน่ง', style: AppTextStyles.headline),
        const SizedBox(height: 4),
        Text('แตะแผนที่เพื่อระบุตำแหน่งของหมุดหมาย', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        LocationPicker(onLocationChanged: onChanged),
      ],
    );
  }
}

class _StepReview extends StatelessWidget {
  const _StepReview({
    super.key,
    required this.category,
    required this.title,
    required this.description,
    required this.price,
    required this.phone,
    required this.line,
    required this.imageCount,
    required this.district,
    required this.province,
    required this.publishing,
    required this.onPublish,
  });

  final PinCategory category;
  final String title;
  final String description;
  final String price;
  final String phone;
  final String line;
  final int imageCount;
  final String district;
  final String province;
  final bool publishing;
  final VoidCallback onPublish;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('ตรวจสอบข้อมูล', style: AppTextStyles.headline),
        const SizedBox(height: 4),
        Text('ตรวจสอบความถูกต้องก่อนโพสต์', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ReviewRow(icon: category.icon, label: 'หมวดหมู่', value: category.label, color: category.color),
              _ReviewRow(icon: Icons.title_rounded, label: 'หัวข้อ', value: title),
              _ReviewRow(icon: Icons.notes_rounded, label: 'รายละเอียด', value: description, multiLine: true),
              if (price.isNotEmpty) _ReviewRow(icon: Icons.attach_money_rounded, label: 'ราคา', value: Fmt.baht(double.tryParse(price))),
              if (phone.isNotEmpty) _ReviewRow(icon: Icons.phone_outlined, label: 'โทร', value: phone),
              if (line.isNotEmpty) _ReviewRow(icon: Icons.chat_outlined, label: 'LINE', value: line),
              _ReviewRow(icon: Icons.photo_library_outlined, label: 'รูปภาพ', value: '$imageCount รูป'),
              _ReviewRow(icon: Icons.location_on_outlined, label: 'ที่ตั้ง', value: '$district $province'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: AppColors.success),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  category == PinCategory.emergency
                      ? 'หมุดหมายฉุกเฉินฟรี และมีอายุ 30 นาที'
                      : 'หมุดหมายแรกฟรี 30 วัน (กดเช็คอินเพื่อต่ออายุได้)',
                  style: AppTextStyles.small.copyWith(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({
    required this.icon,
    required this.label,
    required this.value,
    this.color,
    this.multiLine = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? color;
  final bool multiLine;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color ?? AppColors.primary),
          const SizedBox(width: 10),
          SizedBox(width: 70, child: Text(label, style: AppTextStyles.small.copyWith(color: AppColors.textMuted))),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
              maxLines: multiLine ? 4 : 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.pinId});

  final String pinId;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, size: 62, color: AppColors.success),
            ),
            const SizedBox(height: 24),
            Text('ปักหมุดสำเร็จ! 🎉', style: AppTextStyles.headline),
            const SizedBox(height: 8),
            Text(
              'หมุดหมายของคุณถูกปักลงแผนที่แล้ว\nผู้ใช้งานในพื้นที่สามารถค้นหาเจอได้ทันที',
              textAlign: TextAlign.center,
              style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 28),
            FancyButton(
              label: 'ดูหมุดหมายของฉัน',
              icon: Icons.visibility_rounded,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Cross-platform preview of a picked image (uses bytes so it works on web).
class _PickedImage extends StatelessWidget {
  const _PickedImage({required this.file});

  final XFile file;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List>(
      future: file.readAsBytes(),
      builder: (context, snap) {
        final bytes = snap.data;
        if (bytes == null) {
          return Container(
            width: 92,
            height: 92,
            color: Theme.of(context).dividerColor,
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }
        return ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.memory(bytes, width: 92, height: 92, fit: BoxFit.cover),
        );
      },
    );
  }
}
