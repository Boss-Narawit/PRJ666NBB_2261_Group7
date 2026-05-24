const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get partners' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create partner' });
});

router.patch('/:id', (req, res) => {
  res.json({ message: 'Update partner' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete partner' });
});

module.exports = router;
