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

// Stubs — to be implemented
router.post('/logout', (req, res) => res.json({ message: 'logout stub' }));
router.post('/refresh', (req, res) => res.json({ message: 'refresh stub' }));
router.delete('/delete-account', (req, res) => res.json({ message: 'delete-account stub' }));

module.exports = router;
