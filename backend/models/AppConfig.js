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
  initialMessage: {
    type: String,
    default: "Hello jii 🤍 !\n\nI know exactly how valuable time is. That's why everything on my page is packed with free, premium value to help you level up.\n\nClick below and I'll send you the link in just a sec ✨"
  },
  notFollowingMessage: { 
    type: String, 
    default: "Wait, you're not following the page yet? 🧠\n\nThis is exclusive to the crew who actually want to grow. Trust me, you won't regret following-you'll learn something new from every single post!\nwelcome to the crew 💛" 
  },
  finalMessage: { 
    type: String, 
    default: "Perfect! 🚀\nNow get the apply link 👇\n\n📢 Daily Job update: https://example.com/jobs\n👟 Nike apply link: https://example.com/nike\n✈️ Cleartrip apply form: https://example.com/cleartrip" 
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
