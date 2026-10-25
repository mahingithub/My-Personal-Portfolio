// ============================================
// 🏠 Homepage settings & uploaded videos
// ============================================
// Files live in MongoDB (GridFS bucket "media"): Render's own disk is wiped
// on every deploy and restart, so uploads can't be kept there.
const express = require('express');
const mongoose = require('mongoose');

const Site = require('../models/Site');
const adminAuth = require('../middleware/adminAuth');
const { requireDB } = require('../config/db');

const router = express.Router();

const MAX_VIDEO_MB = 100;
const MAX_POSTER_MB = 2;
const MAX_FEATURED = 5; // the homepage spotlight shows up to five projects
const SLUG = /^[a-z0-9-]{1,60}$/;

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' });
const toId = (value) => (/^[a-f0-9]{24}$/i.test(value) ? new mongoose.Types.ObjectId(value) : null);
const removeFile = (id) => id && bucket().delete(id).catch(() => {}); // already gone is fine

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const publicVideo = (video) => ({
  id: video._id,
  src: `/media/${video.file}`,
  poster: video.poster ? `/media/${video.poster}` : '',
  title: video.title,
  caption: video.caption || '',
  project: video.project || '',
  wide: Boolean(video.wide),
});

/**
 * Streams the raw request body into GridFS, so a big video never sits in memory.
 * Resolves with the new file id; rejects with { status, message }.
 */
const saveUpload = (req, { types, maxMb }) => new Promise((resolve, reject) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const size = Number(req.headers['content-length']);
  const maxBytes = maxMb * 1024 * 1024;
  if (!types.test(type)) return reject({ status: 415, message: 'This file type is not supported.' });
  if (!size) return reject({ status: 411, message: 'The upload is missing its size.' });
  if (size > maxBytes) return reject({ status: 413, message: `The file is too large (max ${maxMb} MB).` });

  const upload = bucket().openUploadStream(String(req.query.filename || 'upload').slice(0, 120), {
    metadata: { contentType: type },
  });
  let received = 0;
  let settled = false;
  const cancel = (error) => {
    if (settled) return;
    settled = true;
    req.unpipe(upload);
    upload.abort().catch(() => {});
    reject(error);
  };
  req.on('data', (chunk) => {
    received += chunk.length;
    if (received > maxBytes) cancel({ status: 413, message: `The file is too large (max ${maxMb} MB).` });
  });
  req.on('close', () => { if (!req.complete) cancel({ status: 400, message: 'The upload was interrupted.' }); });
  upload.on('error', () => cancel({ status: 500, message: 'Saving the file failed.' }));
  upload.on('finish', () => { if (!settled) { settled = true; resolve(upload.id); } });
  req.pipe(upload);
});

// ──────────────────────────────────────────────
// PUBLIC
// ──────────────────────────────────────────────

/**
 * @route   GET /api/site
 * @desc    What the homepage shows: featured project slugs (or null) and uploaded videos
 */
router.get('/site', requireDB, async (req, res) => {
  try {
    const site = await Site.findById('homepage').lean();
    res.set('Cache-Control', 'no-cache');
    res.json({
      success: true,
      data: { featured: site?.featured?.length ? site.featured : null, videos: (site?.videos || []).map(publicVideo) },
    });
  } catch (error) {
    console.error('❌ Get site error:', error);
    fail(res, 500, 'Failed to load the homepage settings.');
  }
});

/**
 * @route   GET /media/:id
 * @desc    An uploaded video or poster. Supports Range requests, which browsers
 *          (Safari above all) need to play and seek videos.
 */
const streamMedia = [requireDB, async (req, res) => {
  try {
    const id = toId(req.params.id);
    const file = id && await bucket().find({ _id: id }).next();
    if (!file) return fail(res, 404, 'File not found.');

    const size = file.length;
    let start = 0;
    let end = size - 1;
    res.set({
      'Accept-Ranges': 'bytes',
      'Content-Type': file.metadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable', // ids never change
      'Cross-Origin-Resource-Policy': 'cross-origin', // the site on Vercel embeds these
    });

    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      if (range[1]) {
        start = Number(range[1]);
        if (range[2]) end = Math.min(Number(range[2]), size - 1);
      } else {
        start = Math.max(0, size - Number(range[2])); // "bytes=-500": the last 500 bytes
      }
      if (start > end) {
        res.set('Content-Range', `bytes */${size}`);
        return res.status(416).end();
      }
      res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
    }
    res.set('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') return res.end();
    bucket().openDownloadStream(id, { start, end: end + 1 }).on('error', () => res.destroy()).pipe(res);
  } catch (error) {
    console.error('❌ Stream media error:', error);
    fail(res, 500, 'Failed to load the file.');
  }
}];

