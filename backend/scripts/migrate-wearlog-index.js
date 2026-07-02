/**
 * One-off migration: relax the wearlogs { userId, logDate } index from UNIQUE to
 * non-unique so BR8 now permits multiple wear logs ("outfits") per user per day.
 *
 * Mongoose does not drop an index whose options changed — it only creates missing
 * ones. So we explicitly drop the old unique index, then syncIndexes() rebuilds it
 * from the current schema (non-unique). Idempotent: safe to run repeatedly, and it
 * tolerates the index already being absent.
 *
 * Run against the target DB (loads MONGODB_URI from backend/.env):
 *   node scripts/migrate-wearlog-index.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const WearLog = require('../src/models/WearLog');

const OLD_INDEX_NAME = 'userId_1_logDate_1';

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set — check backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const collection = WearLog.collection;

  console.log('Indexes BEFORE:');
  console.log(await collection.indexes());

  try {
    await collection.dropIndex(OLD_INDEX_NAME);
    console.log(`Dropped index ${OLD_INDEX_NAME}`);
  } catch (err) {
    // 27 = IndexNotFound. Already gone (fresh DB or re-run) → nothing to do.
    if (err.code === 27 || /index not found/i.test(err.message)) {
      console.log(`Index ${OLD_INDEX_NAME} not present — skipping drop`);
    } else {
      throw err;
    }
  }

  // Rebuild indexes from the current schema (recreates {userId, logDate} non-unique).
  await WearLog.syncIndexes();
  console.log('syncIndexes() complete');

  console.log('Indexes AFTER:');
  console.log(await collection.indexes());

  await mongoose.disconnect();
  console.log('Disconnected. Migration done.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
