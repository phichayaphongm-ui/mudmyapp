import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/buttons.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signInWithEmail(_email.text.trim(), _password.text);
      if (mounted) {
        final auth = context.read<AuthProvider>();
        if (!auth.isAuthenticated) {
          // email confirmation pending
          showToast(context, 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ', error: true);
        }
      }
    } catch (e) {
      if (mounted) showToast(context, 'เข้าสู่ระบบไม่สำเร็จ: ${e.toString().replaceFirst('Exception: ', '')}', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _google() async {
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signInWithGoogle();
    } catch (e) {
      if (mounted) showToast(context, 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
                      borderRadius: BorderRadius.circular(26),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.4),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.push_pin_rounded, size: 46, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 28),
                Text('ยินดีต้อนรับกลับ', style: AppTextStyles.display),
                const SizedBox(height: 6),
                Text(
                  'เข้าสู่ระบบ ${AppConfig.appName} เพื่อปักหมุดโอกาสของคุณ',
                  style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'อีเมล',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                  validator: (v) =>
                      (v == null || !v.contains('@')) ? 'กรุณากรอกอีเมลให้ถูกต้อง' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: 'รหัสผ่าน',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) => (v == null || v.isEmpty) ? 'กรุณากรอกรหัสผ่าน' : null,
                ),
                const SizedBox(height: 24),
                FancyButton(
                  label: 'เข้าสู่ระบบ',
                  icon: Icons.login_rounded,
                  loading: _loading,
                  onPressed: _submit,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('หรือ',
                          style: AppTextStyles.small.copyWith(color: AppColors.textMuted)),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 20),
                SoftButton(
                  label: 'เข้าสู่ระบบด้วย Google',
                  icon: Icons.g_mobiledata,
                  color: AppColors.textPrimary,
                  onPressed: _loading ? null : _google,
                ),
                const SizedBox(height: 28),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('ยังไม่มีบัญชี? ', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
                      InkWell(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const RegisterScreen()),
                        ),
                        child: Text('สมัครสมาชิก',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            )),
                      ),
                    ],
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
