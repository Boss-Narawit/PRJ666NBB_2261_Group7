const purchaseService = require('../services/thoughtfulPurchase.service');

// Error → HTTP mapping shared by every handler below (same shape as
// clothingController): service errors carry .status; Mongoose
// ValidationError → 422, CastError → 400.
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

const createPurchase = async (req, res) => {
  try {
    const purchase = await purchaseService.createPurchase(req.user.userId, req.body);
    res.status(201).json(purchase);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllPurchases = async (req, res) => {
  try {
    const purchases = await purchaseService.getPurchases(req.user.userId);
    res.status(200).json(purchases);
  } catch (error) {
    handleError(res, error);
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await purchaseService.getPurchase(req.user.userId, req.params.id);
    res.status(200).json(purchase);
  } catch (error) {
    handleError(res, error);
  }
};

const approvePurchase = async (req, res) => {
  try {
    const purchase = await purchaseService.approvePurchase(req.user.userId, req.params.id);
    res.status(200).json(purchase);
  } catch (error) {
    handleError(res, error);
  }
};

const rejectPurchase = async (req, res) => {
  try {
    const purchase = await purchaseService.rejectPurchase(req.user.userId, req.params.id);
    res.status(200).json(purchase);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  approvePurchase,
  rejectPurchase,
};
