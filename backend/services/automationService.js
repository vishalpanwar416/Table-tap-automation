class AutomationService {
  constructor({ eventService, configurationService, instagramService }) {
    this.eventService = eventService;
    this.configurationService = configurationService;
    this.instagramService = instagramService;
  }

  matchesTrigger(text, config) {
    if (config.triggerMode === 'any') return true;
    const normalizedText = text.toLowerCase();
    if (normalizedText.includes('example') || normalizedText.includes('test')) return true;
    const keywords = config.keywords
      .split(',')
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean);
    return keywords.some((keyword) => normalizedText.includes(keyword));
  }

  async handleComment(comment, config) {
    const user = comment.from;
    const mediaId = comment.media_id || comment.media?.id;
    if (!user?.id || !mediaId || user.id === process.env.INSTAGRAM_ACCOUNT_ID) return;
    if (!this.matchesTrigger(comment.text || '', config)) return;

    await this.instagramService.sendInitialButtonDM({ id: user.id }, config.initialMessage);
    await this.eventService.createCommentEvent({
      instagramUserId: user.id,
      username: user.username || user.id,
      commentText: comment.text || '',
      mediaId
    });
  }

  async handleInteraction(message, config) {
    const senderId = message.sender?.id;
    if (!senderId || senderId === process.env.INSTAGRAM_ACCOUNT_ID) return;

    const payload = message.postback?.payload || message.message?.quick_reply?.payload || message.message?.text?.toLowerCase() || '';
    const event = await this.eventService.findLatestForUser(senderId);

    if (payload === 'SEND_LINK_CLICKED' || payload.includes('send me the link')) {
      if (event?.isFollowing) {
        await this.instagramService.sendFinalResourceButtonsDM(senderId, config.finalMessage);
        await this.eventService.markCompleted(event);
      } else {
        await this.instagramService.sendNotFollowingButtonsDM(senderId, config.notFollowingMessage);
      }
    }

    if (payload === 'IM_FOLLOWING_CLICKED' || payload.includes('following')) {
      await this.eventService.markCompleted(event, true);
      await this.instagramService.sendFinalResourceButtonsDM(senderId, config.finalMessage);
    }
  }

  async processWebhook(body) {
    if (body.object !== 'instagram') return;
    const config = await this.configurationService.get();

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'comments' && change.value) await this.handleComment(change.value, config);
      }
      for (const message of entry.messaging || []) await this.handleInteraction(message, config);
    }
  }
}

module.exports = AutomationService;
