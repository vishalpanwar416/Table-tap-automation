const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const NGROK_URL = process.env.NGROK_URL;
// v20.0 was retired in May 2026. Keep this configurable so deployments can
// move Graph versions without changing application code.
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';
const graphUrl = (path) => `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`;

router.get('/login', (req, res) => {
  const redirectUri = `${NGROK_URL}/api/auth/callback`;
  // Keep this list limited to permissions enabled for this Meta app. The
  // comment-management permission covers the public `/replies` operation.
  const scope = 'instagram_manage_messages,instagram_manage_comments,pages_show_list,pages_manage_metadata';
  const authUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  console.log(`[OAuth] Redirecting to Facebook login: ${authUrl}`);
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('[OAuth] Error from Facebook:', error);
    return res.send(`<h2>❌ Login failed: ${error}</h2>`);
  }

  if (!code) {
    return res.send('<h2>❌ No authorization code received.</h2>');
  }

  try {
    const redirectUri = `${NGROK_URL}/api/auth/callback`;

    const tokenRes = await axios.post(graphUrl('oauth/access_token'),
      new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: redirectUri,
        code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenRes.data;
    
    console.log('[OAuth] Access Token received. Fetching linked Facebook Pages and Instagram accounts...');

    const pagesRes = await axios.get(graphUrl(`me/accounts?fields=name,access_token,instagram_business_account&access_token=${access_token}`));
    const pages = pagesRes.data.data;
    
    console.log('[OAuth] Pages received:', JSON.stringify(pages, null, 2));
    
    let linkedPage = null;
    let instagramBusinessAccount = null;
    
    for (const page of pages) {
      if (page.instagram_business_account) {
        linkedPage = page;
        instagramBusinessAccount = page.instagram_business_account;
        break;
      }
    }
    
    if (!linkedPage && pages.length > 0) {
      linkedPage = pages[0];
      instagramBusinessAccount = pages[0].instagram_business_account || { id: process.env.INSTAGRAM_ACCOUNT_ID || '17841403475748124' };
    }
    
    if (!linkedPage) {
      return res.send(`
        <h2>❌ Authorization failed</h2>
        <p>No Facebook Page linked to an Instagram Business Account was found for this user.</p>
        <p>Please make sure your Instagram Business Account is linked to a Facebook Page.</p>
      `);
    }

    const pageAccessToken = linkedPage.access_token;
    const igAccountId = instagramBusinessAccount.id;
    
    let username = 'vishalpanwarr';
    try {
      const igUserRes = await axios.get(graphUrl(`${igAccountId}?fields=username&access_token=${pageAccessToken}`));
      if (igUserRes.data && igUserRes.data.username) {
        username = igUserRes.data.username;
      }
    } catch (e) {
      console.log('[OAuth] Could not fetch username, using fallback:', username);
    }

    console.log(`[OAuth] ✅ Instagram Account Authorized: @${username} (ID: ${igAccountId})`);
    
    try {
      // A Page subscription is required for Instagram messaging events when
      // using Facebook Login. `feed` covers Page feed activity.
      await axios.post(graphUrl(`${linkedPage.id}/subscribed_apps`), null, {
        params: { subscribed_fields: 'feed,messages,messaging_postbacks,message_reads', access_token: pageAccessToken }
      });
      console.log(`[OAuth] Subscribed Page (${linkedPage.id}) to webhooks.`);
    } catch (subErr) {
      console.warn('[OAuth] Could not subscribe Page to webhooks:', subErr?.response?.data || subErr.message);
    }

    try {
      // This is the production-critical subscription for comment deliveries.
      // Sending dashboard test events only proves the callback URL works; Meta
      // sends real comments only after the professional account is subscribed.
      await axios.post(graphUrl(`${igAccountId}/subscribed_apps`), null, {
        params: { subscribed_fields: 'comments,messages,messaging_postbacks', access_token: pageAccessToken }
      });
      console.log(`[OAuth] Subscribed Instagram account (${igAccountId}) to comments and messaging webhooks.`);
    } catch (subErr) {
      console.warn('[OAuth] Could not subscribe Instagram account to comment webhooks:', subErr?.response?.data || subErr.message);
    }
    
    process.env.INSTAGRAM_ACCESS_TOKEN = pageAccessToken;
    process.env.INSTAGRAM_ACCOUNT_ID = igAccountId;
    
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/INSTAGRAM_ACCESS_TOKEN=.*/, `INSTAGRAM_ACCESS_TOKEN=${pageAccessToken}`);
    envContent = envContent.replace(/INSTAGRAM_ACCOUNT_ID=.*/, `INSTAGRAM_ACCOUNT_ID=${igAccountId}`);
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`[OAuth] Successfully updated .env file with new INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID.`);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; }
          .check { font-size: 60px; }
          h2 { color: #1a1a1a; }
          p { color: #666; }
          .username { font-weight: bold; color: #E1306C; font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="check">✅</div>
          <h2>Authorization Successful!</h2>
          <p>Instagram account</p>
          <p class="username">@${username}</p>
          <p>has been authorized. Your backend is now updated. You can close this page.</p>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('[OAuth] Token exchange failed:', err?.response?.data || err.message);
    res.send(`<h2>❌ Token exchange failed. Check server logs.</h2>`);
  }
});

module.exports = router;
