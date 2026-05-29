const express = require('express');

const {
  uploadClothing,
  bulkUploadClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
} = require('../controllers/clothingController');

const router = express.Router();

router.post('/upload', uploadClothing);

router.post('/bulk-upload', bulkUploadClothing);

router.get('/', getAllClothing);

router.get('/:id', getClothingById);

router.patch('/:id', updateClothing);

router.delete('/:id', deleteClothing);

module.exports = router;
