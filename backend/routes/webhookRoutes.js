const express = require('express');
const createWebhookRoutes = (controller) => {
  const router = express.Router();

  router.get('/', controller.verifyWebhook);
  router.post('/', controller.handleWebhookEvent);

  return router;
};

module.exports = createWebhookRoutes;
