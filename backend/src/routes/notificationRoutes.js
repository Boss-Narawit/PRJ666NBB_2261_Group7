const express = require('express');
const { authenticate } = require('../middlewares/auth');
const {
  getPreferences,
  updatePreferences,
  listNotifications,
  markRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticate, listNotifications);

router.patch('/:id/read', authenticate, markRead);

router.get('/preferences', authenticate, getPreferences);

router.patch('/preferences', authenticate, updatePreferences);

module.exports = router;
