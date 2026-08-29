import 'dart:async';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/models/chat.dart';
import '../../core/services/message_service.dart';
import '../../core/services/supabase_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/ui_helpers.dart';
import '../../core/widgets/image_widgets.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.otherUserId,
    required this.otherName,
    required this.otherAvatar,
    required this.pinId,
    required this.pinTitle,
    this.conversationId,
  });

  final String otherUserId;
  final String otherName;
  final String? otherAvatar;
  final String? pinId;
  final String? pinTitle;
  final String? conversationId;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  StreamSubscription<List<ChatMessage>>? _sub;
  List<ChatMessage> _messages = [];
  String? _conversationId;
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    if (me == null) return;

    String convId;
    if (widget.conversationId != null) {
      convId = widget.conversationId!;
    } else {
      final conv = await MessageService.instance.getOrCreateConversation(
        myUserId: me.id,
        myName: me.displayName,
        myAvatar: me.avatar,
        otherUserId: widget.otherUserId,
        otherName: widget.otherName,
        otherAvatar: widget.otherAvatar,
        pinId: widget.pinId ?? '',
        pinTitle: widget.pinTitle ?? '',
      );
      if (conv == null) {
        if (mounted) showToast(context, 'ไม่สามารถเริ่มสนทนาได้', error: true);
        return;
      }
      convId = conv.id;
    }

    if (!mounted) return;
    _conversationId = convId;

    final messages = await MessageService.instance.getMessages(convId);
    await MessageService.instance.markAsRead(convId, me.id);
    if (!mounted) return;
    setState(() {
      _messages = messages;
      _loading = false;
    });
    _scrollToBottom();

    _sub = MessageService.instance.subscribeToMessages(convId).listen((list) {
      if (!mounted) return;
      setState(() => _messages = list);
      MessageService.instance.markAsRead(convId, me.id);
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    final convId = _conversationId;
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    if (text.isEmpty || convId == null || me == null || _sending) return;

    setState(() => _sending = true);
    _input.clear();
    try {
      await MessageService.instance.sendMessage(
        conversationId: convId,
        senderId: me.id,
        senderName: me.displayName,
        senderAvatar: me.avatar,
        text: text,
      );
    } catch (e) {
      if (mounted) showToast(context, 'ส่งข้อความไม่สำเร็จ', error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _sendImage() async {
    final convId = _conversationId;
    final auth = context.read<AuthProvider>();
    final me = auth.user;
    if (convId == null || me == null) return;

    try {
      final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1200);
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      final path = await SupabaseService.instance.uploadBytes(
        folder: 'chats',
        path: '$convId/${DateTime.now().millisecondsSinceEpoch}.jpg',
        bytes: bytes,
        contentType: 'image/jpeg',
      );
      await MessageService.instance.sendMessage(
        conversationId: convId,
        senderId: me.id,
        senderName: me.displayName,
        senderAvatar: me.avatar,
        text: '[ภาพ]',
        image: SupabaseService.instance.storageUrl(path),
      );
    } catch (e) {
      if (mounted) showToast(context, 'ส่งรูปภาพไม่สำเร็จ', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF161616) : const Color(0xFFF3EDE9),
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            MudmyAvatar(imageUrl: widget.otherAvatar, name: widget.otherName, radius: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.otherName, style: AppTextStyles.title.copyWith(fontSize: 16)),
                  if (widget.pinTitle != null)
                    Text(
                      widget.pinTitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (_, i) => _Bubble(
                        message: _messages[i],
                        isMine: _messages[i].senderId == context.read<AuthProvider>().userId,
                      ),
                    ),
            ),
            _InputBar(
              controller: _input,
              sending: _sending,
              onSend: _send,
              onImage: _sendImage,
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.isMine});

  final ChatMessage message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final time = Fmt2.time(message.createdAt);
    final bubble = Container(
      padding: EdgeInsets.all(message.isImage ? 6 : 12),
      decoration: BoxDecoration(
        color: isMine ? AppColors.primary : Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(18),
          topRight: const Radius.circular(18),
          bottomLeft: Radius.circular(isMine ? 18 : 4),
          bottomRight: Radius.circular(isMine ? 4 : 18),
        ),
      ),
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (message.isImage)
            MudmyImage(url: message.image, borderRadius: 12, width: 220, height: 160)
          else
            Text(
              message.text,
              style: AppTextStyles.body.copyWith(
                color: isMine ? Colors.white : Theme.of(context).colorScheme.onSurface,
              ),
            ),
          const SizedBox(height: 2),
          Text(
            time,
            style: AppTextStyles.caption.copyWith(
              color: isMine ? Colors.white70 : AppColors.textMuted,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: bubble,
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({
    required this.controller,
    required this.sending,
    required this.onSend,
    required this.onImage,
  });

  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;
  final VoidCallback onImage;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: onImage,
            icon: const Icon(Icons.image_outlined, color: AppColors.primary),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Theme.of(context).inputDecorationTheme.fillColor,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: controller,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                minLines: 1,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'พิมพ์ข้อความ...',
                  border: InputBorder.none,
                  filled: false,
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
                style: AppTextStyles.body,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: sending ? null : onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                gradient: AppColors.brandGradient,
                shape: BoxShape.circle,
              ),
              child: sending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

/// Minimal formatter to avoid import cycle in this screen.
class Fmt2 {
  static String time(DateTime d) =>
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
