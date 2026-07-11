const User = require('../models/User');
const WearLog = require('../models/WearLog');
const Notification = require('../models/Notification');
const { ANNUAL_RECAP_MIN_LOGS } = require('../config/constants');

// BR26: on Jan 1 emit a `recap_ready` notification for the year that just ended.
// BR25: only users with enough logged wears that year get one. BR28: skip users
// who disabled notifications. logDate is midnight UTC, so scope the year in UTC.
const run = async () => {
  const completedYear = new Date().getUTCFullYear() - 1;
  const yearStart = new Date(Date.UTC(completedYear, 0, 1));
  const yearEnd = new Date(Date.UTC(completedYear + 1, 0, 1));

  const users = await User.find({
    // $ne:false (not :true) so legacy docs missing the field still count as
    // enabled — mirrors the forgotten-item sweep and the preferences API.
    notificationEnabled: { $ne: false },
    scheduledDeletionAt: null,
  });

  let notificationsCreated = 0;

  for (const user of users) {
    try {
      const logCount = await WearLog.countDocuments({
        userId: user._id,
        logDate: { $gte: yearStart, $lt: yearEnd },
      });

      if (logCount < ANNUAL_RECAP_MIN_LOGS) continue;

      await Notification.create({
        userId: user._id,
        type: 'recap_ready',
        message: `Your ${completedYear} Style Recap is ready! See your most-worn pieces and your year in style.`,
      });
      notificationsCreated += 1;
    } catch (err) {
      // One user's failure must not starve the rest of the sweep.
      console.error(`annualRecap: user ${user._id} failed:`, err);
    }
  }

  return { year: completedYear, usersProcessed: users.length, notificationsCreated };
};

module.exports = { run };
