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
    notificationEnabled: true,
    'preferences.forgottenItemAlertEnabled': true,
    scheduledDeletionAt: null,
  });

  let notificationsCreated = 0;

  for (const user of users) {
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
      item.analytics.lastNotifiedAt = now;
      await item.save();
      notificationsCreated += 1;
    }
  }

  return { usersProcessed: users.length, notificationsCreated };
};

module.exports = { run };
