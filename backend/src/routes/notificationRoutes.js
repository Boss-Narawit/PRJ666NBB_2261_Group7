const express = require('express');

const router = express.Router();

router.get('/preferences', (req, res) => {
  res.json({ message: 'Get notification preferences' });
});

router.patch('/preferences', (req, res) => {
  res.json({ message: 'Update notification preferences' });
});

router.post('/test', (req, res) => {
  res.json({ message: 'Send test notification' });
});

module.exports = router;
