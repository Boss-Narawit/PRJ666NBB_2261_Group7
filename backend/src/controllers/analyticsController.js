const Clothing = require('../models/Clothing');
const WearLog = require('../models/WearLog');
const { ANNUAL_RECAP_MIN_LOGS, UTILIZATION_WINDOW_DAYS } = require('../config/constants');

const getAnnualRecapAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const now = new Date();
    // WearLog.logDate is stored at midnight UTC, so derive the year window in UTC
    // too — a local-time Jan 1 would drop early-January logs on servers west of UTC.
    // ?year= lets the annual-recap job / notification open a completed past year;
    // it defaults to the current year, preserving the live year-to-date behaviour.
    const currentYear = now.getUTCFullYear();
    const requestedYear = Number.parseInt(req.query.year, 10);
    const year = Number.isInteger(requestedYear) ? requestedYear : currentYear;
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

    // BR25: the recap needs a minimum body of wear-log data to be meaningful.
    // The recap is year-scoped, so the gate counts that year's logs (not lifetime).
    const logCount = await WearLog.countDocuments({
      userId,
      logDate: { $gte: yearStart, $lt: yearEnd },
    });
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
    const yearlyWearLogs = await WearLog.find({
      userId,
      logDate: {
        $gte: yearStart,
        $lt: yearEnd,
      },
    });

    // A wear log is one outfit (BR8), so the log count is the outfits-logged headline;
    // totalWearCount sums the items worn across those outfits.
    const totalOutfits = yearlyWearLogs.length;
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

    // BR23: only rank Available items. An item worn this year but since
    // archived/exported is absent from clothingMap — drop it so it never
    // surfaces with an undefined name/image.
    const topItems = Object.entries(wearMap)
      .filter(([itemId]) => clothingMap[itemId])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([itemId, wearCount], index) => ({
        rank: index + 1,
        id: itemId,
        name: clothingMap[itemId].name,
        imageUrl: clothingMap[itemId].imageUrl,
        wearCount,
      }));

    const mostWornItem = topItems.length > 0 ? topItems[0] : null;

    // Wardrobe Utilization (BR24). The 90-day window ends at the recap period's
    // end — "now" for the live current year, Dec 31 for a completed past year —
    // so a historical recap reflects that year rather than the present.
    const windowEnd = now < yearEnd ? now : yearEnd;
    const windowStart = new Date(windowEnd);
    windowStart.setUTCDate(windowStart.getUTCDate() - UTILIZATION_WINDOW_DAYS);

    const recentWearLogs = await WearLog.find({
      userId,
      logDate: {
        $gte: windowStart,
        $lt: windowEnd,
      },
    });
    // BR23/BR24: only Available items count toward utilization. Without this
    // filter an archived-but-worn item inflates the numerator past the
    // Available-only denominator, pushing utilizationRate above 100%.
    const activeItemIds = new Set();
    recentWearLogs.forEach((log) => {
      log.clothingWorn.forEach((item) => {
        const id = item.itemId.toString();
        if (clothingMap[id]) activeItemIds.add(id);
      });
    });
    const activeItems = activeItemIds.size;

    const utilizationRate =
      totalClothingItems === 0 ? 0 : Number(((activeItems / totalClothingItems) * 100).toFixed(1));

    res.status(200).json({
      year,
      totalClothingItems,
      totalOutfits,
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
