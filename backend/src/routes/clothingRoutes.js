const express = require('express');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const {
  uploadImage,
  uploadClothing,
  bulkUploadClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
  getForgottenItems,
} = require('../controllers/clothingController');

const router = express.Router();
router.use(authenticate);

router.post('/upload-image', upload.single('image'), uploadImage);

router.post('/upload', uploadClothing);

router.post('/bulk-upload', bulkUploadClothing);

router.get('/forgotten-items', getForgottenItems);

router.get('/', getAllClothing);

router.get('/:id', getClothingById);

router.patch('/:id', updateClothing);

router.delete('/:id', deleteClothing);

module.exports = router;
