const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Define secret key
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_fallback_key';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create new user
    user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('REGISTRATION ERROR: ', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token route' });
});

router.delete('/delete-account', (req, res) => {
  res.json({ message: 'Delete account route' });
});

module.exports = router;
