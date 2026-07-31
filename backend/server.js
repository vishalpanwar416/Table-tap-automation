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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
