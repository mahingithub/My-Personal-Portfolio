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
router.get('/messages', adminAuth, getAllMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Get a single message by ID
 * @access  Admin
 */
router.get('/messages/:id', adminAuth, getMessage);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Admin
 */
router.delete('/messages/:id', adminAuth, deleteMessage);

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Toggle read/unread status
 * @access  Admin
 */
router.patch('/messages/:id/read', adminAuth, toggleReadStatus);

module.exports = router;
