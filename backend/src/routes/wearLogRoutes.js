const express = require('express');
const { authenticate } = require('../middlewares/auth');

const {
  createWearLog,
  listWearLogs,
  getWearLogById,
  updateWearLog,
  deleteWearLog,
} = require('../controllers/wearLog.controller');

const router = express.Router();
router.use(authenticate);

router.post('/', createWearLog);

router.get('/', listWearLogs);

router.get('/:id', getWearLogById);

router.patch('/:id', updateWearLog);

router.delete('/:id', deleteWearLog);

module.exports = router;
