const mongoose = require('mongoose');
const User = require('../models/User');
const Clothing = require('../models/Clothing');
const WearLog = require('../models/WearLog');
const {
  FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
  DASHBOARD_FORGOTTEN_PREVIEW_LIMIT,
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

  const [totalItems, forgottenCount, forgottenItems, wornAgg] = await Promise.all([
    Clothing.countDocuments({ userId }),
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
  ]);

  return {
    userName: user.name,
    totalItems,
    wornThisMonth: wornAgg[0]?.count ?? 0,
    forgottenCount,
    forgottenItems,
  };
};

module.exports = { getSummary };
