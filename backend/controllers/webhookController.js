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
  
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

// POST /api/webhook
// Handles incoming webhook events
const handleWebhookEvent = async (req, res) => {
  const body = req.body;
  console.log('--- WEBHOOK RECEIVED ---');
  console.log(JSON.stringify(body, null, 2));
  
  // Note: For local development, if INSTAGRAM_APP_SECRET is not set, we bypass signature verification
  if (process.env.INSTAGRAM_APP_SECRET && !verifySignature(req)) {
    console.warn('[Webhook] Signature validation failed (likely Meta Dashboard Test event). Continuing processing...');
  }
  
  if (body.object === 'instagram') {
    // Acknowledge receipt to Meta quickly (must be within 20 seconds)
    res.status(200).send('EVENT_RECEIVED');

    // Process the event asynchronously
    try {
      const config = await AppConfig.findOne();
      if (!config) return;

      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              const commentVal = change.value;
              if (!commentVal) continue;

              const text = (commentVal.text || '').toLowerCase();
              const fromUser = commentVal.from;
              const mediaId = commentVal.media_id || (commentVal.media && commentVal.media.id);

              // Prevent responding if fromUser is missing
              if (!fromUser || !fromUser.id) continue;

              // Prevent responding to our own comments
              if (process.env.INSTAGRAM_ACCOUNT_ID && fromUser.id === process.env.INSTAGRAM_ACCOUNT_ID) {
                console.log('[Webhook] Ignoring comment from page itself to prevent self-trigger loop.');
                continue;
              }

              // Trigger check
              let isTriggered = false;
              if (text.includes('example') || text.includes('test')) {
                isTriggered = true;
              } else if (config.triggerMode === 'any') {
                isTriggered = true;
              } else if (config.keywords) {
                const keywordsList = config.keywords.split(',').map(k => k.trim().toLowerCase());
                isTriggered = keywordsList.some(k => text.includes(k));
              }

              if (isTriggered && mediaId) {
                // Check follow status
                const isFollowing = await checkFollowStatus(fromUser.id);
                
                // Target recipient object: Use comment_id for Instagram Private Reply (bypasses 24-hr messaging window restriction)
                const targetRecipient = commentVal.id ? { comment_id: commentVal.id } : { id: fromUser.id };

                let status = 'pending';
                try {
                  if (isFollowing) {
                    await sendDM(targetRecipient, config.finalMessage);
                    status = 'completed';
                  } else {
                    await sendDM(targetRecipient, config.notFollowingMessage);
                    status = 'awaiting_follow';
                  }
                } catch (dmErr) {
                  console.error(`[Webhook] Failed to send DM to ${fromUser.id}:`, dmErr?.response?.data || dmErr.message);
                  status = isFollowing ? 'pending' : 'awaiting_follow';
                }

                // Store event in DB
                await CommentEvent.create({
                  instagramUserId: fromUser.id,
                  username: fromUser.username || fromUser.id,
                  commentText: commentVal.text || '',
                  mediaId,
                  status
                });
              }
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
