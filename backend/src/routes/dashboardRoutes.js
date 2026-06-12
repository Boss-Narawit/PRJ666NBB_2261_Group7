const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getSummary } = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/summary', authenticate, getSummary);

router.get('/utilization', (req, res) => {
  res.json({ message: 'Wardrobe utilization' });
});

router.get('/recent-activity', (req, res) => {
  res.json({ message: 'Recent dashboard activity' });
});

module.exports = router;
