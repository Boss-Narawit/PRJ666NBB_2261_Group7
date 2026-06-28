const cron = require('node-cron');
const forgottenItems = require('./jobs/forgottenItems.job');

// Registers cron jobs. Called once from server.js after the DB connects.
const start = () => {
  // BR11: daily forgotten-item sweep at 08:00.
  cron.schedule('0 8 * * *', async () => {
    try {
      await forgottenItems.run();
    } catch (err) {
      console.error('forgottenItems job failed:', err);
    }
  });
};

module.exports = { start };
