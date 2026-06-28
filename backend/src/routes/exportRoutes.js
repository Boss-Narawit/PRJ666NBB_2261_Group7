const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { createResale, createDonation, getHistory } = require('../controllers/export.controller');

const router = express.Router();
router.use(authenticate);

router.post('/resale', createResale);

router.post('/donation', createDonation);

router.get('/history', getHistory);

module.exports = router;
