// ============================================================
// middleware/authMiddleware.js
// Verifies the JWT token on protected routes.
// Attach this middleware to any route that needs auth.
// ============================================================
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // The token is expected in the Authorization header as:
  //   "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify and decode the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Attach the decoded user payload to the request object
    // so downstream controllers can access req.user.id
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

module.exports = { protect };
