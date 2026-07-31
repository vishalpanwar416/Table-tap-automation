const mongoose = require('mongoose');

const commentEventSchema = new mongoose.Schema({
  instagramUserId: { type: String, required: true },
  username: { type: String, required: true },
  commentText: { type: String, required: true },
  commentId: { type: String },
  mediaId: { type: String, required: true },
  isFollowing: { type: Boolean, default: false },
  followedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'dm_sent', 'awaiting_follow', 'completed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommentEvent', commentEventSchema);
