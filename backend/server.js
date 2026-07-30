const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const webhookRoutes = require('./routes/webhookRoutes');

const adminRoutes = require('./routes/adminRoutes');
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

app.get('/', (req, res) => {
  res.send('Instagram Comment-to-DM Automation API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
