// ============================================
// 🏠 Homepage settings (edited in the admin panel)
// ============================================
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS id
    poster: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, trim: true, maxlength: 160 },
    project: { type: String, trim: true, maxlength: 60 }, // a slug in js/projects.js
    wide: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A single document (_id 'homepage'). No `featured` means: use the
// `featured: true` projects in js/projects.js.
const siteSchema = new mongoose.Schema({
  _id: { type: String, default: 'homepage' },
  featured: { type: [String], default: undefined },
  videos: [videoSchema], // newest first
});

module.exports = mongoose.model('Site', siteSchema);
