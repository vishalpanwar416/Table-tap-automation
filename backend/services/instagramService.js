const axios = require('axios');

class InstagramGateway {
  constructor({ accessToken, accountId, httpClient = axios, logger = console }) {
    this.accessToken = accessToken;
    this.accountId = accountId;
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

  async sendMessage(recipientId, text, quickReplies) {
    if (!this.isConfigured) {
      this.logger.log(`[MOCK DM] To: ${recipientId} Text: "${text}"`);
      return { message_id: `mock_msg_${Date.now()}` };
    }

    const message = { text };
    if (quickReplies) message.quick_replies = quickReplies;

    try {
      const response = await this.httpClient.post('https://graph.facebook.com/v20.0/me/messages', {
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
    if (!this.isConfigured) return false;

    try {
      const response = await this.httpClient.get(
        `https://graph.facebook.com/v20.0/${this.accountId}/followers`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      return (response.data?.data || []).some((follower) => (
        follower.id === String(recipientId) || (username && follower.username === username)
      ));
    } catch (error) {
      this.logger.warn('[Instagram] Could not verify follower status:', error?.response?.data?.error?.message || error.message);
      return false;
    }
  }
}

module.exports = InstagramGateway;
