const test = require('node:test');
const assert = require('node:assert/strict');
const FollowUpService = require('../services/followUpService');

test('completes only events whose follower status can be verified', async () => {
  const followingEvent = { instagramUserId: 'following', username: 'alex', status: 'awaiting_follow' };
  const waitingEvent = { instagramUserId: 'waiting', username: 'sam', status: 'awaiting_follow' };
  const saved = [];
  const sent = [];
  const now = new Date('2026-07-31T00:00:00.000Z');
  const service = new FollowUpService({
    eventRepository: {
      findAwaitingFollowBetween: async () => [followingEvent, waitingEvent],
      save: async (event) => saved.push(event)
    },
    configRepository: { get: async () => ({ finalMessage: 'Your resource' }) },
    instagramGateway: {
      isFollowing: async (id) => id === 'following',
      sendFinalResource: async (id, message) => sent.push({ id, message })
    },
    clock: () => now
  });

  const completed = await service.processAwaitingFollows();

  assert.equal(completed, 1);
  assert.equal(followingEvent.status, 'completed');
  assert.equal(followingEvent.isFollowing, true);
  assert.equal(waitingEvent.status, 'awaiting_follow');
  assert.deepEqual(sent, [{ id: 'following', message: 'Your resource' }]);
  assert.deepEqual(saved, [followingEvent]);
});
