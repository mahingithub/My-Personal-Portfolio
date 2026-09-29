// ============================================
// 🚀 Portfolio Backend Server
// ============================================
// Author: Asraf Alom
// Description: Express.js backend for portfolio contact form
// Features: MongoDB, Google Sheets, Email notifications, Admin dashboard
// ============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Local modules
const connectDB = require('./config/db');
const { isDBConnected } = connectDB;
const contactRoutes = require('./routes/contactRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initializeSheet } = require('./config/googleSheets');

// Initialize Express app
const app = express();

// Render sits behind a proxy; without this every visitor shares the proxy's IP
// and the contact rate limit (5 per 15 min) applies to everyone at once.
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// DATABASE CONNECTION
// ──────────────────────────────────────────────
connectDB();

// Initialize Google Sheets (if enabled)
if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
  initializeSheet().catch((err) =>
    console.error('Google Sheets init error:', err.message)
  );
}

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for admin dashboard
    crossOriginEmbedderPolicy: false,
  })
);

// CORS - Allow frontend to communicate with backend.
// FRONTEND_URL may list several sites, comma-separated. The Vercel deployments
// of this project are always allowed, since Vercel serves one site from many URLs.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const vercelOrigin = /^https:\/\/my-personal-portfolio[a-z0-9-]*\.vercel\.app$/;

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin) || vercelOrigin.test(origin))
      : '*', // Allow all origins in development
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-admin-password'],
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true }));

// Request logging (dev mode only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// General rate limiting
app.use('/api', apiLimiter);

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────

// API routes
app.use('/api', contactRoutes);

// Serve static files from the public folder (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🟢 Portfolio Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: isDBConnected() ? 'connected' : 'disconnected',
  });
});

// Delete the JSON welcome route because express.static will now serve public/index.html on /
// ──────────────────────────────────────────────
// ERROR HANDLING
// ──────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// ──────────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🚀 Portfolio Backend Server Running    ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   🌐 Server:  http://localhost:${PORT}      ║`);
  console.log(`║   📊 Admin:   http://localhost:${PORT}/admin ║`);
  console.log(`║   💚 Health:  http://localhost:${PORT}/api/health ║`);
  console.log(`║   🔧 Mode:    ${process.env.NODE_ENV || 'development'}             ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
