const Clothing = require('../models/Clothing');

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
    console.log(clothingItems.length);
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

module.exports = {
  uploadClothing,
  bulkUploadClothing,
  getAllClothing,
  getClothingById,
  updateClothing,
  deleteClothing,
};
