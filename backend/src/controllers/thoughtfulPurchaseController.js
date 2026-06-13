const ThoughtfulPurchase = require('../models/ThoughtfulPurchase');

const createPurchase = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const today = new Date();
    const cooldownEndsAt = new Date(req.body.cooldownDate);
    cooldownEndsAt.setHours(0, 0, 0, 0);

    if (cooldownEndsAt < today) {
      return res.status(400).json({
        message: 'cooldownDate cannot be in the past',
      });
    }

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
