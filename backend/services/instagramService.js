const axios = require('axios');

const sendDM = async (recipientId, text) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    // If the account ID isn't configured yet, just mock the successful response
    if (!accountId) {
      console.log(`[MOCK DM] To: ${recipientId}, Text: "${text}"`);
      return { message_id: 'mock_msg_' + Date.now() };
    }

    const url = `https://graph.facebook.com/v19.0/${accountId}/messages`;
    const response = await axios.post(url, {
      recipient: { id: recipientId },
      message: { text }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`[REAL DM] Sent to ${recipientId} successfully.`);
    return response.data;
  } catch (error) {
    console.error('Failed to send Instagram DM:', error?.response?.data || error.message);
    throw error;
  }
};

const checkFollowStatus = async (recipientId) => {
  // As noted in the task requirements, Instagram Graph API does not expose a direct 
  // "does user X follow me" endpoint for non-authenticated arbitrary users.
  // We mock this check for the backend flow. In production, this can be 
  // resolved via the Manual "Mark as Followed" override in the dashboard, 
  // or by checking available messaging webhook context if supported by Meta.
  
  console.log(`[MOCK FOLLOW CHECK] Checking if ${recipientId} follows... returning false initially.`);
  return false; 
};

module.exports = {
  sendDM,
  checkFollowStatus
};
