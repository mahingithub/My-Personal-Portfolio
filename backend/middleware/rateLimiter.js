// ============================================
// 🛡️ Rate Limiting Middleware
// ============================================
const rateLimit = require('express-rate-limit');

/**
 * Contact form rate limiter
 * Prevents spam by limiting submissions per IP
 * - Max 5 messages per 15 minutes per IP
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per window
  message: {
    success: false,
    message: 'Too many messages sent. Please try again after 15 minutes. ⏳',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * - Max 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { contactLimiter, apiLimiter };
