const express = require('express');

const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ message: 'Get current user' });
});

router.patch('/me', (req, res) => {
  res.json({ message: 'Update current user' });
});

router.patch('/notification-settings', (req, res) => {
  res.json({ message: 'Update notification settings' });
});

module.exports = router;
