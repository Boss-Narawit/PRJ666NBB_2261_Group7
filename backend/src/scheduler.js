const cron = require('node-cron');
const forgottenItems = require('./jobs/forgottenItems.job');
const expireTimers = require('./jobs/expireTimers.job');
const annualRecap = require('./jobs/annualRecap.job');
const itemCareReminders = require('./jobs/itemCareReminders.job');
const { CRON_TIMEZONE } = require('./config/constants');

// Registers cron jobs. Called once from server.js after the DB connects.
const start = () => {
  // BR11: daily forgotten-item sweep at 08:00 local time — without the
  // timezone option a UTC host would fire this in the middle of the night.
  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        await forgottenItems.run();
      } catch (err) {
        console.error('forgottenItems job failed:', err);
      }
    },
    { timezone: CRON_TIMEZONE }
  );

  // Daily 09:00 local: nudge users to repair damaged items and repurpose
  // (resell/donate) still-good items gone unworn — the repurpose/repair half
  // of the proactive reminder system.
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        await itemCareReminders.run();
      } catch (err) {
        console.error('itemCareReminders job failed:', err);
      }
    },
    { timezone: CRON_TIMEZONE }
  );

  // BR15: every 15 min, remind users whose cooling-off period has ended.
  cron.schedule('*/15 * * * *', async () => {
    try {
      await expireTimers.run();
    } catch (err) {
      console.error('expireTimers job failed:', err);
    }
  });

  // BR26: Jan 1 at 01:00 UTC, emit each eligible user's annual recap. Pinned to
  // UTC (not local) so the job's "year that just ended" math lines up with the
  // UTC-midnight logDates it counts, regardless of host timezone.
  cron.schedule(
    '0 1 1 1 *',
    async () => {
      try {
        await annualRecap.run();
      } catch (err) {
        console.error('annualRecap job failed:', err);
      }
    },
    { timezone: 'UTC' }
  );
};

module.exports = { start };
