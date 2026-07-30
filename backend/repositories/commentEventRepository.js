class CommentEventRepository {
  constructor(CommentEvent) {
    this.CommentEvent = CommentEvent;
  }

  listRecent(limit = 100) {
    return this.CommentEvent.find().sort({ createdAt: -1 }).limit(limit);
  }

  findById(id) {
    return this.CommentEvent.findById(id);
  }

  findLatestByInstagramUserId(instagramUserId) {
    return this.CommentEvent.findOne({ instagramUserId: String(instagramUserId) }).sort({ createdAt: -1 });
  }

  findAwaitingFollowBetween({ newerThan, olderThan }) {
    return this.CommentEvent.find({
      status: 'awaiting_follow',
      createdAt: { $gt: newerThan, $lt: olderThan }
    });
  }

  create(values) {
    return this.CommentEvent.create(values);
  }

  save(event) {
    return event.save();
  }
}

module.exports = CommentEventRepository;
