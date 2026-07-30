const cron = require('node-cron');
const CommentEvent = require('../models/CommentEvent');
const AppConfig = require('../models/AppConfig');
const { sendDM, checkFollowStatus } = require('./instagramService');

const startQueueService = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Queue Service] Running scheduled check for awaiting_follow events...');
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find events waiting for follow, older than 10 mins, but not older than 24 hours
      const pendingEvents = await CommentEvent.find({
        status: 'awaiting_follow',
        createdAt: { $lt: tenMinutesAgo, $gt: oneDayAgo }
      });

      if (pendingEvents.length === 0) return;

      const config = await AppConfig.findOne();
      if (!config) return;

      for (const event of pendingEvents) {
        const isFollowing = await checkFollowStatus(event.instagramUserId);
        
        if (isFollowing) {
          console.log(`[Queue Service] User ${event.instagramUserId} is now following. Sending final DM.`);
          await sendDM(event.instagramUserId, config.finalMessage);
          
          event.status = 'completed';
          event.updatedAt = Date.now();
          await event.save();
        } else {
          // Still not following. Will check again next cycle until 24 hrs pass.
        }
      }
    } catch (error) {
      console.error('[Queue Service] Error running check:', error);
    }
  });
};

module.exports = { startQueueService };
