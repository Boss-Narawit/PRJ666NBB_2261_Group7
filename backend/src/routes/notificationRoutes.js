const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getPreferences, updatePreferences } = require('../controllers/notificationController');

const router = express.Router();

router.get('/preferences', authenticate, getPreferences);

router.patch('/preferences', authenticate, updatePreferences);

router.post('/test', (req, res) => {
  res.json({ message: 'Send test notification' });
});

module.exports = router;
