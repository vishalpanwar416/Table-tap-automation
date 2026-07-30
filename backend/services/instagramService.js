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

// Step 2: Sent when user clicks "Send me the link" but hasn't verified follow yet
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

// Step 3: Sent when user clicks "I'm following ✓"
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

// Attempts to check user against Meta Graph API follower list, falling back to DB follow logs
const checkFollowStatus = async (recipientId, username) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

    // 1. Try checking Meta Graph API follower list if available
    if (accountId && accessToken) {
      try {
        const res = await axios.get(`https://graph.facebook.com/v20.0/${accountId}/followers`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const followers = res.data?.data || [];
        const isFound = followers.some(f => f.id === String(recipientId) || (username && f.username === username));
        if (isFound) {
          console.log(`[GRAPH API FOLLOW CHECK] User ${username || recipientId} confirmed in account followers list!`);
          return true;
        }
      } catch (graphErr) {
        console.log('[GRAPH API FOLLOW CHECK] Graph API followers endpoint requires Advanced Access permission:', graphErr?.response?.data?.error?.message || graphErr.message);
      }
    }

    // 2. Fallback: Check if user is recorded as following in MongoDB
    const latestEvent = await CommentEvent.findOne({ 
      $or: [{ instagramUserId: String(recipientId) }, { username: String(username) }]
    }).sort({ createdAt: -1 });

    const isFollowing = latestEvent ? latestEvent.isFollowing === true : false;
    console.log(`[FOLLOW CHECK] User ${username || recipientId} follow status: ${isFollowing}`);
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
