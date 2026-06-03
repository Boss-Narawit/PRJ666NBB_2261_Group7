const jwt = require('jsonwebtoken');

// Verifies the Bearer JWT and attaches { userId } to req.user.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail fast rather than verifying against a hardcoded fallback.
    return next(new Error('JWT_SECRET is not set'));
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { userId: decoded.userId };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { authenticate };
