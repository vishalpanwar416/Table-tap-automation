const express = require('express');
const createAdminRoutes = (controller) => {
  const router = express.Router();

  router.get('/events', controller.getEvents);
  router.put('/events/:id', controller.updateEventStatus);

  router.get('/config', controller.getConfig);
  router.put('/config', controller.updateConfig);

  return router;
};

module.exports = createAdminRoutes;
