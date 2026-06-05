const Clothing = require('../models/Clothing');
const User = require('../models/User');

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
    const clothingItems = await Clothing.find();

    res.status(200).json(clothingItems);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getClothingById = async (req, res) => {
  try {
    const clothing = await Clothing.findById(req.params.id);

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
    const updatedClothing = await Clothing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

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
    const deletedClothing = await Clothing.findByIdAndDelete(req.params.id);

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
  const userId = req.user?.id || process.env.TEST_USER_ID;
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
  uploadClothing,
  bulkUploadClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
  getForgottenItems,
};
