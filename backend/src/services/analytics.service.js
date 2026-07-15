const mongoose = require('mongoose');
const Clothing = require('../models/Clothing');
const WearLog = require('../models/WearLog');
const { ANNUAL_RECAP_MIN_LOGS, UTILIZATION_WINDOW_DAYS } = require('../config/constants');

// Annual style recap, computed in the database instead of loading every
// Available item + every year log into memory (the pre-service version built
// count maps in JS). Response shape is unchanged.
const getAnnualRecap = async (userId, requestedYear) => {
  const now = new Date();
  // WearLog.logDate is stored at midnight UTC, so derive the year window in UTC
  // too — a local-time Jan 1 would drop early-January logs on servers west of UTC.
  // `requestedYear` lets the annual-recap job / notification open a completed past
  // year; it defaults to the current year, preserving the live year-to-date behaviour.
  const currentYear = now.getUTCFullYear();
  const year = Number.isInteger(requestedYear) ? requestedYear : currentYear;
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  // aggregate() does not auto-cast like find() — convert explicitly.
  const userObjectId = new mongoose.Types.ObjectId(String(userId));
  const yearFilter = { userId: userObjectId, logDate: { $gte: yearStart, $lt: yearEnd } };

  // BR25: the recap needs a minimum body of wear-log data to be meaningful.
  // The recap is year-scoped, so the gate counts that year's logs (not lifetime).
  const logCount = await WearLog.countDocuments(yearFilter);
  if (logCount < ANNUAL_RECAP_MIN_LOGS) {
    const e = new Error(`Annual recap requires at least ${ANNUAL_RECAP_MIN_LOGS} wear logs`);
    e.status = 422;
    e.code = 'RECAP_NOT_ENOUGH_LOGS';
    throw e;
  }

  // Wardrobe Utilization (BR24). The 90-day window ends at the recap period's
  // end — "now" for the live current year, Dec 31 for a completed past year —
  // so a historical recap reflects that year rather than the present.
  const windowEnd = now < yearEnd ? now : yearEnd;
  const windowStart = new Date(windowEnd);
  windowStart.setUTCDate(windowStart.getUTCDate() - UTILIZATION_WINDOW_DAYS);

  const [yearAgg, totalClothingItems, wornInWindowIds] = await Promise.all([
    // One pass over the year's logs: total item-wears + top-3 ranked items.
    WearLog.aggregate([
      { $match: yearFilter },
      {
        $facet: {
          wearTotal: [{ $group: { _id: null, total: { $sum: { $size: '$clothingWorn' } } } }],
          topItems: [
            { $unwind: '$clothingWorn' },
            { $group: { _id: '$clothingWorn.itemId', wearCount: { $sum: 1 } } },
            // BR23: only rank Available items — an item worn this year but since
            // archived/exported drops out here, so it never surfaces with an
            // undefined name/image.
            { $lookup: { from: 'clothings', localField: '_id', foreignField: '_id', as: 'item' } },
            { $unwind: '$item' },
            { $match: { 'item.status': 'Available', 'item.userId': userObjectId } },
            { $sort: { wearCount: -1, _id: 1 } },
            { $limit: 3 },
            { $project: { wearCount: 1, name: '$item.name', imageUrl: '$item.imageUrl' } },
          ],
        },
      },
    ]),
    // BR23: archived/exported items are excluded from utilization and stats.
    Clothing.countDocuments({ userId, status: 'Available' }),
    WearLog.distinct('clothingWorn.itemId', {
      userId,
      logDate: { $gte: windowStart, $lt: windowEnd },
    }),
  ]);

  const facet = yearAgg[0] ?? { wearTotal: [], topItems: [] };
  // A wear log is one outfit (BR8), so the log count is the outfits-logged
  // headline; totalWearCount sums the items worn across those outfits.
  const totalOutfits = logCount;
  const totalWearCount = facet.wearTotal[0]?.total ?? 0;

  const topItems = facet.topItems.map((t, index) => ({
    rank: index + 1,
    id: String(t._id),
    name: t.name,
    imageUrl: t.imageUrl,
    wearCount: t.wearCount,
  }));
  const mostWornItem = topItems.length > 0 ? topItems[0] : null;

  // BR23/BR24: only Available items count toward utilization. Without this
  // filter an archived-but-worn item inflates the numerator past the
  // Available-only denominator, pushing utilizationRate above 100%.
  const activeItems =
    wornInWindowIds.length === 0
      ? 0
      : await Clothing.countDocuments({
          _id: { $in: wornInWindowIds },
          userId,
          status: 'Available',
        });

  const utilizationRate =
    totalClothingItems === 0 ? 0 : Number(((activeItems / totalClothingItems) * 100).toFixed(1));

  return {
    year,
    totalClothingItems,
    totalOutfits,
    totalWearCount,
    topItems,
    activeItems,
    utilizationRate,
    mostWornItem,
  };
};

module.exports = { getAnnualRecap };
