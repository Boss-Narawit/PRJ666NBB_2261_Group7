const express = require('express');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

const { getAnnualRecapAnalytics } = require('../controllers/analyticsController');

router.get('/annual-recap', authenticate, getAnnualRecapAnalytics);

module.exports = router;
