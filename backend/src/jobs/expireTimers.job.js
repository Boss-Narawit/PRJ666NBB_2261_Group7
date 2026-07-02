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
    // $ne:false (not :true) so legacy docs predating the field still match —
    // mirrors the preferences API, which treats a missing field as enabled.
    notificationEnabled: { $ne: false },
    scheduledDeletionAt: null,
  }).select('_id');
  const enabled = new Set(enabledUsers.map((u) => u._id.toString()));

  let notificationsCreated = 0;

  for (const purchase of duePurchases) {
    try {
      // Stamp first, and with a targeted update: a full-document save would
      // re-validate every path (one legacy doc aborts the sweep), and stamping
      // *after* the create would re-send the reminder every 15 minutes if the
      // stamp failed. Worst case now is one missed reminder, never spam.
      await ThoughtfulPurchase.updateOne(
        { _id: purchase._id },
        { $set: { cooldownReminderSentAt: now } }
      );

      // BR28: notification-disabled users get no reminder — but the stamp
      // above still takes the purchase out of the working set, so it isn't
      // rescanned forever (or stale-reminded if they re-enable much later).
      if (!enabled.has(purchase.userId.toString())) continue;

      await Notification.create({
        userId: purchase.userId,
        type: 'cooldown_reminder',
        message: `Your cooling-off period for "${purchase.itemName}" is over. Still want it?`,
        relatedId: purchase._id,
      });
      notificationsCreated += 1;
    } catch (err) {
      // One purchase's failure must not starve the rest of the sweep.
      console.error(`expireTimers: purchase ${purchase._id} failed:`, err);
    }
  }

  return { purchasesProcessed: duePurchases.length, notificationsCreated };
};

module.exports = { run };
