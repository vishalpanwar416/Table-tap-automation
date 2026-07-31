# Table-Tap Instagram Comment Automation — Working & Architecture

## 1. What this application does

Table-Tap automates an Instagram lead-capture flow.

When somebody comments on an Instagram post, the backend checks whether the comment matches a configured trigger. For eligible comments, it sends the person a direct message (DM) with a **Send me the link** action. The user is then asked to confirm that they follow the account. After confirmation, the application sends the final Table-Tap resource/link and records the completed conversion.

The React dashboard lets an administrator configure this flow and view its results.

## 2. Technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Dashboard | React 19, Vite, React Router, Axios, Lucide icons | Configuration, live activity, and analytics UI |
| API/backend | Node.js, Express 5 | HTTP API, Meta webhook endpoint, OAuth callback |
| Database | MongoDB with Mongoose | Persists configuration and individual comment events |
| External integration | Meta Graph API / Instagram Messaging | Receives Instagram events and sends DMs |
| Scheduled processing | `node-cron` | Reviews awaiting follow events every 5 minutes |
| Deployment config | Vercel | Builds and serves the frontend SPA |

## 3. High-level architecture

```text
 Instagram user
      │ comments / taps quick reply
      ▼
 Meta / Instagram webhooks
      │ POST /api/webhook
      ▼
 Express backend ───────────────► Meta Graph API
      │                                  │
      │                                  └── sends Instagram DMs
      │
      ├── AutomationService
      ├── FollowUpService (cron)
      └── repositories
              │
              ▼
           MongoDB
              ▲
              │ REST API: /api/admin
              │
 React dashboard ────────────────┘
```

The backend is deliberately split into small layers:

```text
Routes → Controllers → Services → Repositories / Instagram Gateway → MongoDB or Meta API
```

- **Routes** define URLs and connect them to controllers.
- **Controllers** translate HTTP requests into service calls and HTTP responses.
- **Services** contain the business rules for matching comments, progressing the DM flow, and follow-up processing.
- **Repositories** isolate MongoDB queries.
- **InstagramGateway** isolates Graph API messaging calls.

This separation makes the core automation logic testable without calling MongoDB or Meta.

## 4. Main user flow

### Comment-to-DM journey

```text
1. User comments on an Instagram post
          │
2. Meta sends a signed webhook to this backend
          │
3. Backend validates it and checks the comment trigger
          │
          ├─ not eligible → ignore it
          │
          └─ eligible → create a CommentEvent in MongoDB
                         │
4. Send initial DM: “Send me the link” quick reply
                         │
5. Event moves: pending → dm_sent → awaiting_follow
                         │
6. User interacts with the DM
    ├─ “Send me the link” while not marked as following
    │      → send follow prompt with “I'm following ✓”
    │
    └─ “I'm following ✓”
           → send final resource message
           → mark event completed and record follow time
```

### Detailed processing steps

1. Meta delivers an Instagram `comments` webhook to `POST /api/webhook`.
2. The webhook controller only accepts payloads whose `object` is `instagram`.
3. When an app secret is configured, the controller verifies the `X-Hub-Signature-256` HMAC SHA-256 signature using the raw request body.
4. `AutomationService.processWebhook()` loads the current configuration from MongoDB.
5. `TriggerService` matches the comment against the selected rule:
   - `any`: every comment is eligible.
   - `keyword`: the comment must contain at least one comma-separated configured keyword, case-insensitively.
6. The service ignores malformed comments, comments without a media ID, and comments written by the business account itself.
7. A new event is stored, then the initial Instagram DM is sent.
8. A later messaging webhook carries either a quick-reply payload or message text. The service finds that Instagram user's most recent event and advances the conversation.

## 5. DM conversation states

| State | Meaning | How it is reached |
| --- | --- | --- |
| `pending` | Comment event was created | Default database value |
| `dm_sent` | Initial DM was sent | Immediately after Graph API send succeeds |
| `awaiting_follow` | Waiting for user confirmation | Immediately after `dm_sent` |
| `completed` | Final resource was delivered | “I'm following” reply, verified follow-up, or admin override |

