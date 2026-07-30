const cron = require('node-cron');
const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const { sendDM, checkFollowStatus } = require('./instagramService');
const EventService = require('./eventService');
const ConfigurationService = require('./configurationService');

const eventService = new EventService(CommentEvent);
const configurationService = new ConfigurationService(AppConfig);

const startQueueService = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Queue Service] Running scheduled check for awaiting_follow events...');
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pendingEvents = await eventService.findAwaitingFollow({
        olderThan: tenMinutesAgo,
        newerThan: oneDayAgo
      });

      if (pendingEvents.length === 0) return;

      const config = await configurationService.get();

      for (const event of pendingEvents) {
        const isFollowing = await checkFollowStatus(event.instagramUserId);
        
        if (isFollowing) {
          console.log(`[Queue Service] User ${event.instagramUserId} is now following. Sending final DM.`);
          await sendDM(event.instagramUserId, config.finalMessage);
          
          await eventService.markCompleted(event, true);
        }
      }
    } catch (error) {
      console.error('[Queue Service] Error running check:', error);
    }
  });
};

module.exports = { startQueueService };
