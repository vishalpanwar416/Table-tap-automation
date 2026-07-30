const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const EventService = require('../services/eventService');
const ConfigurationService = require('../services/configurationService');
const { sendDM } = require('../services/instagramService');

const eventService = new EventService(CommentEvent);
const configurationService = new ConfigurationService(AppConfig);

const getEvents = async (req, res) => {
  try {
    res.json(await eventService.listRecent());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEventStatus = async (req, res) => {
  try {
    const event = await eventService.updateStatus(req.params.id, req.body.status);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status === 'completed') {
      const config = await configurationService.get();
      try {
        await sendDM(event.instagramUserId, config.finalMessage);
      } catch (error) {
        console.error('[Admin] DM send error:', error?.response?.data || error.message);
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConfig = async (req, res) => {
  try {
    res.json(await configurationService.get());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    res.json(await configurationService.update(req.body));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEvents, updateEventStatus, getConfig, updateConfig };
