const Clothing = require('../models/Clothing');
const WearLog = require('../models/WearLog');
const { ANNUAL_RECAP_MIN_LOGS } = require('../config/constants');

const getAnnualRecapAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // BR25: the recap needs a minimum body of wear-log data to be meaningful.
    const logCount = await WearLog.countDocuments({ userId });
    if (logCount < ANNUAL_RECAP_MIN_LOGS) {
      return res.status(422).json({
        message: `Annual recap requires at least ${ANNUAL_RECAP_MIN_LOGS} wear logs`,
        code: 'RECAP_NOT_ENOUGH_LOGS',
      });
    }

    // BR23: archived/exported items are excluded from utilization and stats.
    const clothingItems = await Clothing.find({
      userId,
      status: 'Available',
    });

    const totalClothingItems = clothingItems.length;

    const totalWearCount = clothingItems.reduce(
      (sum, item) => sum + (item.analytics?.wearCount || 0),
      0
    );

    // Most and Least Worn Items
    let mostWornItem = null;
    let leastWornItem = null;

    if (clothingItems.length > 0) {
      const sortedItems = [...clothingItems].sort(
        (a, b) => (b.analytics?.wearCount || 0) - (a.analytics?.wearCount || 0)
      );

      mostWornItem = {
        id: sortedItems[0]._id,
        name: sortedItems[0].name,
        wearCount: sortedItems[0].analytics?.wearCount || 0,
      };

      leastWornItem = {
        id: sortedItems[sortedItems.length - 1]._id,
        name: sortedItems[sortedItems.length - 1].name,
        wearCount: sortedItems[sortedItems.length - 1].analytics?.wearCount || 0,
      };
    }

    // Favorite Category
    const categoryWearMap = {};

    clothingItems.forEach((item) => {
      const wearCount = item.analytics?.wearCount || 0;

      categoryWearMap[item.category] = (categoryWearMap[item.category] || 0) + wearCount;
    });

    let favoriteCategory = null;

    if (Object.keys(categoryWearMap).length > 0) {
      favoriteCategory = Object.entries(categoryWearMap).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Most Worn Brand
    const brandWearMap = {};

    clothingItems.forEach((item) => {
      const wearCount = item.analytics?.wearCount || 0;

      brandWearMap[item.brand] = (brandWearMap[item.brand] || 0) + wearCount;
    });

    let mostWornBrand = null;

    if (Object.keys(brandWearMap).length > 0) {
      mostWornBrand = Object.entries(brandWearMap).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Wardrobe Utilization
    const wornItems = clothingItems.filter((item) => (item.analytics?.wearCount || 0) > 0).length;

    const utilizationRate =
      totalClothingItems === 0 ? 0 : Number(((wornItems / totalClothingItems) * 100).toFixed(1));

    res.status(200).json({
      year: new Date().getFullYear(),
      totalClothingItems,
      totalWearCount,
      mostWornItem,
      leastWornItem,
      favoriteCategory,
      mostWornBrand,
      utilizationRate,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAnnualRecapAnalytics,
};
