const express = require('express');
const router = express.Router();

// Import the Middleware (The Bouncer)
const { validateRegistration } = require('../middlewares/validateAuth');

// Import the Controller (The Manager)
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
