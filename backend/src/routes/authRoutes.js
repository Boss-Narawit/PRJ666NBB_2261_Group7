const express = require('express');
const router = express.Router();

// Import the Middleware (The Bouncer)
const { validateAuthentication } = require('../middlewares/validateAuth');

// Import the Controller (The Manager)
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', validateAuthentication, authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// DELETE /api/auth/delete-account
router.delete('/delete-account', authController.deleteAccount);

module.exports = router;
