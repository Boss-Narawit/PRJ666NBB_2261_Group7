const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getSummary } = require('../controllers/dashboard.controller');

const router = express.Router();

// Utilization ships inside /summary (utilizationRate, BR24) — the old
// /utilization and /recent-activity stubs were removed 2026-07-14.
router.get('/summary', authenticate, getSummary);

module.exports = router;
