class EventService {
  constructor(EventModel) {
    this.EventModel = EventModel;
  }

  listRecent(limit = 100) {
    return this.EventModel.find().sort({ createdAt: -1 }).limit(limit);
  }

  findLatestForUser(instagramUserId) {
    return this.EventModel.findOne({ instagramUserId }).sort({ createdAt: -1 });
  }

  createCommentEvent({ instagramUserId, username, commentText, mediaId }) {
    return this.EventModel.create({
      instagramUserId,
      username,
      commentText,
      mediaId,
      isFollowing: false,
      status: 'awaiting_follow'
    });
  }

  async markCompleted(event, followed = false) {
    if (!event) return null;
    event.status = 'completed';
    event.updatedAt = new Date();
    if (followed) {
      event.isFollowing = true;
      event.followedAt = new Date();
    }
    return event.save();
  }

  async updateStatus(id, status) {
    const event = await this.EventModel.findById(id);
    if (!event) return null;
    event.status = status;
    event.updatedAt = new Date();
    return event.save();
  }

  findAwaitingFollow({ olderThan, newerThan }) {
    return this.EventModel.find({
      status: 'awaiting_follow',
      createdAt: { $lt: olderThan, $gt: newerThan }
    });
  }

  async isFollowing(instagramUserId, username) {
    const event = await this.EventModel.findOne({
      $or: [{ instagramUserId: String(instagramUserId) }, { username: String(username) }]
    }).sort({ createdAt: -1 });
    return event?.isFollowing === true;
  }
}

module.exports = EventService;
