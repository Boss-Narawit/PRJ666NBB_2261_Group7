const express = require('express');
const { authenticate } = require('../middlewares/auth');

const {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  approvePurchase,
  rejectPurchase,
} = require('../controllers/thoughtfulPurchaseController');

const router = express.Router();
router.use(authenticate);

router.post('/', createPurchase);

router.get('/', getAllPurchases);

router.get('/:id', getPurchaseById);

router.patch('/approve/:id', approvePurchase);

router.patch('/reject/:id', rejectPurchase);

module.exports = router;
