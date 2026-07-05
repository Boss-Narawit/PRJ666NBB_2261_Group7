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
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearlyWearLogs = await WearLog.find({
      userId,
      logDate: {
        $gte: yearStart,
      },
    });

    const totalWearCount = yearlyWearLogs.reduce((sum, log) => sum + log.clothingWorn.length, 0);

    // Top 3 Most Worn Items
    const wearMap = {};
    yearlyWearLogs.forEach((log) => {
      log.clothingWorn.forEach((item) => {
        const id = item.itemId.toString();

        wearMap[id] = (wearMap[id] || 0) + 1;
      });
    });

    const clothingMap = {};
    clothingItems.forEach((item) => {
      clothingMap[item._id.toString()] = item;
    });

    const topItems = Object.entries(wearMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([itemId, wearCount], index) => ({
        rank: index + 1,
        id: itemId,
        name: clothingMap[itemId]?.name,
        imageUrl: clothingMap[itemId]?.imageUrl,
        wearCount,
      }));

    const mostWornItem = topItems.length > 0 ? topItems[0] : null;

    // Wardrobe Utilization
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentWearLogs = await WearLog.find({
      userId,
      logDate: {
        $gte: ninetyDaysAgo,
      },
    });
    const activeItemIds = new Set();
    recentWearLogs.forEach((log) => {
      log.clothingWorn.forEach((item) => {
        activeItemIds.add(item.itemId.toString());
      });
    });
    const activeItems = activeItemIds.size;

    const utilizationRate =
      totalClothingItems === 0 ? 0 : Number(((activeItems / totalClothingItems) * 100).toFixed(1));

    res.status(200).json({
      year: new Date().getFullYear(),
      totalClothingItems,
      totalWearCount,
      topItems,
      activeItems,
      utilizationRate,
      mostWornItem,
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
