const express = require('express');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

const { getAnnualRecapAnalytics } = require('../controllers/analyticsController');

router.get('/sustainability', (req, res) => {
  res.json({ message: 'Sustainability analytics' });
});

router.get('/annual-recap', authenticate, getAnnualRecapAnalytics);

router.get('/wear-frequency', (req, res) => {
  res.json({ message: 'Wear frequency analytics' });
});

module.exports = router;
