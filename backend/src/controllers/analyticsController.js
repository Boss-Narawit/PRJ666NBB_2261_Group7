const Clothing = require('../models/Clothing');

const getAnnualRecapAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const clothingItems = await Clothing.find({
      userId,
    });

    const totalClothingItems = clothingItems.length;

    const totalWearCount = clothingItems.reduce(
      (sum, item) => sum + (item.analytics?.wearCount || 0),
      0
    );

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

    res.status(200).json({
      year: new Date().getFullYear(),
      totalClothingItems,
      totalWearCount,
      mostWornItem,
      leastWornItem,
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
