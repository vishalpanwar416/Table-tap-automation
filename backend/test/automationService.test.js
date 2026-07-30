const test = require('node:test');
const assert = require('node:assert/strict');
const AutomationService = require('../services/automationService');
const TriggerService = require('../services/triggerService');

const createEventRepository = () => {
  const events = [];
  return {
    events,
    async create(values) {
      const event = { ...values, status: 'pending', saveCount: 0 };
      events.push(event);
      return event;
    },
    async save(event) {
      event.saveCount += 1;
      return event;
    },
    async findLatestByInstagramUserId(userId) {
      return events.find((event) => event.instagramUserId === userId);
    }
  };
};

const createService = ({ config, gateway, events = createEventRepository() }) => ({
  events,
  service: new AutomationService({
    eventRepository: events,
    configRepository: { get: async () => config },
    instagramGateway: gateway,
    triggerService: new TriggerService(),
    accountId: 'business-account'
  })
});

test('creates an event and starts a DM flow for a matching comment', async () => {
  const gateway = { sendInitialReply: async () => {} };
  const { service, events } = createService({ config: { triggerMode: 'keyword', keywords: 'link, menu' }, gateway });

  await service.handleComment({
    from: { id: 'user-1', username: 'alex' },
    media_id: 'post-1',
    text: 'Please send the LINK'
  }, { triggerMode: 'keyword', keywords: 'link, menu' });

  assert.equal(events.events.length, 1);
  assert.equal(events.events[0].status, 'awaiting_follow');
  assert.equal(events.events[0].saveCount, 2);
});

test('ignores comments that do not match the configured keywords', async () => {
  const gateway = { sendInitialReply: async () => assert.fail('should not send') };
  const { service, events } = createService({ config: { triggerMode: 'keyword', keywords: 'link' }, gateway });

  await service.handleComment({ from: { id: 'user-1' }, media_id: 'post-1', text: 'Nice photo' }, { triggerMode: 'keyword', keywords: 'link' });

  assert.equal(events.events.length, 0);
});

test('delivers the resource when a known follower requests the link', async () => {
  const events = createEventRepository();
  const event = await events.create({ instagramUserId: 'user-1', isFollowing: true });
  const deliveredTo = [];
  const { service } = createService({
    config: { finalMessage: 'Here is your link' },
    events,
    gateway: { sendFinalResource: async (id) => deliveredTo.push(id) }
  });

  await service.handleInteraction({ sender: { id: 'user-1' }, postback: { payload: 'SEND_LINK_CLICKED' } }, { finalMessage: 'Here is your link' });

  assert.deepEqual(deliveredTo, ['user-1']);
  assert.equal(event.status, 'completed');
});
