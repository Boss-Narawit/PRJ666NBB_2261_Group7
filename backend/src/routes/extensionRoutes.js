const express = require('express');

const router = express.Router();

router.post('/capture-product', (req, res) => {
  res.json({ message: 'Capture product data' });
});

router.post('/similarity-check', (req, res) => {
  res.json({ message: 'Extension similarity check' });
});

module.exports = router;
