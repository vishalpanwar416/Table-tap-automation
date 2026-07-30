const axios = require('axios');

const sendDM = async (target, text) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    if (!accountId || !accessToken) {
      console.log(`[MOCK DM] To:`, target, `Text: "${text}"`);
      return { message_id: 'mock_msg_' + Date.now() };
    }

    let recipientObj = target;
    if (typeof target === 'string') {
      recipientObj = { id: target };
    }

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

// Step 1: Sent when user comments on a post (e.g. "link")
const sendInitialButtonDM = async (target) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!accountId || !accessToken) return sendDM(target, 'Hello jii 🤍 ! Click below and I\'ll send you the link in just a sec ✨\n\n👉 Send me the link');

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: {
        text: "Hello jii 🤍 !\n\nI know exactly how valuable time is. That's why everything on my page is packed with free, premium value to help you level up.\n\nClick below and I'll send you the link in just a sec ✨",
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
    return sendDM(target, "Hello jii 🤍 !\n\nClick below and I'll send you the link in just a sec ✨\n\n👉 Reply 'Send me the link'");
  }
};

// Step 2: Sent when user clicks "Send me the link" but is not following yet
const sendNotFollowingButtonsDM = async (target) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!accountId || !accessToken) return sendDM(target, "Wait, you're not following the page yet? 🧠\n\nThis is exclusive to the crew who actually want to grow. Welcome to the crew 💛\n\n👉 Reply 'I'm following'");

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: {
        text: "Wait, you're not following the page yet? 🧠\n\nThis is exclusive to the crew who actually want to grow. Trust me, you won't regret following-you'll learn something new from every single post!\nwelcome to the crew 💛",
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
    return sendDM(target, "Wait, you're not following the page yet? 🧠\n\nPlease follow @vishalpanwarr first, then reply 'I'm following'");
  }
};

// Step 3: Sent when user clicks "I'm following ✓" (or already follows)
const sendFinalResourceButtonsDM = async (target, customMessage) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    const defaultText = customMessage || "Perfect! 🚀\nNow get the apply link 👇\n\n🔗 Apply Link: https://example.com/guide";

    if (!accountId || !accessToken) return sendDM(target, defaultText);

    let recipientObj = typeof target === 'string' ? { id: target } : target;

    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const response = await axios.post(url, {
      recipient: recipientObj,
      message: {
        text: "Perfect! 🚀\nNow get the apply link 👇\n\n📢 Daily Job update: https://example.com/jobs\n👟 Nike apply link: https://example.com/nike\n✈️ Cleartrip apply form: https://example.com/cleartrip"
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.warn('[Interactive DM] Final resource button fallback to text:', error?.response?.data || error.message);
    return sendDM(target, customMessage || "Perfect! 🚀\nNow get the apply link 👇\n\nhttps://example.com/guide");
  }
};

const checkFollowStatus = async (recipientId) => {
  console.log(`[MOCK FOLLOW CHECK] Checking if ${recipientId} follows... returning false initially.`);
  return false; 
};

module.exports = {
  sendDM,
  sendInitialButtonDM,
  sendNotFollowingButtonsDM,
  sendFinalResourceButtonsDM,
  checkFollowStatus
};
