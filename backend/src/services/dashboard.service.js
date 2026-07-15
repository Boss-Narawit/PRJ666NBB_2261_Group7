const mongoose = require('mongoose');
const User = require('../models/User');
const Clothing = require('../models/Clothing');
const WearLog = require('../models/WearLog');
const {
  FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
  DASHBOARD_FORGOTTEN_PREVIEW_LIMIT,
  UTILIZATION_WINDOW_DAYS,
} = require('../config/constants');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// BR11: forgotten = Available items unworn for >= the user's threshold.
// Never-worn items count once they are older than the threshold (no lastWornAt).
// BR23: Archived items are excluded.
const forgottenFilter = (userId, cutoff) => ({
  userId,
  status: 'Available',
  $or: [
    { 'analytics.lastWornAt': { $lt: cutoff } },
    { 'analytics.lastWornAt': null, createdAt: { $lt: cutoff } },
  ],
});

const getSummary = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  const thresholdDays =
    user.preferences?.forgottenItemThresholdDays ?? FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS;
  const now = new Date();
  const cutoff = new Date(now.getTime() - thresholdDays * MS_PER_DAY);
  // logDate is stored as midnight UTC, so the month boundary is UTC too.
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  // BR24: utilization looks at the trailing window, not the calendar month.
  const windowStart = new Date(now.getTime() - UTILIZATION_WINDOW_DAYS * MS_PER_DAY);

  const [totalItems, forgottenCount, forgottenItems, wornAgg, windowAgg] = await Promise.all([
    // Must agree with the wardrobe view, which shows only Available items —
    // archived/exported items would otherwise inflate the home stat.
    Clothing.countDocuments({ userId, status: 'Available' }),
    Clothing.countDocuments(forgottenFilter(userId, cutoff)),
    Clothing.find(forgottenFilter(userId, cutoff))
      .sort({ 'analytics.lastWornAt': 1 })
      .limit(DASHBOARD_FORGOTTEN_PREVIEW_LIMIT)
      .select('name brand imageUrl analytics.lastWornAt'),
    WearLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(String(userId)),
          logDate: { $gte: monthStart },
        },
      },
      { $unwind: '$clothingWorn' },
      { $group: { _id: '$clothingWorn.itemId' } },
      { $count: 'count' },
    ]),
    WearLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(String(userId)),
          logDate: { $gte: windowStart },
        },
      },
      { $unwind: '$clothingWorn' },
      { $group: { _id: '$clothingWorn.itemId' } },
    ]),
  ]);

  // BR23/BR24: utilization = share of the *active* wardrobe worn in the window.
  // An item worn then archived/exported no longer belongs to the wardrobe the
  // rate describes, so worn ids are re-checked against status: 'Available' —
  // same convention as the annual recap's utilizationRate.
  const wornIds = windowAgg.map((d) => d._id);
  const wornInWindow = wornIds.length
    ? await Clothing.countDocuments({ userId, status: 'Available', _id: { $in: wornIds } })
    : 0;
  const utilizationRate = totalItems ? Math.round((wornInWindow / totalItems) * 100) : 0;

  return {
    userName: user.name,
    totalItems,
    wornThisMonth: wornAgg[0]?.count ?? 0,
    forgottenCount,
    forgottenItems,
    utilizationRate,
    wornInWindow,
    utilizationWindowDays: UTILIZATION_WINDOW_DAYS,
  };
};

module.exports = { getSummary, forgottenFilter, MS_PER_DAY };
