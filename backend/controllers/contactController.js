// ============================================
// 🎮 Contact Controller - Business Logic
// ============================================
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../utils/emailService');
const { appendToSheet, deleteFromSheet } = require('../config/googleSheets');

/**
 * @desc    Submit a new contact message
 * @route   POST /api/contact
 * @access  Public
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // 1. Save to MongoDB (primary storage)
    const contact = await Contact.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      subject,
      message,
      ip: req.ip,
    });

    // 2. Save to Google Sheets (backup - runs in background)
    if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
      appendToSheet(contact).catch((err) =>
        console.error('Google Sheets background error:', err.message)
      );
    }

    // 3. Send email notification (runs in background)
    sendContactNotification(contact).catch((err) =>
      console.error('Email notification background error:', err.message)
    );

    // 4. Respond to the client immediately
    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully. ✅',
      data: {
        id: contact._id,
        name: contact.name,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Submit contact error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * @desc    Get all contact messages (sorted by latest)
 * @route   GET /api/messages
 * @access  Admin
 */
const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.isRead === 'true') filter.isRead = true;
    if (req.query.isRead === 'false') filter.isRead = false;

    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [messages, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    const unreadCount = await Contact.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages.',
    });
  }
};

/**
 * @desc    Get a single message by ID
 * @route   GET /api/messages/:id
 * @access  Admin
 */
const getMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    // Mark as read when viewed
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('❌ Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message.',
    });
  }
};

/**
 * @desc    Delete a message by ID
 * @route   DELETE /api/messages/:id
 * @access  Admin
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    // Delete from MongoDB
    await Contact.findByIdAndDelete(req.params.id);

    // Delete from Google Sheets (background)
    if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
      deleteFromSheet(req.params.id).catch((err) =>
        console.error('Google Sheets delete background error:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully. 🗑️',
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message.',
    });
  }
};

/**
 * @desc    Mark a message as read/unread
 * @route   PATCH /api/messages/:id/read
 * @access  Admin
 */
const toggleReadStatus = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    message.isRead = !message.isRead;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message marked as ${message.isRead ? 'read' : 'unread'}.`,
      data: { isRead: message.isRead },
    });
  } catch (error) {
    console.error('❌ Toggle read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message.',
    });
  }
};

module.exports = {
  submitContact,
  getAllMessages,
  getMessage,
  deleteMessage,
  toggleReadStatus,
};
