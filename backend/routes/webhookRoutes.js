const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhookEvent } = require('../controllers/webhookController');

// Meta Webhook Verification endpoint (GET)
router.get('/', verifyWebhook);

// Meta Webhook Event Receiver endpoint (POST)
router.post('/', handleWebhookEvent);

module.exports = router;
