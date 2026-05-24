const express = require('express');

const router = express.Router();

router.get('/sustainability', (req, res) => {
  res.json({ message: 'Sustainability analytics' });
});

router.get('/annual-recap', (req, res) => {
  res.json({ message: 'Annual recap analytics' });
});

router.get('/wear-frequency', (req, res) => {
  res.json({ message: 'Wear frequency analytics' });
});

module.exports = router;
