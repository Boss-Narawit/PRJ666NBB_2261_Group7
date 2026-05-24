const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: 'Create wear log' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get wear logs' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get wear log detail' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete wear log' });
});

module.exports = router;
