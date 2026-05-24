const express = require('express');

const router = express.Router();

router.post('/analyze', (req, res) => {
  res.json({ message: 'Analyze similarity' });
});

router.post('/check', (req, res) => {
  res.json({ message: 'Check similarity' });
});

router.get('/:clothingId/similar', (req, res) => {
  res.json({ message: 'Get similar items' });
});

module.exports = router;
