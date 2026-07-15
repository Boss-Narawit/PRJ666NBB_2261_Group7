// Idempotent: upserts the local tailor/upcycle directory partners by name into
// the DB at MONGODB_URI without touching anything else (unlike seed/seed.js,
// which wipes all collections). Safe to re-run.
//   node scripts/seed-care-partners.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Partner = require('../src/models/Partner');
const carePartners = require('../seed/carePartners');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Partner.bulkWrite(
    carePartners.map((p) => ({
      updateOne: { filter: { name: p.name }, update: { $set: p }, upsert: true },
    }))
  );
  console.log(`Care partners: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
