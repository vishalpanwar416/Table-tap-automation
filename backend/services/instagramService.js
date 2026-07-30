const axios = require('axios');
const CommentEvent = require('../models/CommentEvent');

const sendDM = async (target, text) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    if (!accountId || !accessToken) {
      console.log(`[MOCK DM] To:`, target, `Text: "${text}"`);
      return { message_id: 'mock_msg_' + Date.now() };
    }

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: { text }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`[REAL DM] Sent text to`, recipientObj, `successfully.`);
    return response.data;
  } catch (error) {
    console.error('Failed to send Instagram DM:', error?.response?.data || error.message);
    throw error;
  }
};

// Step 1: Sent when user comments on a post
const sendInitialButtonDM = async (target, customText) => {
  const text = customText || "Hey there! 🍽️✨\n\nThanks for reaching out! Table-Tap makes dining out seamless, fast, and interactive.\n\nClick below and I'll send you your exclusive access link in just a sec! 👇";
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!accountId || !accessToken) return sendDM(target, text);

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: {
        text,
        quick_replies: [
          {
            content_type: "text",
            title: "Send me the link",
            payload: "SEND_LINK_CLICKED"
          }
        ]
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.warn('[Interactive DM] Quick reply fallback to text:', error?.response?.data || error.message);
    return sendDM(target, text);
  }
};

// Step 2: Sent when user clicks "Send me the link" but isn't following yet
const sendNotFollowingButtonsDM = async (target, customText) => {
  const text = customText || "Wait, you're not following us yet? 🍕\n\nWe share exclusive food deals, secret dining spots, and instant restaurant updates. Hit follow below and join the Table-Tap family! 💛";
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!accountId || !accessToken) return sendDM(target, text);

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: {
        text,
        quick_replies: [
          {
            content_type: "text",
            title: "I'm following ✓",
            payload: "IM_FOLLOWING_CLICKED"
          }
        ]
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.warn('[Interactive DM] Not following button fallback to text:', error?.response?.data || error.message);
    return sendDM(target, text);
  }
};

// Step 3: Sent when user clicks "I'm following ✓" (or already follows)
const sendFinalResourceButtonsDM = async (target, customText) => {
  const text = customText || "Awesome! Welcome aboard! 🚀\nHere is your official Table-Tap link 👇\n\n👉 Visit Table-Tap: https://table-tap.in\n📱 Instant Menu & Ordering: https://app.table-tap.in\n🔥 Exclusive Dining Deals: https://app.table-tap.in/offers";
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!accountId || !accessToken) return sendDM(target, text);

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: { text }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.warn('[Interactive DM] Final resource button fallback to text:', error?.response?.data || error.message);
    return sendDM(target, text);
  }
};

// Checks if user has verified follow status in MongoDB
const checkFollowStatus = async (recipientId) => {
  try {
    const completedUserEvent = await CommentEvent.findOne({ 
      instagramUserId: String(recipientId), 
      status: 'completed' 
    });
    
    const isFollowing = !!completedUserEvent;
    console.log(`[FOLLOW CHECK] User ${recipientId} follow status: ${isFollowing}`);
    return isFollowing;
  } catch (err) {
    console.error('[FOLLOW CHECK] Error checking follow status:', err);
    return false;
  }
};

module.exports = {
  sendDM,
  sendInitialButtonDM,
  sendNotFollowingButtonsDM,
  sendFinalResourceButtonsDM,
  checkFollowStatus
};
