const crypto = require('crypto');
const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const EventService = require('../services/eventService');
const ConfigurationService = require('../services/configurationService');
const AutomationService = require('../services/automationService');
const instagramService = require('../services/instagramService');

const automationService = new AutomationService({
  eventService: new EventService(CommentEvent),
  configurationService: new ConfigurationService(AppConfig),
  instagramService
});

const verifySignature = (request) => {
  const signature = request.headers['x-hub-signature-256'];
  if (!signature) return false;

  const expected = `sha256=${crypto.createHmac('sha256', process.env.INSTAGRAM_APP_SECRET || '').update(request.rawBody).digest('hex')}`;
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(mode && token ? 403 : 400);
};

const handleWebhookEvent = async (req, res) => {
  if (req.body.object !== 'instagram') return res.sendStatus(404);

  if (process.env.INSTAGRAM_APP_SECRET && !verifySignature(req)) {
    console.warn('[Webhook] Signature validation failed.');
    return res.sendStatus(403);
  }

  res.status(200).send('EVENT_RECEIVED');

  try {
    await automationService.processWebhook(req.body);
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
  }
};

module.exports = { verifyWebhook, handleWebhookEvent };
