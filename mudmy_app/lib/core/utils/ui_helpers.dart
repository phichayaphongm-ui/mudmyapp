import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/buttons.dart';

/// Toast / snackbar helpers.
void showToast(BuildContext context, String message, {bool error = false}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      content: Row(
        children: [
          Icon(
            error ? Icons.error_outline : Icons.check_circle_outline,
            color: error ? AppColors.danger : AppColors.success,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: AppTextStyles.body.copyWith(color: Colors.white, fontSize: 14),
            ),
          ),
        ],
      ),
      backgroundColor: Theme.of(context).colorScheme.onSurface,
      duration: const Duration(seconds: 3),
    ),
  );
}

/// Confirmation dialog. Returns true when confirmed.
Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'ยืนยัน',
  bool danger = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message, style: AppTextStyles.body),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: const Text('ยกเลิก'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(
            confirmLabel,
            style: TextStyle(color: danger ? AppColors.danger : AppColors.primary),
          ),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Bottom sheet with a title, used as a lightweight modal.
Future<T?> showMudmySheet<T>(
  BuildContext context, {
  required String title,
  required Widget child,
  bool scrollable = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Theme.of(ctx).dividerColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(title, style: AppTextStyles.headline),
          const SizedBox(height: 16),
          Flexible(child: scrollable ? SingleChildScrollView(child: child) : child),
        ],
      ),
    ),
  );
}

/// Inline full-width primary button (wraps FancyButton).
Widget primaryButton(String label, VoidCallback? onPressed,
    {IconData? icon, bool loading = false, bool danger = false}) {
  return FancyButton(
    label: label,
    onPressed: onPressed,
    icon: icon,
    loading: loading,
    danger: danger,
  );
}