// ──────────────────────────────────────────────
// ADMIN (password protected)
// ──────────────────────────────────────────────

/**
 * @route   POST /api/site/featured
 * @desc    Choose the projects in the homepage spotlight, in order. [] resets to js/projects.js.
 */
router.post('/site/featured', adminAuth, requireDB, async (req, res) => {
  const featured = req.body?.featured;
  if (!Array.isArray(featured) || featured.length > MAX_FEATURED || !featured.every((slug) => SLUG.test(slug))) {
    return fail(res, 400, `Pick up to ${MAX_FEATURED} projects.`);
  }
  try {
    const unique = [...new Set(featured)];
    await Site.updateOne(
      { _id: 'homepage' },
      unique.length ? { $set: { featured: unique } } : { $unset: { featured: 1 } },
      { upsert: true }
    );
    res.json({ success: true, data: { featured: unique.length ? unique : null } });
  } catch (error) {
    console.error('❌ Save featured error:', error);
    fail(res, 500, 'Failed to save.');
  }
});

/**
 * @route   POST /api/site/videos?title=&caption=&project=&wide=1&filename=
 * @desc    Upload a video. The request body is the file itself.
 */
router.post('/site/videos', adminAuth, requireDB, async (req, res) => {
  const title = String(req.query.title || '').trim();
  const caption = String(req.query.caption || '').trim();
  const project = String(req.query.project || '').trim();
  if (!title || title.length > 120) return fail(res, 400, 'Add a title (up to 120 characters).');
  if (caption.length > 160) return fail(res, 400, 'The caption can be up to 160 characters.');
  if (project && !SLUG.test(project)) return fail(res, 400, 'Unknown project.');

  let file;
  try {
    file = await saveUpload(req, { types: /^video\/(mp4|webm|quicktime)$/, maxMb: MAX_VIDEO_MB });
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Upload failed.');
  }
  try {
    const video = { _id: new mongoose.Types.ObjectId(), file, title, caption, project, wide: req.query.wide === '1' };
    await Site.updateOne({ _id: 'homepage' }, { $push: { videos: { $each: [video], $position: 0 } } }, { upsert: true, runValidators: true });
    res.status(201).json({ success: true, data: publicVideo(video) });
  } catch (error) {
    console.error('❌ Save video error:', error);
    removeFile(file);
    fail(res, 500, 'Failed to save the video.');
  }
});

/**
 * @route   POST /api/site/videos/:id/poster
 * @desc    Set a video's poster image. The request body is the image.
 */
router.post('/site/videos/:id/poster', adminAuth, requireDB, async (req, res) => {
  const id = toId(req.params.id);
  const site = id && await Site.findOne({ _id: 'homepage', 'videos._id': id }, { 'videos.$': 1 }).lean().catch(() => null);
  if (!site) return fail(res, 404, 'Video not found.');

  let poster;
  try {
    poster = await saveUpload(req, { types: /^image\/(jpeg|png|webp)$/, maxMb: MAX_POSTER_MB });
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Upload failed.');
  }
  try {
    await Site.updateOne({ _id: 'homepage', 'videos._id': id }, { $set: { 'videos.$.poster': poster } });
    removeFile(site.videos[0].poster);
    res.json({ success: true, data: { poster: `/media/${poster}` } });
  } catch (error) {
    console.error('❌ Save poster error:', error);
    removeFile(poster);
    fail(res, 500, 'Failed to save the poster.');
  }
});

/**
 * @route   DELETE /api/site/videos/:id
 * @desc    Delete an uploaded video and its poster
 */
router.delete('/site/videos/:id', adminAuth, requireDB, async (req, res) => {
  const id = toId(req.params.id);
  try {
    const site = id && await Site.findOneAndUpdate({ _id: 'homepage' }, { $pull: { videos: { _id: id } } }).lean();
    const video = site?.videos.find((item) => item._id.equals(id));
    if (!video) return fail(res, 404, 'Video not found.');
    removeFile(video.file);
    removeFile(video.poster);
    res.json({ success: true, message: 'Video deleted.' });
  } catch (error) {
    console.error('❌ Delete video error:', error);
    fail(res, 500, 'Failed to delete the video.');
  }
});

module.exports = { router, streamMedia };
