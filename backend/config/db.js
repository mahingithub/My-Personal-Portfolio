// ============================================
// 📦 MongoDB Database Connection
// ============================================
const mongoose = require('mongoose');

// Fail fast instead of queueing queries for 10s while the database is down.
mongoose.set('bufferCommands', false);

const RETRY_DELAY = 15000;

/**
 * Connect to MongoDB Atlas (or local MongoDB)
 * Uses the MONGODB_URI from your .env file.
 *
 * The server keeps running if the database is unreachable (the contact form
 * falls back to email) and keeps retrying in the background, instead of
 * exiting and leaving the whole site down.
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set; messages will only be emailed.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`   Retrying in ${RETRY_DELAY / 1000}s...`);
    setTimeout(connectDB, RETRY_DELAY);
  }
};

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
