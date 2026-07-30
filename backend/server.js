const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const createWebhookRoutes = require('./routes/webhookRoutes');
const createAdminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const { startQueueService } = require('./services/queueService');
const createContainer = require('./config/container');
const createAdminController = require('./controllers/adminController');
const { createWebhookController } = require('./controllers/webhookController');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
const container = createContainer();
startQueueService(container.followUpService);

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const adminController = createAdminController(container);
const webhookController = createWebhookController({
  automationService: container.automationService,
  verifyToken: process.env.META_VERIFY_TOKEN,
  appSecret: process.env.INSTAGRAM_APP_SECRET
});
app.use('/api/webhook', createWebhookRoutes(webhookController));
app.use('/api/admin', createAdminRoutes(adminController));
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Privacy Policy · AutoDM</title><style>body{margin:0;background:#f7f7fc;color:#20202a;font:16px/1.7 Inter,ui-sans-serif,system-ui,sans-serif}.page{max-width:720px;margin:72px auto;padding:0 24px}.mark{display:inline-flex;align-items:center;gap:9px;color:#5b36e8;font-weight:800;letter-spacing:-.03em}.dot{width:11px;height:11px;background:#ff5d83;border-radius:50%;box-shadow:12px 0 #ffb648}article{margin-top:28px;padding:42px;background:#fff;border:1px solid #ececf3;border-radius:24px;box-shadow:0 20px 55px #3232560d}h1{font-size:38px;line-height:1.1;letter-spacing:-.06em;margin:0 0 22px}p{color:#626273}footer{font-size:13px;color:#8e8e9d;margin:24px 4px}</style></head>
      <body><main class="page"><div class="mark"><span class="dot"></span> AutoDM</div><article><h1>Your privacy matters.</h1><p>AutoDM processes Instagram comments and messages solely to deliver the automated direct responses requested by users.</p><p>We do not sell or share personal data with third parties.</p><p>Questions? Contact support@autodm.local.</p></article><footer>Last updated July 2026</footer></main>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
