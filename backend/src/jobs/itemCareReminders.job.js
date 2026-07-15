const User = require('../models/User');
const Clothing = require('../models/Clothing');
const Notification = require('../models/Notification');
const { forgottenFilter, MS_PER_DAY } = require('../services/dashboard.service');
const { REPURPOSE_UNWORN_DAYS } = require('../config/constants');

// Emit at most one notification of `type` per item — look up the ids already
// notified for this user+type and create only for the rest. No spam, and no
// interference with the forgotten-item job's shared analytics.lastNotifiedAt.
const notifyNew = async (userId, type, items, messageFor) => {
  if (items.length === 0) return 0;

  const alreadyNotified = await Notification.find({
    userId,
    type,
    relatedId: { $in: items.map((i) => i._id) },
  }).select('relatedId');
  const seen = new Set(alreadyNotified.map((n) => String(n.relatedId)));

  const fresh = items.filter((i) => !seen.has(String(i._id)));
  if (fresh.length === 0) return 0;

  await Notification.insertMany(
    fresh.map((item) => ({
      userId,
      type,
      message: messageFor(item),
      relatedId: item._id,
    }))
  );
  return fresh.length;
};

// The "repurpose or repair" half of the proactive reminder system.
// Repair: nudge on Damaged items. Repurpose: nudge on still-good items left
// unworn past REPURPOSE_UNWORN_DAYS. BR28: skip users who disabled alerts.
const run = async () => {
  const cutoff = new Date(Date.now() - REPURPOSE_UNWORN_DAYS * MS_PER_DAY);

  const users = await User.find({
    // $ne:false (not :true) so legacy docs missing the field still count as
    // enabled — mirrors the other notification jobs.
    notificationEnabled: { $ne: false },
    scheduledDeletionAt: null,
  });

  let notificationsCreated = 0;

  for (const user of users) {
    try {
      const damaged = await Clothing.find({
        userId: user._id,
        status: 'Available',
        condition: 'Damaged',
      });

      // Still-wearable items gone cold — reuses the canonical BR11 filter
      // (its "no lastWornAt → fall back to createdAt" rule covers never-worn
      // items) so this job can never drift from the dashboard's definition.
      const idle = await Clothing.find({
        ...forgottenFilter(user._id, cutoff),
        condition: { $ne: 'Damaged' },
      });

      notificationsCreated += await notifyNew(
        user._id,
        'repair_reminder',
        damaged,
        (item) =>
          `Your ${item.brand} ${item.name} is marked as damaged — consider repairing it to keep it in rotation.`
      );

      notificationsCreated += await notifyNew(
        user._id,
        'repurpose_suggestion',
        idle,
        (item) =>
          `You haven't worn your ${item.brand} ${item.name} in a long time — consider reselling or donating it.`
      );
    } catch (err) {
      // One user's failure must not starve the rest of the sweep.
      console.error(`itemCareReminders: user ${user._id} failed:`, err);
    }
  }

  return { usersProcessed: users.length, notificationsCreated };
};

module.exports = { run };
