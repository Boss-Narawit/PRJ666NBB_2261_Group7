const express = require('express');

const router = express.Router();

router.get('/summary', (req, res) => {
  res.json({ message: 'Dashboard summary' });
});

router.get('/utilization', (req, res) => {
  res.json({ message: 'Wardrobe utilization' });
});

router.get('/recent-activity', (req, res) => {
  res.json({ message: 'Recent dashboard activity' });
});

module.exports = router;
