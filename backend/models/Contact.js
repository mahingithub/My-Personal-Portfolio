// ============================================
// 📋 Contact Message Model (MongoDB Schema)
// ============================================
const mongoose = require('mongoose');

/**
 * Contact Schema
 * Stores all contact form submissions from the portfolio website
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    // An email address, a phone/WhatsApp number, or both (checked below).
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s().-]{7,20}$/, 'Please provide a valid phone number'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [2, 'Subject must be at least 2 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
      select: false, // Hidden by default for privacy
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// There has to be some way to reply
contactSchema.pre('validate', function requireReplyChannel(next) {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Please provide an email address or a phone number');
  }
  next();
});

// Index for sorting by latest messages
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
