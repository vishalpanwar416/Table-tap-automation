const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const webhookRoutes = require('./routes/webhookRoutes');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const { startQueueService } = require('./services/queueService');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Background Queue Service
startQueueService();

// Middleware
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cors());

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Instagram Comment-to-DM Automation API is running...');
});

app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Privacy Policy - AutoDM</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6;">
        <h1>Privacy Policy</h1>
        <p>AutoDM respects your privacy. We process Instagram comments and messages solely to deliver automated direct responses requested by users.</p>
        <p>We do not store, sell, or share personal user data with third parties.</p>
        <p>Contact: support@autodm.local</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
