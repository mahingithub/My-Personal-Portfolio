// ============================================
// 🛣️ Contact API Routes
// ============================================
const express = require('express');
const router = express.Router();

// Controllers
const {
  submitContact,
  getAllMessages,
  getMessage,
  deleteMessage,
  toggleReadStatus,
} = require('../controllers/contactController');

// Middleware
const { contactLimiter } = require('../middleware/rateLimiter');
const adminAuth = require('../middleware/adminAuth');
const { contactValidationRules, validate } = require('../utils/validators');
const { isDBConnected } = require('../config/db');

// Admin pages read saved messages, so they need the database.
const requireDB = (req, res, next) => {
  if (isDBConnected()) return next();
  res.status(503).json({
    success: false,
    message: 'The database is not connected. Check MONGODB_URI on the server; new briefs are still emailed.',
  });
};

// ──────────────────────────────────────────────
// PUBLIC ROUTES
// ──────────────────────────────────────────────

/**
 * @route   POST /api/contact
 * @desc    Submit a new contact message
 * @access  Public (rate limited)
 */
router.post(
  '/contact',
  contactLimiter,            // Rate limiting (5 per 15 min)
  contactValidationRules,    // Validate inputs
  validate,                  // Handle validation errors
  submitContact              // Controller logic
);

// ──────────────────────────────────────────────
// ADMIN ROUTES (password protected)
// ──────────────────────────────────────────────

/**
 * @route   GET /api/messages
 * @desc    Get all messages (paginated, sortable, searchable)
 * @access  Admin
 */
router.get('/messages', adminAuth, requireDB, getAllMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Get a single message by ID
 * @access  Admin
 */
router.get('/messages/:id', adminAuth, requireDB, getMessage);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Admin
 */
router.delete('/messages/:id', adminAuth, requireDB, deleteMessage);

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Toggle read/unread status
 * @access  Admin
 */
router.patch('/messages/:id/read', adminAuth, requireDB, toggleReadStatus);

module.exports = router;
