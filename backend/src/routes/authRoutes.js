const express = require('express');

const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ message: 'Register route' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login route' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout route' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token route' });
});

router.delete('/delete-account', (req, res) => {
  res.json({ message: 'Delete account route' });
});

module.exports = router;
