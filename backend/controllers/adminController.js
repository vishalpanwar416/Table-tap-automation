const createAdminController = ({ eventRepository, configRepository, automationService }) => ({
  async getEvents(req, res) {
    try {
      res.json(await eventRepository.listRecent());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateEventStatus(req, res) {
    try {
      const event = await eventRepository.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      if (req.body.status === 'completed') {
        await automationService.manuallyCompleteEvent(event);
      } else {
        event.status = req.body.status;
        event.updatedAt = new Date();
        await eventRepository.save(event);
      }

      return res.json(event);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async getConfig(req, res) {
    try {
      res.json(await configRepository.get());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateConfig(req, res) {
    try {
      res.json(await configRepository.update(req.body));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
});

module.exports = createAdminController;
