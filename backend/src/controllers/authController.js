const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT token
const generateToken = (userId) => {
  // Uses your .env secret, or a fallback if it's missing during testing
  const secret = process.env.JWT_SECRET || 'fallback_super_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create the user (Password hashing is handled automatically by User.js hook)
    const user = await User.create({ name, email, password });

    // 3. Send success response with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('REGISTRATION ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
  // Check if body exists before proceeding
  if (!req.body || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { email, password } = req.body;

    // 1. Find user (we use .select('+password') because you set 'select: false' in the schema)
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists AND password matches (using your custom method in User.js)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Send success response with token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout a logged-in user
// @route   POST /api/auth/logout
const logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

// @desc    Refresh page
// @route   POST /api/auth/refresh
const refresh = (req, res) => {
  res.status(200).json({ message: 'Refresh successful' });
};

// @desc    Delete a user's account
// @route   POST /api/auth/delete-account
const deleteAccount = (req, res) => {
  res.status(200).json({ message: 'Account deleted' });
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  deleteAccount,
};
