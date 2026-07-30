const AppConfig = require('../models/AppConfig');
const CommentEvent = require('../models/CommentEvent');
const ConfigRepository = require('../repositories/configRepository');
const CommentEventRepository = require('../repositories/commentEventRepository');
const TriggerService = require('../services/triggerService');
const AutomationService = require('../services/automationService');
const FollowUpService = require('../services/followUpService');
const InstagramGateway = require('../services/instagramService');

const createContainer = () => {
  const configRepository = new ConfigRepository(AppConfig);
  const eventRepository = new CommentEventRepository(CommentEvent);
  const instagramGateway = new InstagramGateway({
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID
  });

  return {
    configRepository,
    eventRepository,
    automationService: new AutomationService({
      eventRepository,
      configRepository,
      instagramGateway,
      triggerService: new TriggerService(),
      accountId: process.env.INSTAGRAM_ACCOUNT_ID
    }),
    followUpService: new FollowUpService({ eventRepository, configRepository, instagramGateway })
  };
};

module.exports = createContainer;
