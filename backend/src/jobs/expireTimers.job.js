const ThoughtfulPurchase = require('../models/ThoughtfulPurchase');
const User = require('../models/User');
const Notification = require('../models/Notification');

// BR15: notify users once a purchase's cooling-off period has ended so they can
// confirm or cancel. cooldownReminderSentAt guards against re-notifying.
// BR28: skip users who disabled notifications.
const run = async () => {
  const now = new Date();

  const duePurchases = await ThoughtfulPurchase.find({
    status: 'pending',
    cooldownEndsAt: { $lte: now },
    cooldownReminderSentAt: null,
  });

  if (duePurchases.length === 0) {
    return { purchasesProcessed: 0, notificationsCreated: 0 };
  }

  const userIds = [...new Set(duePurchases.map((p) => p.userId.toString()))];
  const enabledUsers = await User.find({
    _id: { $in: userIds },
    notificationEnabled: true,
    scheduledDeletionAt: null,
  }).select('_id');
  const enabled = new Set(enabledUsers.map((u) => u._id.toString()));

  let notificationsCreated = 0;

  for (const purchase of duePurchases) {
    if (!enabled.has(purchase.userId.toString())) continue;

    await Notification.create({
      userId: purchase.userId,
      type: 'cooldown_reminder',
      message: `Your cooling-off period for "${purchase.itemName}" is over. Still want it?`,
      relatedId: purchase._id,
    });
    purchase.cooldownReminderSentAt = now;
    await purchase.save();
    notificationsCreated += 1;
  }

  return { purchasesProcessed: duePurchases.length, notificationsCreated };
};

module.exports = { run };
