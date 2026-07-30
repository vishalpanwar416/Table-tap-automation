const crypto = require('crypto');
const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const { sendDM, checkFollowStatus } = require('../services/instagramService');

// GET /api/webhook
// Verifies the webhook subscription with Meta
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.status(400).send('Missing mode or token');
  }
};

const verifySignature = (req) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', process.env.INSTAGRAM_APP_SECRET || ''); // Usually needs App Secret
  hmac.update(req.rawBody);
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

// POST /api/webhook
// Handles incoming webhook events
const handleWebhookEvent = async (req, res) => {
  const body = req.body;
  console.log('--- WEBHOOK RECEIVED ---');
  console.log(JSON.stringify(body, null, 2));
  
  // Note: For local development, if INSTAGRAM_APP_SECRET is not set, we bypass signature verification
  if (process.env.INSTAGRAM_APP_SECRET && !verifySignature(req)) {
    console.warn('Webhook signature validation failed.');
    return res.sendStatus(401);
  }
  
  if (body.object === 'instagram') {
    // Acknowledge receipt to Meta quickly (must be within 20 seconds)
    res.status(200).send('EVENT_RECEIVED');

    // Process the event asynchronously
    try {
      const config = await AppConfig.findOne();
      if (!config) return;

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const commentVal = change.value;
            const text = commentVal.text.toLowerCase();
            const fromUser = commentVal.from;
            const mediaId = commentVal.media.id;

            // Prevent responding to our own comments
            if (!fromUser || !fromUser.id) continue;

            // Trigger check
            let isTriggered = false;
            if (config.triggerMode === 'any') {
              isTriggered = true;
            } else if (config.keywords) {
              const keywordsList = config.keywords.split(',').map(k => k.trim().toLowerCase());
              isTriggered = keywordsList.some(k => text.includes(k));
            }

            if (isTriggered) {
              // Check if user already processed to prevent spam
              const existingEvent = await CommentEvent.findOne({ instagramUserId: fromUser.id, mediaId });
              if (existingEvent) continue; 

              // Check follow status
              const isFollowing = await checkFollowStatus(fromUser.id);
              
              let status = 'pending';
              if (isFollowing) {
                // Send final link
                await sendDM(fromUser.id, config.finalMessage);
                status = 'completed';
              } else {
                // Send please follow message
                await sendDM(fromUser.id, config.notFollowingMessage);
                status = 'awaiting_follow';
              }

              // Store event in DB
              await CommentEvent.create({
                instagramUserId: fromUser.id,
                username: fromUser.username || fromUser.id,
                commentText: commentVal.text,
                mediaId,
                status
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  } else {
    res.sendStatus(404);
  }
};

module.exports = {
  verifyWebhook,
  handleWebhookEvent
};
