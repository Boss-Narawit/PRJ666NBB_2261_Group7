const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { listPartners } = require('../controllers/partner.controller');

const router = express.Router();

// Active partners feed the export destination picker (BR30).
router.get('/', authenticate, listPartners);

// Admin partner management (BR29) is deferred — left as stubs.
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
