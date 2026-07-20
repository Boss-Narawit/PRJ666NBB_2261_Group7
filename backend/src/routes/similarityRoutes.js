const express = require('express');

const router = express.Router();

const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const similarityController = require('../controllers/similarityController');

router.post(
  '/check',
  authenticate, // ensure user is logged in via JWT
  upload.single('image'), // use custom multer memory storage
  similarityController.checkSimilarity // runs vector search
);

module.exports = router;
