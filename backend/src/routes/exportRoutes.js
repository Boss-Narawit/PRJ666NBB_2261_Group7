const express = require('express');

const router = express.Router();

router.post('/resale', (req, res) => {
  res.json({ message: 'Export for resale' });
});

router.post('/donation', (req, res) => {
  res.json({ message: 'Export for donation' });
});

router.get('/history', (req, res) => {
  res.json({ message: 'Export history' });
});

module.exports = router;
