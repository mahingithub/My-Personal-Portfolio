// ============================================
// ✅ Input Validation Rules
// ============================================
const { body, validationResult } = require('express-validator');

/**
 * Validation rules for the contact form
 * Each field is validated and sanitized
 */
const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(), // Sanitize to prevent XSS

  // Visitors can leave an email address, a phone/WhatsApp number, or both.
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?[\d\s().-]{7,20}$/).withMessage('Please provide a valid phone number'),

  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Please provide an email address or a phone number');
    }
    return true;
  }),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be 2-200 characters')
    .escape(),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters'),
];

/**
 * Middleware to handle validation errors
 * Returns a clean JSON response with all validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = { contactValidationRules, validate };