The most reliable completion path is the **I'm following ✓** quick reply. A dashboard administrator can also manually complete an event; this sends the final resource and records the user as following.

## 6. Follow-up job and Instagram limitation

At application startup, a cron job is scheduled for every five minutes.

```text
Every 5 minutes
  └─ find events that are:
       - still awaiting_follow
       - more than 10 minutes old
       - less than 24 hours old
  └─ check whether each user follows the account
  └─ send final message and complete verified events
```

The current `InstagramGateway.isFollowing()` intentionally returns `false`, so the scheduled job currently does not auto-complete real events.

This is an implementation gap, not an absolute Meta API restriction. Meta does **not** expose a `/followers` endpoint that lets an application download or search the account's complete follower list. It does, however, provide a supported **per-user** relationship field, `is_user_follow_business`, through the Instagram User Profile API. The backend can query that field using the user's Instagram-scoped ID (IGSID) and the business account's messaging access token.

There is an important condition: Meta requires messaging consent before the application can retrieve that user's profile. Consent is available after the person sends the business a message or clicks an icebreaker/persistent-menu action. A comment alone does not grant this profile-access consent. Therefore the robust product flow is: receive the comment, begin/continue an eligible messaging conversation, then call the per-user profile lookup and use `is_user_follow_business` for the follow check. Until that lookup is implemented, this application relies on the user’s explicit quick reply or a manual dashboard override.

## 7. Frontend architecture

The frontend is a single-page React application with three routes:

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `Dashboard` | Summary metrics, new followers, comments by post, recent comments |
| `/activity` | `Activity` | Full recent event table and automation status |
| `/settings` | `Settings` | Trigger mode, keywords, and all DM message templates |

### Live data behavior

The shared `useEvents` hook fetches `GET /api/admin/events` every 3 seconds. Both Dashboard and Activity use it, so the UI updates shortly after new webhook events are saved.

The dashboard derives analytics in the browser:

- total comments = number of stored events;
- new followers = unique Instagram users whose event has `isFollowing: true`;
- follow conversion = unique followers ÷ all events;
- comments by post = events grouped by `mediaId`.

Configuration is loaded from and saved to `GET`/`PUT /api/admin/config`.

## 8. Backend API surface

| Method | Endpoint | Responsibility |
| --- | --- | --- |
| `GET` | `/api/webhook` | Meta webhook verification challenge |
| `POST` | `/api/webhook` | Receives Instagram comment and messaging events |
| `GET` | `/api/admin/events` | Returns up to 100 recent comment events |
| `PUT` | `/api/admin/events/:id` | Updates an event; `completed` triggers final DM delivery |
| `GET` | `/api/admin/config` | Returns the single automation configuration |
| `PUT` | `/api/admin/config` | Updates trigger and message settings |
| `GET` | `/api/auth/login` | Starts Facebook/Instagram OAuth authorization |
| `GET` | `/api/auth/callback` | Exchanges OAuth code, discovers linked accounts, and subscribes webhooks |

## 9. Data model

### `AppConfig`

There is one configuration document. It is created automatically on the first read.

| Field | Description |
| --- | --- |
| `triggerMode` | `keyword` or `any` |
| `keywords` | Comma-separated trigger words |
| `initialMessage` | First DM text |
| `notFollowingMessage` | Prompt sent before follow confirmation |
| `finalMessage` | Link/resource message sent on completion |
| `updatedAt` | Last configuration edit time |

### `CommentEvent`

One document represents one eligible Instagram comment.

| Field | Description |
| --- | --- |
| `instagramUserId` | Instagram sender identifier |
| `username` | Username captured from comment data |
| `commentText` | Original eligible comment |
| `mediaId` | Post/reel identifier on which it was made |
| `isFollowing` | Follow confirmation flag |
| `followedAt` | When the user was marked as following |
| `status` | Current automation state |
| `createdAt`, `updatedAt` | Event timestamps |

## 10. Meta authorization and subscriptions

