const clothingService = require('../services/clothing.service');

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Error → HTTP mapping shared by every handler below. Response shapes are
// unchanged from the pre-service-extraction controller: service errors carry
// .status; Mongoose ValidationError → 422, CastError → 400 (BR4/BR7).
const handleError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.name === 'ValidationError') {
    return res.status(422).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: error.message });
};

// Cloudinary streaming upload — infra, not Mongoose, so it stays here. Returns
// the hosted secure_url only; nothing is persisted (client convention).

const axios = require('axios');
const FormData = require('form-data');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'redrobe/clothing',
        },

        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    // generate AI embedding using same file buffer
    let embedding = [];
    try {
      const formData = new FormData();
      formData.append('image_file', req.file.buffer, req.file.originalname);

      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/embed`, formData, {
        headers: formData.getHeaders(),
      });
      embedding = aiResponse.data.embedding;
    } catch (aiError) {
      console.error('AI Embedding failed during upload:', aiError.message);
      // catch error so the Cloudinary upload doesn't fail completely if AI service is temporarily down
    }

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      aiEmbedding: embedding,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Image upload failed',
    });
  }
};

const uploadClothing = async (req, res) => {
  try {
    const clothing = await clothingService.createClothing(req.user.userId, req.body);
    res.status(201).json(clothing);
  } catch (error) {
    handleError(res, error);
  }
};

const bulkUploadClothing = async (req, res) => {
  try {
    const clothingItems = await clothingService.bulkCreateClothing(req.user.userId, req.body);
    res.status(201).json(clothingItems);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllClothing = async (req, res) => {
  try {
    const clothingItems = await clothingService.getWardrobe(req.user.userId);
    res.status(200).json(clothingItems);
  } catch (error) {
    handleError(res, error);
  }
};

const getClothingById = async (req, res) => {
  try {
    const clothing = await clothingService.getClothingItem(req.user.userId, req.params.id);
    res.status(200).json(clothing);
  } catch (error) {
    handleError(res, error);
  }
};

const updateClothing = async (req, res) => {
  try {
    const updatedClothing = await clothingService.updateClothingItem(
      req.user.userId,
      req.params.id,
      req.body
    );
    res.status(200).json(updatedClothing);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteClothing = async (req, res) => {
  try {
    await clothingService.deleteClothingItem(req.user.userId, req.params.id);
    res.status(200).json({
      message: 'Clothing item deleted',
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getForgottenItems = async (req, res) => {
  try {
    const forgottenItems = await clothingService.getForgottenItemsForUser(req.user?.userId);
    res.json(forgottenItems);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  uploadImage,
  uploadClothing,
  bulkUploadClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
  getForgottenItems,
};
