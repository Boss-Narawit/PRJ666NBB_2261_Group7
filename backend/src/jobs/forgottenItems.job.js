const User = require('../models/User');
const Clothing = require('../models/Clothing');
const Notification = require('../models/Notification');
const { forgottenFilter, MS_PER_DAY } = require('../services/dashboard.service');
const {
  FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
  FORGOTTEN_ITEM_RENOTIFY_DAYS,
} = require('../config/constants');

// BR11: notify users about Available items unworn past their threshold.
// BR13: re-notify only after the cooldown. BR28: skip users who disabled alerts.
const run = async () => {
  const now = new Date();
  const renotifyCutoff = new Date(now.getTime() - FORGOTTEN_ITEM_RENOTIFY_DAYS * MS_PER_DAY);

  const users = await User.find({
    // $ne:false (not :true) so legacy docs predating these fields still match —
    // a Mongo equality match never matches a *missing* nested field, but the
    // preferences API deliberately treats missing as enabled (!== false).
    notificationEnabled: { $ne: false },
    'preferences.forgottenItemAlertEnabled': { $ne: false },
    scheduledDeletionAt: null,
  });

  let notificationsCreated = 0;

  for (const user of users) {
    try {
      const thresholdDays =
        user.preferences?.forgottenItemThresholdDays ?? FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS;
      const cutoff = new Date(now.getTime() - thresholdDays * MS_PER_DAY);

      const items = await Clothing.find({
        $and: [
          forgottenFilter(user._id, cutoff),
          {
            $or: [
              { 'analytics.lastNotifiedAt': null },
              { 'analytics.lastNotifiedAt': { $lt: renotifyCutoff } },
            ],
          },
        ],
      });

      for (const item of items) {
        await Notification.create({
          userId: user._id,
          type: 'forgotten_item',
          message: `You haven't worn your ${item.brand} ${item.name} in a while. Still loving it?`,
          relatedId: item._id,
        });
        // Targeted update, not item.save() — a full-document save re-validates
        // every path, so a single legacy doc that fails a newer validator (e.g.
        // colors: []) would abort the whole sweep after its Notification was
        // already created, and the unstamped lastNotifiedAt would re-notify daily.
        await Clothing.updateOne({ _id: item._id }, { $set: { 'analytics.lastNotifiedAt': now } });
        notificationsCreated += 1;
      }
    } catch (err) {
      // One user's failure must not starve the rest of the daily sweep.
      console.error(`forgottenItems: user ${user._id} failed:`, err);
    }
  }

  return { usersProcessed: users.length, notificationsCreated };
};

module.exports = { run };
