const express = require('express');

const router = express.Router();

router.post('/push', (req, res) => {
  res.json({ message: 'Push sync data' });
});

router.get('/pull', (req, res) => {
  res.json({ message: 'Pull sync data' });
});

router.post('/resolve-conflict', (req, res) => {
  res.json({ message: 'Resolve sync conflict' });
});

module.exports = router;
