const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getMe, updateMe } = require('../controllers/userController');

const router = express.Router();

router.get('/me', authenticate, getMe);

router.patch('/me', authenticate, updateMe);

router.patch('/notification-settings', (req, res) => {
  res.json({ message: 'Update notification settings' });
});

module.exports = router;
