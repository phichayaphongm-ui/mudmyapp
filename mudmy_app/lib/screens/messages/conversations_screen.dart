import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/chat.dart';
import '../../core/services/message_service.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/image_widgets.dart';
import 'chat_screen.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  List<Conversation> _conversations = [];
  bool _loading = true;
  String? _myUserId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final uid = auth.userId;
    if (uid == null) return;
    _myUserId = uid;
    final list = await MessageService.instance.getConversations(uid);
    if (!mounted) return;
    setState(() {
      _conversations = list;
      _loading = false;
    });
  }

  void _openChat(Conversation c) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          otherUserId: c.otherParticipantId(_myUserId!)!,
          otherName: c.otherName(_myUserId!),
          otherAvatar: c.otherAvatar(_myUserId!),
          pinId: c.pinId,
          pinTitle: c.pinTitle,
          conversationId: c.id,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ข้อความ'),
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _conversations.isEmpty
                ? const EmptyState(
                    icon: Icons.forum_outlined,
                    title: 'ยังไม่มีข้อความ',
                    subtitle: 'เริ่มคุยกับเจ้าของหมุดหมายที่คุณสนใจ',
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                    itemCount: _conversations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _ConversationTile(
                      conversation: _conversations[i],
                      myUserId: _myUserId!,
                      onTap: () => _openChat(_conversations[i]),
                    ),
                  ),
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({
    required this.conversation,
    required this.myUserId,
    required this.onTap,
  });

  final Conversation conversation;
  final String myUserId;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final unread = conversation.unreadFor(myUserId);
    return Material(
      color: unread > 0
          ? AppColors.primary.withValues(alpha: 0.06)
          : Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: unread > 0 ? AppColors.primary.withValues(alpha: 0.3) : Theme.of(context).dividerColor,
            ),
          ),
          child: Row(
            children: [
              MudmyAvatar(
                imageUrl: conversation.otherAvatar(myUserId),
                name: conversation.otherName(myUserId),
                radius: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.otherName(myUserId),
                            style: AppTextStyles.title.copyWith(
                              fontSize: 15,
                              fontWeight: unread > 0 ? FontWeight.w700 : FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          Fmt.timeAgo(conversation.lastMessageAt),
                          style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    if (conversation.pinTitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'หมุดหมาย: ${conversation.pinTitle}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.caption.copyWith(color: AppColors.primary),
                      ),
                    ],
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.lastMessage.isEmpty
                                ? 'เริ่มสนทนา...'
                                : conversation.lastMessage,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.body.copyWith(
                              color: unread > 0 ? AppColors.textPrimary : AppColors.textSecondary,
                              fontSize: 13,
                              fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                        ),
                        if (unread > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              unread > 99 ? '99+' : '$unread',
                              style: AppTextStyles.caption.copyWith(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
