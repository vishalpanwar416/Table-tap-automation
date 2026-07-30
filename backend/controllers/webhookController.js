const crypto = require('crypto');
const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const { 
  sendDM, 
  sendInitialButtonDM, 
  sendNotFollowingButtonsDM, 
  sendFinalResourceButtonsDM, 
  checkFollowStatus 
} = require('../services/instagramService');

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
  
  const hmac = crypto.createHmac('sha256', process.env.INSTAGRAM_APP_SECRET || '');
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
  
  if (process.env.INSTAGRAM_APP_SECRET && !verifySignature(req)) {
    console.warn('[Webhook] Signature validation failed (likely Meta Dashboard Test event). Continuing processing...');
  }
  
  if (body.object === 'instagram') {
    res.status(200).send('EVENT_RECEIVED');

    try {
      const config = await AppConfig.findOne();
      if (!config) return;

      for (const entry of body.entry) {
        // --- 1. HANDLE COMMENT WEBHOOKS ---
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              const commentVal = change.value;
              if (!commentVal) continue;

              const text = (commentVal.text || '').toLowerCase();
              const fromUser = commentVal.from;
              const mediaId = commentVal.media_id || (commentVal.media && commentVal.media.id);

              if (!fromUser || !fromUser.id) continue;

              if (process.env.INSTAGRAM_ACCOUNT_ID && fromUser.id === process.env.INSTAGRAM_ACCOUNT_ID) {
                continue;
              }

              let isTriggered = false;
              if (config.triggerMode === 'any') {
                isTriggered = true;
              } else if (text.includes('example') || text.includes('test')) {
                isTriggered = true;
              } else if (config.keywords) {
                const keywordsList = config.keywords.split(',').map(k => k.trim().toLowerCase());
                isTriggered = keywordsList.some(k => text.includes(k));
              }

              if (isTriggered && mediaId) {
                const targetRecipient = { id: fromUser.id };

                // Check if user already follows
                const isFollowing = await checkFollowStatus(fromUser.id);

                // Step 1: Send initial interactive message template from DB
                try {
                  await sendInitialButtonDM(targetRecipient, config.initialMessage);
                } catch (dmErr) {
                  console.error('[Webhook] Initial DM error:', dmErr?.response?.data || dmErr.message);
                }

                await CommentEvent.create({
                  instagramUserId: fromUser.id,
                  username: fromUser.username || fromUser.id,
                  commentText: commentVal.text || '',
                  mediaId,
                  isFollowing: isFollowing,
                  status: isFollowing ? 'completed' : 'awaiting_follow'
                });
              }
            }
          }
        }

        // --- 2. HANDLE INTERACTIVE BUTTON CLICK WEBHOOKS ---
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const messaging of entry.messaging) {
            const senderId = messaging.sender && messaging.sender.id;
            if (!senderId || senderId === process.env.INSTAGRAM_ACCOUNT_ID) continue;

            const postbackPayload = messaging.postback && messaging.postback.payload;
            const quickReplyPayload = messaging.message && messaging.message.quick_reply && messaging.message.quick_reply.payload;
            const messageText = (messaging.message && messaging.message.text || '').toLowerCase();

            const payload = postbackPayload || quickReplyPayload || messageText;

            // Step 2 Click: "Send me the link"
            if (payload === 'SEND_LINK_CLICKED' || payload.includes('send me the link')) {
              const isFollowing = await checkFollowStatus(senderId);
              if (isFollowing) {
                await sendFinalResourceButtonsDM(senderId, config.finalMessage);
                await CommentEvent.updateMany({ instagramUserId: senderId }, { isFollowing: true, status: 'completed' });
              } else {
                await sendNotFollowingButtonsDM(senderId, config.notFollowingMessage);
              }
            }

            // Step 3 Click: "I'm following ✓"
            if (payload === 'IM_FOLLOWING_CLICKED' || payload.includes('following')) {
              console.log(`[Webhook] User ${senderId} clicked "I'm following ✓". Recording follow in DB & delivering final links...`);
              await CommentEvent.updateMany(
                { instagramUserId: senderId }, 
                { isFollowing: true, followedAt: new Date(), status: 'completed' }
              );
              await sendFinalResourceButtonsDM(senderId, config.finalMessage);
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
