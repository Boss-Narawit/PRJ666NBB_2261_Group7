const Clothing = require('../models/Clothing');
const User = require('../models/User');
const { forgottenFilter, MS_PER_DAY } = require('../services/dashboard.service');
const { MAX_CLOTHING_BATCH } = require('../config/constants');

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Only these fields are client-writable — userId, analytics (BR9), aiEmbedding,
// and exportInfo are server-managed and must never come from the request body.
const EDITABLE_FIELDS = [
  'name',
  'brand',
  'category',
  'colors',
  'size',
  'imageUrl',
  'condition',
  'status',
  'purchasePrice',
  'purchaseDate',
  'tags',
  'notes',
];

const pickEditableFields = (body) => {
  const picked = {};
  // Guard null and non-object entries (a default parameter only covers undefined).
  if (!body || typeof body !== 'object') return picked;
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

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

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
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
    const clothing = await Clothing.create({
      ...pickEditableFields(req.body),
      userId: req.user.userId,
    });

    res.status(201).json(clothing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const bulkUploadClothing = async (req, res) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(422).json({
        message: 'Request body must be a non-empty array of items',
      });
    }

    // BR5: max items per batch.
    if (req.body.length > MAX_CLOTHING_BATCH) {
      return res.status(422).json({
        message: `Cannot add more than ${MAX_CLOTHING_BATCH} items per batch`,
      });
    }

    // Items always belong to the requester — never trust a client-sent userId.
    const items = req.body.map((item) => ({
      ...pickEditableFields(item),
      userId: req.user.userId,
    }));

    const clothingItems = await Clothing.insertMany(items);

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
      pickEditableFields(req.body),
      {
        new: true,
        runValidators: true, // reject invalid enum/required values instead of saving silently (BR4/BR7)
      }
    );

    if (!updatedClothing) {
      return res.status(404).json({
        message: 'Clothing item not found',
      });
    }

    res.status(200).json(updatedClothing);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({
        message: error.message,
      });
    }
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
  const cutoff = new Date(Date.now() - thresholdDays * MS_PER_DAY);

  // Shared definition with the dashboard + job so counts never disagree (BR11/BR23).
  const forgottenItems = await Clothing.find(forgottenFilter(userId, cutoff));

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
