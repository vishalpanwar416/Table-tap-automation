const crypto = require('crypto');

const isValidSignature = (rawBody, signature, appSecret) => {
  if (!signature || !appSecret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const createWebhookController = ({ automationService, verifyToken, appSecret }) => ({
  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === verifyToken) return res.status(200).send(challenge);
    return res.sendStatus(mode && token ? 403 : 400);
  },

  async handleWebhookEvent(req, res) {
    if (req.body.object !== 'instagram') return res.sendStatus(404);
    if (appSecret && !isValidSignature(req.rawBody, req.headers['x-hub-signature-256'], appSecret)) {
      console.warn('[Webhook] Signature validation failed.');
      return res.sendStatus(403);
    }

    res.status(200).send('EVENT_RECEIVED');
    try {
      await automationService.processWebhook(req.body);
    } catch (error) {
      console.error('[Webhook] Processing error:', error);
    }
  }
});

module.exports = { createWebhookController, isValidSignature };
