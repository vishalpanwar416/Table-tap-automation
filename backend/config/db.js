const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // We don't exit process here strictly for local dev convenience, 
    // but in prod you might want to process.exit(1).
  }
};

module.exports = connectDB;
