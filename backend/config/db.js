// ============================================
// 📦 MongoDB Database Connection
// ============================================
const mongoose = require('mongoose');

// Fail fast instead of queueing queries for 10s while the database is down.
mongoose.set('bufferCommands', false);

const RETRY_DELAY = 15000;
// Why the last connection attempt failed, shown to the admin (not to visitors).
let lastError = '';

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
    lastError = 'MONGODB_URI is not set';
    console.error('❌ MONGODB_URI is not set; messages will only be emailed.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    lastError = '';
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    lastError = error.message;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`   Retrying in ${RETRY_DELAY / 1000}s...`);
    setTimeout(connectDB, RETRY_DELAY);
  }
};

const isDBConnected = () => mongoose.connection.readyState === 1;

// For routes that need the database. Put it after adminAuth on admin routes,
// so only the admin sees the connection error.
const requireDB = (req, res, next) => {
  if (isDBConnected()) return next();
  res.status(503).json({
    success: false,
    message: `The database is not connected${lastError ? ` (${lastError})` : ''}. Check MONGODB_URI on the server; new briefs are still emailed.`,
  });
};

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
module.exports.requireDB = requireDB;
