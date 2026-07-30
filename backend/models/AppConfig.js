const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  triggerMode: { 
    type: String, 
    enum: ['keyword', 'any'], 
    default: 'keyword' 
  },
  keywords: { 
    type: String, 
    default: 'link, guide, send' 
  },
  notFollowingMessage: { 
    type: String, 
    default: 'Hey! Thanks for the interest. Please follow our page first, and I will automatically send you the link! 🚀' 
  },
  finalMessage: { 
    type: String, 
    default: 'Here is the link you requested: https://example.com/guide 👇' 
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
