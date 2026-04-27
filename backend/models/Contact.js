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
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
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

// Index for sorting by latest messages
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
