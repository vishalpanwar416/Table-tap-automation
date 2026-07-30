const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');

// --- Events ---
const getEvents = async (req, res) => {
  try {
    const events = await CommentEvent.find().sort({ createdAt: -1 }).limit(100);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedEvent = await CommentEvent.findByIdAndUpdate(
      id, 
      { status, updatedAt: Date.now() }, 
      { new: true }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Config ---
const getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      // Create default if not exists
      config = await AppConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    const configData = req.body;
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create(configData);
    } else {
      config = await AppConfig.findOneAndUpdate({}, { ...configData, updatedAt: Date.now() }, { new: true });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  updateEventStatus,
  getConfig,
  updateConfig
};
