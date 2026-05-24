const express = require('express');

const router = express.Router();

router.post('/upload', (req, res) => {
  res.json({ message: 'Upload clothing item' });
});

router.post('/bulk-upload', (req, res) => {
  res.json({ message: 'Bulk upload clothing items' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get clothing items' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get clothing detail' });
});

router.patch('/:id', (req, res) => {
  res.json({ message: 'Update clothing item' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete clothing item' });
});

module.exports = router;
