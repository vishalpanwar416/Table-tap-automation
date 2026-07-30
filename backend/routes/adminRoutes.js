const express = require('express');
const router = express.Router();
const { getEvents, updateEventStatus, getConfig, updateConfig } = require('../controllers/adminController');

router.get('/events', getEvents);
router.put('/events/:id', updateEventStatus);

router.get('/config', getConfig);
router.put('/config', updateConfig);

module.exports = router;
