const Clothing = require('../models/Clothing');
const User = require('../models/User');

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

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
    const clothing = await Clothing.create(req.body);

    res.status(201).json(clothing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const bulkUploadClothing = async (req, res) => {
  try {
    const clothingItems = await Clothing.insertMany(req.body);

    res.status(201).json(clothingItems);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllClothing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const clothingItems = await Clothing.find({
      userId,
    });

    res.status(200).json(clothingItems);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getClothingById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const clothing = await Clothing.findOne({
      _id: req.params.id,
      userId,
    });

    if (!clothing) {
      return res.status(404).json({
        message: 'Clothing item not found',
      });
    }

    res.status(200).json(clothing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateClothing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updatedClothing = await Clothing.findOneAndUpdate(
      {
        _id: req.params.id,
        userId,
      },
      req.body,
      {
        new: true,
      }
    );

    if (!updatedClothing) {
      return res.status(404).json({
        message: 'Clothing item not found',
      });
    }

    res.status(200).json(updatedClothing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteClothing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const deletedClothing = await Clothing.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!deletedClothing) {
      return res.status(404).json({
        message: 'Clothing item not found',
      });
    }

    res.status(200).json({
      message: 'Clothing item deleted',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getForgottenItems = async (req, res) => {
  const userId = req.user?.userId;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const thresholdDays = user.preferences.forgottenItemThresholdDays;

  const thresholdDate = new Date();

  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

  console.log(thresholdDate);

  const forgottenItems = await Clothing.find({
    userId: userId,
    status: 'Available',
    $or: [
      {
        'analytics.lastWornAt': {
          $lt: thresholdDate,
        },
      },
      {
        'analytics.lastWornAt': {
          $exists: false,
        },
      },
    ],
  });

  res.json(forgottenItems);
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
