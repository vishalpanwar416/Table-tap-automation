# Table-Tap Instagram comment automation

This MERN application turns an eligible Instagram comment into a direct-message
flow. The React dashboard configures triggers and messages, while the Express
service receives Meta webhooks, stores comment events in MongoDB, and sends the
appropriate Instagram message.

## Run locally

1. Create `backend/.env` with the values below.
2. Start MongoDB.
3. Run `npm start` in `backend` and `npm run dev` in `frontend`.
4. Set `VITE_API_URL=http://localhost:5000/api/admin` for the frontend when
   running it outside the configured Vite proxy.
5. Expose the backend publicly (for example with ngrok) and configure Meta to
   call `https://<public-host>/api/webhook`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tabletap
META_VERIFY_TOKEN=replace-with-a-random-value
INSTAGRAM_APP_SECRET=your-meta-app-secret
INSTAGRAM_APP_ID=your-meta-app-id
META_GRAPH_API_VERSION=v23.0
INSTAGRAM_ACCESS_TOKEN=page-access-token
INSTAGRAM_ACCOUNT_ID=instagram-business-account-id
NGROK_URL=https://your-public-host
```

The webhook verifies Meta's `hub.challenge` on `GET`, and validates
`X-Hub-Signature-256` on `POST` whenever `INSTAGRAM_APP_SECRET` is configured.
The frontend production build is written to `frontend/dist` with `npm run build`.

## Receiving real Instagram comments

A successful **Test** delivery in Meta proves only that the callback URL is
reachable. For real comments, the Instagram professional account must also be
subscribed to the app and the app must have the `comments` webhook field enabled
under the **Instagram** object in Meta's Webhooks dashboard.

After deploying this version, reconnect the account through `/api/auth/login`.
The callback subscribes both the linked Facebook Page and the Instagram
professional account (`comments`, `messages`, and `messaging_postbacks`). Ensure
the deployed environment has a current page access token, the matching app
secret, and `META_GRAPH_API_VERSION` set to a supported Graph API version.

## Automation flow

- A comments webhook is matched against the configured keyword or `any` mode.
- The app sends an initial DM containing a “Send me the link” quick reply and
  records an `awaiting_follow` event.
- If the recipient confirms the follow action, the final resource message is
  sent and the event is marked `completed`.
- A cron job reviews awaiting events every five minutes, beginning after ten
  minutes and stopping after 24 hours. Since Instagram does not expose a
  supported arbitrary-user follower lookup, completion happens through the
  explicit “I'm following” quick reply or the dashboard override.
- The dashboard refreshes event data every three seconds; an administrator can
  also set an event to `completed` through `PUT /api/admin/events/:id`.

## Meta API constraints

Instagram's Graph API does **not** offer a supported general-purpose endpoint
that reliably answers whether an arbitrary person follows a Business or Creator
account. The app therefore treats the explicit “I'm following” quick reply as
the reliable confirmation path and keeps the periodic check as a best-effort
fallback where the connected app has access to follower data. This tradeoff is
intentional and should be presented transparently to users.

Instagram messaging also requires an eligible messaging conversation and is
subject to Meta's 24-hour messaging window and applicable message-tag policies.
Before production use, ensure the app has the needed approved permissions,
webhook subscriptions, and a compliant messaging policy.

## Backend structure

`server.js` is the composition root: it creates repositories, the Instagram
gateway, and application services in `config/container.js`. Controllers only
translate HTTP requests and responses. The automation and follow-up services
depend on small repository/gateway contracts, so their behavior is covered by
fast Node tests without a database or network connection.
