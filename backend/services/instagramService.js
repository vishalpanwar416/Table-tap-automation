const axios = require('axios');

class InstagramGateway {
  constructor({ accessToken, accountId, graphApiVersion = process.env.META_GRAPH_API_VERSION || 'v23.0', httpClient = axios, logger = console }) {
    this.accessToken = accessToken;
    this.accountId = accountId;
    this.graphApiVersion = graphApiVersion;
    this.httpClient = httpClient;
    this.logger = logger;
  }

  get isConfigured() {
    return Boolean(this.accessToken && this.accountId);
  }

  async sendInitialReply(recipientId, text) {
    return this.sendMessage(recipientId, text, [{
      content_type: 'text',
      title: 'Send me the link',
      payload: 'SEND_LINK_CLICKED'
    }]);
  }

  async sendFollowPrompt(recipientId, text) {
    return this.sendMessage(recipientId, text, [{
      content_type: 'text',
      title: "I'm following ✓",
      payload: 'IM_FOLLOWING_CLICKED'
    }]);
  }

  async sendFinalResource(recipientId, text) {
    return this.sendMessage(recipientId, text);
  }

  async replyToComment(commentId, text) {
    if (!commentId) return null;
    if (!this.isConfigured) {
      this.logger.log(`[MOCK COMMENT REPLY] Comment: ${commentId} Text: "${text}"`);
      return { id: `mock_comment_reply_${Date.now()}` };
    }

    const response = await this.httpClient.post(
      `https://graph.facebook.com/${this.graphApiVersion}/${commentId}/replies`,
      { message: text },
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return response.data;
  }

  async sendMessage(recipientId, text, quickReplies) {
    if (!this.isConfigured) {
      this.logger.log(`[MOCK DM] To: ${recipientId} Text: "${text}"`);
      return { message_id: `mock_msg_${Date.now()}` };
    }

    const message = { text };
    if (quickReplies) message.quick_replies = quickReplies;

    try {
      const response = await this.httpClient.post(`https://graph.facebook.com/${this.graphApiVersion}/me/messages`, {
        recipient: { id: recipientId },
        message
      }, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      return response.data;
    } catch (error) {
      // A plain-text message is still useful when Meta rejects quick replies.
      if (quickReplies) return this.sendMessage(recipientId, text);
      throw error;
    }
  }

  async isFollowing(recipientId, username) {
    // Instagram does not expose a supported general-purpose `/followers`
    // endpoint for checking whether an arbitrary user follows the account.
    // The reliable path is the explicit “I'm following” quick reply handled
    // by AutomationService; the dashboard also provides a manual override.
    return false;
  }
}

module.exports = InstagramGateway;
