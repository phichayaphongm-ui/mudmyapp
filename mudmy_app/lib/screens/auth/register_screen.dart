import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/buttons.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _userType = 'personal';
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signUp(
            email: _email.text.trim(),
            password: _password.text,
            name: _name.text.trim(),
            nickname: _name.text.trim(),
            userType: _userType,
          );
      if (mounted) {
        showToast(context, 'สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลแล้วเข้าสู่ระบบ');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        showToast(context, 'สมัครสมาชิกไม่สำเร็จ: ${e.toString().replaceFirst('Exception: ', '')}', error: true);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('สมัครสมาชิก')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('สร้างบัญชีของคุณ', style: AppTextStyles.display),
                const SizedBox(height: 6),
                Text(
                  'มาเป็นส่วนหนึ่งของชุมชนที่ทุกคนเป็นฮีโร่และผู้ประกอบการได้',
                  style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                _TypeSelector(value: _userType, onChanged: (v) => setState(() => _userType = v)),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _name,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'ชื่อ / ชื่อร้าน',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'กรุณากรอกชื่อ' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'อีเมล',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                  validator: (v) => (v == null || !v.contains('@')) ? 'อีเมลไม่ถูกต้อง' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'รหัสผ่าน',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'กรุณากรอกรหัสผ่าน';
                    if (v.length < 6) return 'อย่างน้อย 6 ตัวอักษร';
                    if (v.contains(_name.text.trim()) && _name.text.trim().isNotEmpty) {
                      return 'ห้ามใช้ชื่อหรืออีเมลในรหัสผ่าน';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.info_outline, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร และไม่ซ้ำกับชื่อของคุณ',
                        style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: const InputDecoration(
                    labelText: 'ยืนยันรหัสผ่าน',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (v) => (v != _password.text) ? 'รหัสผ่านไม่ตรงกัน' : null,
                ),
                const SizedBox(height: 28),
                FancyButton(
                  label: 'สมัครสมาชิก',
                  icon: Icons.person_add_alt_1_rounded,
                  loading: _loading,
                  onPressed: _submit,
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    'โดยการสมัคร คุณยอมรับข้อตกลงการใช้บริการและนโยบายความเป็นส่วนตัว',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TypeSelector extends StatelessWidget {
  const _TypeSelector({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _TypeCard(
            label: 'บุคคลทั่วไป',
            icon: Icons.person_outline,
            selected: value == 'personal',
            onTap: () => onChanged('personal'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _TypeCard(
            label: 'ธุรกิจ',
            icon: Icons.storefront_outlined,
            selected: value == 'business',
            onTap: () => onChanged('business'),
          ),
        ),
      ],
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? AppColors.primary : Theme.of(context).dividerColor,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? AppColors.primary : AppColors.textSecondary, size: 28),
            const SizedBox(height: 8),
            Text(label, style: AppTextStyles.label),
          ],
        ),
      ),
    );
  }
}
