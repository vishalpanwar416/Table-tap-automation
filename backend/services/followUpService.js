class FollowUpService {
  constructor({ eventRepository, configRepository, instagramGateway, clock = () => new Date() }) {
    this.eventRepository = eventRepository;
    this.configRepository = configRepository;
    this.instagramGateway = instagramGateway;
    this.clock = clock;
  }

  async processAwaitingFollows() {
    const now = this.clock();
    const events = await this.eventRepository.findAwaitingFollowBetween({
      newerThan: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      olderThan: new Date(now.getTime() - 10 * 60 * 1000)
    });

    if (events.length === 0) return 0;

    const config = await this.configRepository.get();
    let completed = 0;

    for (const event of events) {
      if (!await this.instagramGateway.isFollowing(event.instagramUserId, event.username)) continue;

      await this.instagramGateway.sendFinalResource(event.instagramUserId, config.finalMessage);
      event.isFollowing = true;
      event.followedAt = now;
      event.status = 'completed';
      event.updatedAt = now;
      await this.eventRepository.save(event);
      completed += 1;
    }

    return completed;
  }
}

module.exports = FollowUpService;
