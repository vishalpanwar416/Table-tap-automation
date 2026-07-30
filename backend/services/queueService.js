const cron = require('node-cron');

const startQueueService = (followUpService, schedule = cron.schedule) => (
  schedule('*/5 * * * *', async () => {
    try {
      const completed = await followUpService.processAwaitingFollows();
      if (completed) console.log(`[Follow-up queue] Completed ${completed} event(s).`);
    } catch (error) {
      console.error('[Follow-up queue] Processing failed:', error);
    }
  })
);

module.exports = { startQueueService };
