import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/services/supabase_service.dart';
import '../../core/services/user_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/state/theme_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/buttons.dart';
import '../../core/widgets/image_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _line = TextEditingController();
  final _facebook = TextEditingController();
  final _province = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final me = context.read<AuthProvider>().user;
    if (me != null) {
      _name.text = me.name;
      _phone.text = me.phone ?? '';
      _line.text = me.line ?? '';
      _facebook.text = me.facebook ?? '';
      _province.text = me.province ?? '';
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _line.dispose();
    _facebook.dispose();
    _province.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    try {
      final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 800, maxHeight: 800);
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      final path = await SupabaseService.instance.uploadBytes(
        folder: 'profiles',
        path: '$uid/avatar_${DateTime.now().millisecondsSinceEpoch}.jpg',
        bytes: bytes,
        contentType: 'image/jpeg',
      );
      final url = SupabaseService.instance.storageUrl(path);
      await UserService.instance.updateProfile(uid, {'avatar': url});
      await auth.refreshProfile();
      if (mounted) showToast(context, 'อัปเดตรูปโปรไฟล์แล้ว');
    } catch (e) {
      if (mounted) showToast(context, 'อัปโหลดรูปไม่สำเร็จ', error: true);
    }
  }

  Future<void> _save() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    setState(() => _saving = true);
    try {
      await UserService.instance.updateProfile(uid, {
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'line': _line.text.trim(),
        'facebook': _facebook.text.trim(),
        'province': _province.text.trim(),
      });
      await auth.refreshProfile();
      if (mounted) showToast(context, 'บันทึกการตั้งค่าแล้ว');
    } catch (e) {
      if (mounted) showToast(context, 'บันทึกไม่สำเร็จ', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final me = auth.user;
    final theme = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('ตั้งค่า')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Profile section
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
                Row(
                  children: [
                    GestureDetector(
                      onTap: _pickAvatar,
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          MudmyAvatar(imageUrl: me?.avatar, name: me?.displayName ?? 'M', radius: 32),
                          Positioned(
                            right: -2,
                            bottom: -2,
                            child: Container(
                              padding: const EdgeInsets.all(5),
                              decoration: const BoxDecoration(
                                gradient: AppColors.brandGradient,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.photo_camera_rounded, size: 12, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(me?.displayName ?? '', style: AppTextStyles.title),
                          Text(me?.email ?? '', style: AppTextStyles.small.copyWith(color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'ชื่อ', prefixIcon: Icon(Icons.person_outline)),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'เบอร์โทรศัพท์', prefixIcon: Icon(Icons.phone_outlined)),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _line,
                  decoration: const InputDecoration(labelText: 'LINE ID', prefixIcon: Icon(Icons.chat_outlined)),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _facebook,
                  decoration: const InputDecoration(labelText: 'Facebook', prefixIcon: Icon(Icons.facebook)),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _province,
                  decoration: const InputDecoration(labelText: 'จังหวัด', prefixIcon: Icon(Icons.location_on_outlined)),
                ),
                const SizedBox(height: 16),
                FancyButton(
                  label: 'บันทึกโปรไฟล์',
                  icon: Icons.save_rounded,
                  loading: _saving,
                  onPressed: _save,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Appearance
          _Section(
            title: 'ธีมแสดงผล',
            children: [
              _RadioTile(
                value: 'light',
                group: theme.mode.name,
                label: 'โหมดสว่าง',
                icon: Icons.light_mode_outlined,
                onChanged: (v) => theme.setMode(ThemeMode.light),
              ),
              _RadioTile(
                value: 'dark',
                group: theme.mode.name,
                label: 'โหมดมืด',
                icon: Icons.dark_mode_outlined,
                onChanged: (v) => theme.setMode(ThemeMode.dark),
              ),
              _RadioTile(
                value: 'system',
                group: theme.mode.name,
                label: 'ตามระบบ',
                icon: Icons.brightness_auto_outlined,
                onChanged: (v) => theme.setMode(ThemeMode.system),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // About
          _Section(
            title: 'เกี่ยวกับ',
            children: [
              const _InfoTile(icon: Icons.info_outline, title: 'เวอร์ชัน', subtitle: '1.0.0'),
              _InfoTile(
                icon: Icons.privacy_tip_outlined,
                title: 'นโยบายความเป็นส่วนตัว',
                subtitle: 'ดูรายละเอียด',
              ),
              _InfoTile(
                icon: Icons.description_outlined,
                title: 'ข้อตกลงการใช้บริการ',
                subtitle: 'ดูรายละเอียด',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title, style: AppTextStyles.title),
        ),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _RadioTile extends StatelessWidget {
  const _RadioTile({
    required this.value,
    required this.group,
    required this.label,
    required this.icon,
    required this.onChanged,
  });

  final String value;
  final String group;
  final String label;
  final IconData icon;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = value == group;
    return ListTile(
      leading: Icon(icon, color: selected ? AppColors.primary : AppColors.textMuted),
      title: Text(label, style: AppTextStyles.bodyMedium),
      trailing: Radio<String>(
        value: value,
        groupValue: group,
        activeColor: AppColors.primary,
        onChanged: onChanged,
      ),
      onTap: () => onChanged(value),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.title, this.subtitle});

  final IconData icon;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textMuted),
      title: Text(title, style: AppTextStyles.bodyMedium),
      subtitle: subtitle == null ? null : Text(subtitle!, style: AppTextStyles.caption),
    );
  }
}