The `/api/auth/login` route starts Facebook Login with permissions for Instagram messaging, Instagram comments, page listing, and page metadata.

The OAuth callback:

1. exchanges the authorization code for an access token;
2. retrieves Facebook Pages and their linked Instagram professional accounts;
3. selects a linked Page/Instagram account;
4. subscribes the Page to relevant Page webhook fields;
5. subscribes the Instagram account to `comments`, `messages`, and `messaging_postbacks`;
6. saves the Page access token and Instagram account ID to backend environment values and `backend/.env`.

For production, the callback URL must be publicly reachable by Meta and the Instagram account must be a linked Business or Creator account.

## 11. Key security and reliability decisions

- Webhook signatures are checked with HMAC SHA-256 and a timing-safe comparison when `INSTAGRAM_APP_SECRET` is set.
- The webhook acknowledges Meta promptly with `200 EVENT_RECEIVED`, then processes the payload asynchronously to reduce retry risk.
- The backend uses raw request bytes for signature validation.
- The dashboard is configured to call a production admin API by default, but can use `VITE_API_URL` for another environment.
- If Instagram credentials are absent, the messaging gateway uses a mock response and logs the DM. This supports local development.
- If Meta rejects a message containing quick replies, the gateway retries once with the plain text message.
- Service-level Node tests cover trigger processing, completion behavior, scheduled follow-up behavior, and webhook signature checking.

## 12. Environment configuration

Create `backend/.env` with values such as:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tabletap
META_VERIFY_TOKEN=choose-a-random-verification-token
INSTAGRAM_APP_SECRET=meta-app-secret
INSTAGRAM_APP_ID=meta-app-id
META_GRAPH_API_VERSION=v23.0
INSTAGRAM_ACCESS_TOKEN=page-access-token
INSTAGRAM_ACCOUNT_ID=instagram-business-account-id
NGROK_URL=https://public-backend-host
```

Never commit actual access tokens or app secrets.

## 13. Running locally

1. Start MongoDB.
2. Create and populate `backend/.env`.
3. In `backend`, install packages and run `npm start`.
4. In `frontend`, install packages and run `npm run dev`.
5. Set `VITE_API_URL=http://localhost:5000/api/admin` when the frontend is running outside a proxy configuration.
6. Expose the backend through a public HTTPS URL (for example, ngrok) and configure Meta to use `<public-url>/api/webhook`.
7. Visit `/api/auth/login` on the backend to authorize and subscribe the connected Instagram account.

Useful verification commands:

```bash
cd backend && npm test
cd frontend && npm run build
```

## 14. Short explanation for a presentation

> Table-Tap is a MERN-based Instagram comment automation platform. An administrator configures comment triggers and DM templates in a React dashboard. When Meta notifies our Express backend that someone has commented, the system validates the webhook, checks the configured keywords, stores the lead in MongoDB, and starts a direct-message flow through the Instagram Graph API. The user confirms they follow the account using a quick reply, after which the resource link is delivered and the event is marked as completed. The dashboard refreshes every three seconds to show comments, followers, conversion, and post-level activity. The code is layered into routes, controllers, services, repositories, and an Instagram API gateway so that the business logic is maintainable and testable.

## 15. Current constraints and future improvements

- Meta does not provide a follower-list endpoint, but it does provide `is_user_follow_business` for an individual user with messaging consent. Implement this lookup in `InstagramGateway.isFollowing()` to replace the current `false` placeholder.
- The app currently polls the admin API every 3 seconds; WebSockets or Server-Sent Events could provide more efficient real-time updates.
- Comment webhook deliveries could be made idempotent by storing Meta’s comment ID and enforcing a unique index, preventing duplicate automation if a webhook is retried.
- Authentication and role-based access control should protect the admin endpoints before public production use.
- OAuth credentials are written to `.env` by the callback; a production deployment should store refreshed credentials in a dedicated secret manager/database rather than a local file.
- Production use requires appropriate Meta app permissions, valid webhook subscriptions, and compliance with the Instagram 24-hour messaging window and relevant message policies.
