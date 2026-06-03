const express = require('express');
const router = express.Router();

// Import the Middleware (The Bouncer)
const { validateAuthentication } = require('../middlewares/validateAuth');
const { authenticate } = require('../middlewares/auth');

// Import the Controller (The Manager)
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', validateAuthentication, authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/reactivate (cancel a pending deletion + log in)
router.post('/reactivate', authController.reactivate);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// DELETE /api/auth/delete-account (BR3 soft-delete — requires a valid token)
router.delete('/delete-account', authenticate, authController.deleteAccount);

module.exports = router;
