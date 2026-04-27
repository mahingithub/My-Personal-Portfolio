// ============================================
// 🔐 Admin Authentication Middleware
// ============================================

/**
 * Simple admin authentication using password in headers
 * For production, consider using JWT tokens
 * 
 * Usage: Send the admin password in the request header
 *   Header: x-admin-password: your-password-here
 */
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];

  if (!adminPassword) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Admin password required.',
    });
  }

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password.',
    });
  }

  next();
};

module.exports = adminAuth;
