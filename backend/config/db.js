// ============================================
// 📦 MongoDB Database Connection
// ============================================
const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas (or local MongoDB)
 * Uses the MONGODB_URI from your .env file
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure if DB can't connect
    process.exit(1);
  }
};

module.exports = connectDB;
