const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  triggerMode: { 
    type: String, 
    enum: ['keyword', 'any'], 
    default: 'keyword' 
  },
  keywords: { 
    type: String, 
    default: 'link, table, tap, order, menu' 
  },
  initialMessage: {
    type: String,
    default: "Hey there! 🍽️✨\n\nThanks for reaching out! Table-Tap makes dining out seamless, fast, and interactive.\n\nClick below and I'll send you your exclusive access link in just a sec! 👇"
  },
  notFollowingMessage: { 
    type: String, 
    default: "Wait, you're not following us yet? 🍕\n\nWe share exclusive food deals, secret dining spots, and instant restaurant updates. Hit follow below and join the Table-Tap family! 💛" 
  },
  finalMessage: { 
    type: String, 
    default: "Awesome! Welcome aboard! 🚀\nHere is your official Table-Tap link 👇\n\n👉 Visit Table-Tap: https://table-tap.in\n📱 Instant Menu & Ordering: https://table-tap.in\n🔥 Exclusive Dining Deals: https://table-tap.in" 
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
