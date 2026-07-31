class AutomationService {
  constructor({ eventRepository, configRepository, instagramGateway, triggerService, accountId }) {
    this.eventRepository = eventRepository;
    this.configRepository = configRepository;
    this.instagramGateway = instagramGateway;
    this.triggerService = triggerService;
    this.accountId = accountId;
  }

  async handleComment(comment, config) {
    const user = comment.from;
    const mediaId = comment.media_id || comment.media?.id;
    if (!user?.id || !mediaId || user.id === this.accountId) return;
    if (!this.triggerService.matches(comment.text, config)) return;

    const event = await this.eventRepository.create({
      instagramUserId: user.id,
      username: user.username || user.id,
      commentText: comment.text || '',
      commentId: comment.id || comment.comment_id,
      mediaId
    });

    await this.instagramGateway.sendInitialReply(user.id, config.initialMessage);
    if (config.commentReplyEnabled && (comment.id || comment.comment_id)) {
      const reply = (config.commentReplyMessage || '')
        .replaceAll('{{username}}', user.username || user.id)
        .replaceAll('{{comment}}', comment.text || '');
      try {
        await this.instagramGateway.replyToComment(comment.id || comment.comment_id, reply);
      } catch (error) {
        // A public comment reply is helpful but should not prevent the DM flow.
        console.error('[Instagram] Comment reply failed:', error.message);
      }
    }
    event.status = 'dm_sent';
    event.updatedAt = new Date();
    await this.eventRepository.save(event);
    event.status = 'awaiting_follow';
    event.updatedAt = new Date();
    await this.eventRepository.save(event);
  }

  async handleInteraction(message, config) {
    const senderId = message.sender?.id;
    if (!senderId || senderId === this.accountId) return;

    const payload = message.postback?.payload || message.message?.quick_reply?.payload || message.message?.text?.toLowerCase() || '';
    const event = await this.eventRepository.findLatestByInstagramUserId(senderId);

    if (payload === 'SEND_LINK_CLICKED' || payload.includes('send me the link')) {
      if (event?.isFollowing) {
        await this.instagramGateway.sendFinalResource(senderId, config.finalMessage);
        await this.completeEvent(event, false);
      } else {
        await this.instagramGateway.sendFollowPrompt(senderId, config.notFollowingMessage);
      }
    }

    if (payload === 'IM_FOLLOWING_CLICKED' || payload.includes('following')) {
      await this.instagramGateway.sendFinalResource(senderId, config.finalMessage);
      await this.completeEvent(event, true);
    }
  }

  async processWebhook(body) {
    if (body.object !== 'instagram') return;
    const config = await this.configRepository.get();

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'comments' && change.value) await this.handleComment(change.value, config);
      }
      for (const message of entry.messaging || []) await this.handleInteraction(message, config);
    }
  }

  async completeEvent(event, isFollowing) {
    if (!event) return;
    event.status = 'completed';
    event.updatedAt = new Date();
    if (isFollowing) {
      event.isFollowing = true;
      event.followedAt = event.updatedAt;
    }
    await this.eventRepository.save(event);
  }

  async manuallyCompleteEvent(event) {
    const config = await this.configRepository.get();
    await this.instagramGateway.sendFinalResource(event.instagramUserId, config.finalMessage);
    await this.completeEvent(event, true);
  }
}

module.exports = AutomationService;
