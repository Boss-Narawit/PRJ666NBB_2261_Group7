/**
 * seedDemoAccount.js — creates (or fully rebuilds) the presentation demo account.
 *
 * Additive + idempotent: only touches data belonging to the demo account
 * (DEMO_EMAIL below). Safe to run against the shared dev database; re-running
 * wipes and recreates just the demo user's data.
 *
 * Demo credentials:  demo@redrobe.app / Demo2026pitch
 *
 * Usage:   node scripts/seedDemoAccount.js        (from backend/)
 * Post-step: if the AI service (port 8000) is running, embeddings are stamped
 * automatically; otherwise run `node scripts/backfillEmbeddings.js` before the
 * live similarity demo.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');

const User = require('../src/models/User');
const Clothing = require('../src/models/Clothing');
const WearLog = require('../src/models/WearLog');
const ThoughtfulPurchase = require('../src/models/ThoughtfulPurchase');
const SimilarityCheck = require('../src/models/SimilarityCheck');
const Partner = require('../src/models/Partner');
const Export = require('../src/models/Export');
const Notification = require('../src/models/Notification');

const DEMO_EMAIL = 'demo@redrobe.app';
const DEMO_PASSWORD = 'Demo2026pitch'; // BR2: ≥8 chars, letters + numbers, no specials

const midnight = (daysAgo) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

async function seedDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── 1. Wipe any previous demo-account data (scoped to the demo user only) ──
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const uid = existing._id;
    const purchases = await ThoughtfulPurchase.find({ userId: uid }).select('_id');
    await Promise.all([
      Clothing.deleteMany({ userId: uid }),
      WearLog.deleteMany({ userId: uid }),
      Export.deleteMany({ userId: uid }),
      Notification.deleteMany({ userId: uid }),
      SimilarityCheck.deleteMany({ purchaseId: { $in: purchases.map((p) => p._id) } }),
      ThoughtfulPurchase.deleteMany({ userId: uid }),
    ]);
    await User.deleteOne({ _id: uid });
    console.log('Removed previous demo account data');
  }

  // ── 2. Demo user ──
  const demoUser = await User.create({
    name: 'ReDrobe Demo',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD, // hashed by the User schema's pre-save hook
    role: 'user',
    notificationEnabled: true,
    notificationSlots: ['09:00'],
    preferences: {
      favoriteColors: ['camel', 'black', 'white'],
      favoriteCategories: ['tops', 'outerwear'],
      forgottenItemThresholdDays: 14, // low threshold so forgotten items show in the demo
      forgottenItemAlertEnabled: true,
    },
  });
  const DEMO_USER_ID = demoUser._id;
  console.log(`Demo user: ${DEMO_EMAIL} (${DEMO_USER_ID})`);

  // ── 3. Partners (upsert by name — never clobbers existing team data) ──
  const [thredUp, goodwill] = await Promise.all([
    Partner.findOneAndUpdate(
      { name: 'ThredUp' },
      {
        $setOnInsert: {
          name: 'ThredUp',
          type: 'resale',
          website: 'https://www.thredup.com',
          email: 'partners@thredup.com',
          description: 'Online consignment and thrift store',
          isActive: true,
        },
      },
      { upsert: true, new: true }
    ),
    Partner.findOneAndUpdate(
      { name: 'Goodwill' },
      {
        $setOnInsert: {
          name: 'Goodwill',
          type: 'donation',
          website: 'https://www.goodwill.org',
          email: 'partners@goodwill.org',
          description: 'Donate to those in need',
          isActive: true,
        },
      },
      { upsert: true, new: true }
    ),
  ]);

  // ── 4. Clothing (14 items — statuses cover Available / Archived / Exported,
  //       conditions cover the enum incl. one Damaged for the BR21 demo) ──
  const DEMO_CLOTHING = [
    {
      userId: DEMO_USER_ID,
      name: 'White Oxford Shirt',
      brand: 'Ralph Lauren',
      category: 'tops',
      colors: ['white'],
      size: 'M',
      condition: 'Good',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      purchasePrice: 89.99,
      tags: ['formal', 'cotton'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Black Slim Jeans',
      brand: "Levi's",
      category: 'bottoms',
      colors: ['black'],
      size: '30',
      condition: 'Good',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
      purchasePrice: 65.0,
      tags: ['denim', 'casual'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'White Leather Sneakers',
      brand: 'Nike',
      category: 'shoes',
      colors: ['white'],
      size: '9',
      condition: 'Good',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      purchasePrice: 110.0,
      tags: ['athletic', 'leather'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Camel Wool Coat',
      brand: 'Burberry',
      category: 'outerwear',
      colors: ['camel'],
      size: 'M',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
      purchasePrice: 245.0,
      tags: ['winter', 'wool'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Navy Blazer',
      brand: 'J.Crew',
      category: 'outerwear',
      colors: ['navy'],
      size: 'M',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
      purchasePrice: 129.5,
      tags: ['business', 'blazer'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Floral Midi Dress',
      brand: 'Free People',
      category: 'dresses',
      colors: ['pink', 'white'],
      size: 'S',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1',
      purchasePrice: 78.0,
      tags: ['summer', 'floral'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Silk Scarf',
      brand: 'Hermès',
      category: 'accessories',
      colors: ['multicolor'],
      size: 'One Size',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
      purchasePrice: 195.0,
      tags: ['silk', 'luxury'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Corduroy Pants',
      brand: 'Gap',
      category: 'bottoms',
      colors: ['brown'],
      size: '30',
      condition: 'Good',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
      purchasePrice: 49.99,
      tags: ['vintage', 'cotton'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Black Turtleneck',
      brand: 'Uniqlo',
      category: 'tops',
      colors: ['black'],
      size: 'M',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4',
      purchasePrice: 29.9,
      tags: ['basics', 'knit'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Gold Hoop Earrings',
      brand: 'Mejuri',
      category: 'accessories',
      colors: ['gold'],
      size: 'One Size',
      condition: 'Excellent',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236',
      purchasePrice: 45.0,
      tags: ['jewelry', 'minimalist'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Denim Jacket',
      brand: "Levi's",
      category: 'outerwear',
      colors: ['blue'],
      size: 'M',
      condition: 'Good',
      status: 'Archived',
      imageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e',
      purchasePrice: 79.5,
      tags: ['denim', 'casual'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Ripped Band Tee',
      brand: 'Vintage Threads',
      category: 'tops',
      colors: ['grey'],
      size: 'M',
      condition: 'Damaged',
      status: 'Available',
      imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b',
      purchasePrice: 25.0,
      tags: ['rock', 'distressed'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Beige Trench Coat',
      brand: 'Burberry',
      category: 'outerwear',
      colors: ['beige'],
      size: 'M',
      condition: 'Good',
      status: 'Exported',
      imageUrl: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a',
      purchasePrice: 189.0,
      tags: ['raincoat', 'classic'],
    },
    {
      userId: DEMO_USER_ID,
      name: 'Striped Linen Shirt',
      brand: 'J.Crew',
      category: 'tops',
      colors: ['blue', 'white'],
      size: 'M',
      condition: 'Good',
      status: 'Exported',
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      purchasePrice: 59.0,
      tags: ['summer', 'breathable'],
    },
  ];

  const items = await Clothing.insertMany(DEMO_CLOTHING);
  const byName = Object.fromEntries(items.map((i) => [i.name, i]));
  console.log(`Clothing: ${items.length}`);

  // Stamp exportInfo on the two Exported items (denormalized display cache —
  // must agree with the Export docs created in step 7).
  const trenchExportedAt = midnight(10);
  const linenExportedAt = midnight(20);
  await Clothing.updateOne(
    { _id: byName['Beige Trench Coat']._id },
    {
      $set: {
        exportInfo: { partnerName: 'ThredUp', type: 'resale', exportedAt: trenchExportedAt },
      },
    }
  );
  await Clothing.updateOne(
    { _id: byName['Striped Linen Shirt']._id },
    {
      $set: {
        exportInfo: { partnerName: 'Goodwill', type: 'donation', exportedAt: linenExportedAt },
      },
    }
  );

  // ── 5. Wear logs (deterministic — feeds dashboard stats, wear history,
  //       90-day utilization, and the forgotten-item demo) ──
  const logs = [];
  const outfit = (daysAgo, itemNames, outfitName, occasion) =>
    logs.push({
      userId: DEMO_USER_ID,
      logDate: midnight(daysAgo),
      clothingWorn: itemNames.map((n) => ({ itemId: byName[n]._id })),
      ...(outfitName ? { outfitName } : {}),
      ...(occasion ? { occasion } : {}),
    });

  // BR8 demo: two named outfits on the SAME day (today)
  outfit(
    0,
    ['White Oxford Shirt', 'Black Slim Jeans', 'White Leather Sneakers'],
    'Campus Day',
    'school'
  );
  outfit(0, ['Black Turtleneck', 'Black Slim Jeans', 'Gold Hoop Earrings'], 'Dinner Out', 'dinner');
  // Yesterday: rehearsal outfit
  outfit(
    1,
    ['Navy Blazer', 'Black Slim Jeans', 'White Leather Sneakers'],
    'Presentation Rehearsal',
    'work'
  );

  // Forgotten items: worn exactly once, well past the 14-day threshold
  outfit(40, ['Silk Scarf', 'Camel Wool Coat', 'Black Slim Jeans']);
  outfit(35, ['Corduroy Pants', 'White Oxford Shirt']);

  // Trench was worn before it was exported (history stays intact post-export)
  outfit(50, ['Beige Trench Coat', 'Black Turtleneck', 'Black Slim Jeans']);

  // Regular rotation every 2 days across the last ~8 weeks (skips the special days above)
  const rotation = [
    ['White Oxford Shirt', 'Black Slim Jeans', 'White Leather Sneakers'],
    ['Black Turtleneck', 'Corduroy Pants', 'Gold Hoop Earrings'],
    ['Navy Blazer', 'White Oxford Shirt', 'Black Slim Jeans'],
    ['Floral Midi Dress', 'White Leather Sneakers', 'Gold Hoop Earrings'],
    ['Camel Wool Coat', 'Black Turtleneck', 'Black Slim Jeans'],
  ];
  // Rotation intentionally reuses Corduroy Pants/Camel Coat only on early days —
  // keep forgotten items forgotten: skip combos containing them for recent days.
  let combo = 0;
  for (let day = 2; day <= 56; day += 2) {
    if ([35, 40, 50].includes(day)) continue;
    let picked = rotation[combo % rotation.length];
    combo++;
    const wearsForgotten = picked.includes('Corduroy Pants') || picked.includes('Camel Wool Coat');
    if (day < 20 && wearsForgotten) {
      // within the forgotten window — swap to a safe combo
      picked = rotation[0];
    }
    outfit(day, picked, undefined, 'casual');
  }
  await WearLog.insertMany(logs);
  console.log(`Wear logs: ${logs.length} (incl. 2 outfits today for the multi-outfit demo)`);

  // ── 6. BR9 sync: derive analytics.{wearCount,lastWornAt} from the logs ──
  const agg = await WearLog.aggregate([
    { $match: { userId: DEMO_USER_ID } },
    { $unwind: '$clothingWorn' },
    {
      $group: { _id: '$clothingWorn.itemId', count: { $sum: 1 }, lastWornAt: { $max: '$logDate' } },
    },
  ]);
  await Clothing.bulkWrite(
    agg.map(({ _id, count, lastWornAt }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { 'analytics.wearCount': count, 'analytics.lastWornAt': lastWornAt } },
      },
    }))
  );

  // Forgotten-item cooldown: scarf was already notified (renders in Notifications),
  // cords have NOT been notified — the daily job can pick them up live if demoed.
  await Clothing.updateOne(
    { _id: byName['Silk Scarf']._id },
    { $set: { 'analytics.lastNotifiedAt': hoursFromNow(-20) } }
  );

  // ── 7. Exports (history for ExportHistoryScreen; matches exportInfo above) ──
  await Export.insertMany([
    {
      userId: DEMO_USER_ID,
      clothingId: byName['Beige Trench Coat']._id,
      partnerId: thredUp._id,
      type: 'resale',
      price: 95,
      description: 'Classic beige trench, great condition.',
      status: 'active',
      checklistCompleted: true, // BR17/BR20
      consent: true,
      selectedFields: ['name', 'brand', 'size', 'condition', 'imageUrl'], // BR22
      createdAt: trenchExportedAt,
    },
    {
      userId: DEMO_USER_ID,
      clothingId: byName['Striped Linen Shirt']._id,
      partnerId: goodwill._id,
      type: 'donation',
      status: 'donated',
      checklistCompleted: true,
      consent: true,
      selectedFields: ['name', 'condition'],
      createdAt: linenExportedAt,
    },
  ]);
  console.log('Exports: 2 (1 resale, 1 donation)');

  // ── 8. Thoughtful purchases ──
  const DEMO_PURCHASES = [
    {
      userId: DEMO_USER_ID,
      itemName: 'Camel Trench Coat',
      description: 'A classic, lightweight trench coat perfect for transitional weather.',
      imageUrl: 'https://images.unsplash.com/' + 'photo-1548624313-0396c75e4b1a',
      estimatedPrice: 245.0,
      cooldownEndsAt: hoursFromNow(22),
      status: 'pending',
    },
    {
      userId: DEMO_USER_ID,
      itemName: 'Tan Wool Overcoat',
      description: 'A warm, tailored wool overcoat designed for cold winter days.',
      imageUrl: 'https://images.unsplash.com/' + 'photo-1591047139829-d91aecb6caea',
      estimatedPrice: 320.0,
      cooldownEndsAt: hoursFromNow(24),
      status: 'pending',
    },
    {
      userId: DEMO_USER_ID,
      itemName: 'Cashmere Scarf',
      description: 'An incredibly soft cashmere scarf that provides luxurious warmth.',
      imageUrl: 'https://images.unsplash.com/' + 'photo-1601925260368-ae2f83cf8b7f',
      estimatedPrice: 89.99,
      cooldownEndsAt: hoursFromNow(-2),
      status: 'pending',
      cooldownReminderSentAt: hoursFromNow(-1),
    },
    {
      userId: DEMO_USER_ID,
      itemName: 'White Canvas Sneakers',
      description: 'Versatile canvas sneakers that pair well with any casual outfit.',
      imageUrl: 'https://images.unsplash.com/' + 'photo-1542291026-7eec264c27ff',
      estimatedPrice: 65.5,
      cooldownEndsAt: hoursFromNow(-72),
      status: 'approved',
    },
  ];

  const purchases = await ThoughtfulPurchase.insertMany(DEMO_PURCHASES);
  const pByName = Object.fromEntries(purchases.map((p) => [p.itemName, p]));
  console.log(`Thoughtful purchases: ${purchases.length}`);

  // ── 9. Similarity checks ──
  // Scores are in Atlas $vectorSearch space: (1 + cosine) / 2.
  // 0.935 Atlas ⇒ 0.87 cosine ⇒ shown as "87% similar" in the app (BR16 alert at ≥0.70 cosine / 0.85 Atlas).
  await SimilarityCheck.insertMany([
    {
      purchaseId: pByName['Camel Trench Coat']._id,
      clothingId: byName['Camel Wool Coat']._id,
      score: 0.935,
      alertSent: true,
    },
    {
      purchaseId: pByName['Camel Trench Coat']._id,
      clothingId: byName['Navy Blazer']._id,
      score: 0.78, // 0.56 cosine — below threshold, no alert
      alertSent: false,
    },
    {
      purchaseId: pByName['White Canvas Sneakers']._id,
      clothingId: byName['White Leather Sneakers']._id,
      score: 0.91,
      alertSent: true,
    },
  ]);
  console.log('Similarity checks: 3');

  // ── 10. Notifications (every emitter type is represented) ──
  await Notification.insertMany([
    {
      userId: DEMO_USER_ID,
      type: 'similarity_alert',
      message:
        'The Camel Trench Coat you want is 87% similar to your Camel Wool Coat. Do you really need it?',
      isRead: false,
      relatedId: pByName['Camel Trench Coat']._id,
    },
    {
      userId: DEMO_USER_ID,
      type: 'forgotten_item',
      message: "You haven't worn your Silk Scarf in 40 days. Time to rediscover it!",
      isRead: false,
      relatedId: byName['Silk Scarf']._id,
    },
    {
      userId: DEMO_USER_ID,
      type: 'forgotten_item',
      message: "Your Corduroy Pants haven't been worn in 35 days. Give them another chance!",
      isRead: true,
      relatedId: byName['Corduroy Pants']._id,
    },
    {
      userId: DEMO_USER_ID,
      type: 'cooldown_reminder',
      message: 'Your cooling-off period for Cashmere Scarf has ended. Ready to decide?',
      isRead: false,
      relatedId: pByName['Cashmere Scarf']._id,
    },
    {
      userId: DEMO_USER_ID,
      type: 'export_update',
      message: 'Your Beige Trench Coat was sent to ThredUp for resale.',
      isRead: true,
    },
    {
      userId: DEMO_USER_ID,
      type: 'recap_ready',
      message: 'Your 2025 Style Recap is ready! You logged 33 outfits this year.',
      isRead: false,
    },
  ]);
  console.log('Notifications: 6 (5 types)');

  // ── 11. AI embeddings (needed for the live similarity demo) ──
  if (process.env.AI_SERVICE_URL) {
    console.log('Stamping AI embeddings via', process.env.AI_SERVICE_URL, '…');
    let ok = 0;
    let fail = 0;
    const embeddable = await Clothing.find({ userId: DEMO_USER_ID, status: 'Available' });
    for (const item of embeddable) {
      try {
        const img = await axios.get(item.imageUrl, { responseType: 'arraybuffer' });
        const form = new FormData();
        form.append('image_file', Buffer.from(img.data), 'image.jpg');
        const res = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/embed`, form, {
          headers: form.getHeaders(),
        });
        item.aiEmbedding = res.data.embedding;
        await item.save();
        ok++;
      } catch (err) {
        fail++;
        console.error(`  embed FAIL ${item.name}: ${err.message}`);
      }
    }
    console.log(`Embeddings: ${ok} ok, ${fail} failed`);
    if (fail > 0)
      console.log('  → re-run `node scripts/backfillEmbeddings.js` with the AI service up.');
  } else {
    console.log(
      'AI_SERVICE_URL not set — run `node scripts/backfillEmbeddings.js` before the similarity demo.'
    );
  }

  console.log(`\nDemo account ready → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

seedDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
