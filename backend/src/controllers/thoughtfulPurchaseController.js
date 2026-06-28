const ThoughtfulPurchase = require('../models/ThoughtfulPurchase');
const { COOLDOWN_MIN_MINUTES } = require('../config/constants');

const createPurchase = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // BR14: the cooling-off period must be at least 24h (1440 min) from now.
    const cooldownMinutes = Number(req.body.cooldownMinutes);
    if (!Number.isFinite(cooldownMinutes) || cooldownMinutes < COOLDOWN_MIN_MINUTES) {
      return res.status(400).json({
        message: `cooldownMinutes must be at least ${COOLDOWN_MIN_MINUTES}`,
      });
    }
    const cooldownEndsAt = new Date(Date.now() + cooldownMinutes * 60 * 1000);

    const purchase = await ThoughtfulPurchase.create({
      userId,
      itemName: req.body.itemName,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      estimatedPrice: req.body.estimatedPrice,
      sourceUrl: req.body.sourceUrl,
      cooldownEndsAt,
      status: 'pending',
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllPurchases = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const purchases = await ThoughtfulPurchase.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const purchase = await ThoughtfulPurchase.findOne({
      _id: req.params.id,
      userId,
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Purchase not found',
      });
    }

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const approvePurchase = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const purchase = await ThoughtfulPurchase.findOne({
      _id: req.params.id,
      userId,
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Purchase not found',
      });
    }

    if (purchase.cooldownEndsAt > new Date()) {
      return res.status(400).json({
        message: 'Cooling-off period has not ended yet',
      });
    }

    purchase.status = 'approved';

    await purchase.save();

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const rejectPurchase = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const purchase = await ThoughtfulPurchase.findOne({
      _id: req.params.id,
      userId,
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Purchase not found',
      });
    }

    purchase.status = 'rejected';

    await purchase.save();

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  approvePurchase,
  rejectPurchase,
};
