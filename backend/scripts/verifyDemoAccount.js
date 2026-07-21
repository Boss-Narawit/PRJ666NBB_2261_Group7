/**
 * verifyDemoAccount.js — asserts the demo account has everything the
 * presentation needs. Run after seedDemoAccount.js (and before the demo).
 *
 * Usage: node scripts/verifyDemoAccount.js   (from backend/)
 * Exits 1 if any check fails.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Clothing = require('../src/models/Clothing');
const WearLog = require('../src/models/WearLog');
const ThoughtfulPurchase = require('../src/models/ThoughtfulPurchase');
const SimilarityCheck = require('../src/models/SimilarityCheck');
const Export = require('../src/models/Export');
const Notification = require('../src/models/Notification');

const DEMO_EMAIL = 'demo@redrobe.app';
const DEMO_PASSWORD = 'Demo2026pitch';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Auth (login demo)
  const user = await User.findOne({ email: DEMO_EMAIL }).select('+password');
  check('demo user exists', !!user);
  if (!user) {
    process.exit(1);
  }
  check('demo password logs in (BR2)', await bcrypt.compare(DEMO_PASSWORD, user.password));
  check(
    'forgotten threshold is 14d, alerts on',
    user.preferences.forgottenItemThresholdDays === 14 &&
      user.preferences.forgottenItemAlertEnabled &&
      user.notificationEnabled
  );

  const uid = user._id;
  const items = await Clothing.find({ userId: uid });

  // Wardrobe (deliverable: catalog + statuses)
  check('14 clothing items', items.length === 14, `got ${items.length}`);
  const byStatus = (s) => items.filter((i) => i.status === s);
  check(
    '11 Available / 1 Archived / 2 Exported',
    byStatus('Available').length === 11 &&
      byStatus('Archived').length === 1 &&
      byStatus('Exported').length === 2,
    `A=${byStatus('Available').length} Ar=${byStatus('Archived').length} E=${byStatus('Exported').length}`
  );
  check(
    'both Exported items carry exportInfo (banner demo)',
    byStatus('Exported').every(
      (i) => i.exportInfo && i.exportInfo.partnerName && i.exportInfo.exportedAt
    )
  );
  check(
    'a Damaged item is Available (BR21 resale-block demo)',
    items.some((i) => i.condition === 'Damaged' && i.status === 'Available')
  );

  // Wear logs (deliverables: outfit logging, BR8 multi-outfit, BR9 derived analytics)
  const logs = await WearLog.find({ userId: uid });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todays = logs.filter((l) => l.logDate.getTime() === today.getTime());
  check(
    '2 outfits logged today with names (BR8)',
    todays.length === 2 && todays.every((l) => l.outfitName),
    `got ${todays.length}`
  );

  const agg = await WearLog.aggregate([
    { $match: { userId: uid } },
    { $unwind: '$clothingWorn' },
    { $group: { _id: '$clothingWorn.itemId', count: { $sum: 1 }, last: { $max: '$logDate' } } },
  ]);
  const aggMap = new Map(agg.map((a) => [String(a._id), a]));
  const br9ok = items.every((i) => {
    const a = aggMap.get(String(i._id));
    const expectCount = a ? a.count : 0;
    const expectLast = a ? a.last.getTime() : undefined;
    return (
      (i.analytics.wearCount || 0) === expectCount &&
      (expectLast === undefined ||
        (i.analytics.lastWornAt && i.analytics.lastWornAt.getTime() === expectLast))
    );
  });
  check('analytics match wear logs on every item (BR9)', br9ok);

  // Forgotten items (deliverable: forgotten alerts, BR11)
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const forgotten = items.filter(
    (i) => i.status === 'Available' && i.analytics.lastWornAt && i.analytics.lastWornAt < cutoff
  );
  check(
    '≥2 forgotten items past the 14d threshold (BR11)',
    forgotten.length >= 2,
    `got ${forgotten.length}`
  );

  // Thoughtful purchasing (deliverables: cooldown timer BR14/15, similarity BR16/18/19)
  const purchases = await ThoughtfulPurchase.find({ userId: uid });
  check('4 thoughtful purchases', purchases.length === 4, `got ${purchases.length}`);
  check(
    'a pending purchase with an active cooldown (BR15 block demo)',
    purchases.some((p) => p.status === 'pending' && p.cooldownEndsAt > new Date())
  );
  check(
    'a pending purchase past its cooldown, reminder sent (confirm demo)',
    purchases.some(
      (p) => p.status === 'pending' && p.cooldownEndsAt < new Date() && p.cooldownReminderSentAt
    )
  );

  const checks = await SimilarityCheck.find({ purchaseId: { $in: purchases.map((p) => p._id) } });
  check('similarity history exists', checks.length === 3, `got ${checks.length}`);
  check(
    'an alert-level match ≥0.85 Atlas score with alertSent (BR16)',
    checks.some((c) => c.score >= 0.85 && c.alertSent)
  );
  check(
    'a below-threshold match without alert',
    checks.some((c) => c.score < 0.85 && !c.alertSent)
  );

  // Exports (deliverables: resale + donation history, BR17/20/21/22)
  const exports_ = await Export.find({ userId: uid });
  const resale = exports_.find((e) => e.type === 'resale');
  const donation = exports_.find((e) => e.type === 'donation');
  check('1 resale + 1 donation export', !!resale && !!donation && exports_.length === 2);
  check(
    'exports have checklist + consent + selectedFields (BR17/20/22)',
    exports_.every((e) => e.checklistCompleted && e.consent && e.selectedFields.length > 0)
  );
  if (resale) {
    const resaleItem = items.find((i) => String(i._id) === String(resale.clothingId));
    check(
      'resale export item is not Damaged (BR21)',
      resaleItem && resaleItem.condition !== 'Damaged'
    );
  }

  // Notifications (deliverable: notification center, all emitter types)
  const notifs = await Notification.find({ userId: uid });
  const types = new Set(notifs.map((n) => n.type));
  const wanted = [
    'similarity_alert',
    'forgotten_item',
    'cooldown_reminder',
    'export_update',
    'recap_ready',
  ];
  check(
    `all 5 notification types present`,
    wanted.every((t) => types.has(t)),
    `have: ${[...types].join(', ')}`
  );
  check('mix of read and unread', notifs.some((n) => n.isRead) && notifs.some((n) => !n.isRead));

  // AI embeddings (live similarity demo prereq — warn, not fail)
  const missingEmbed = items.filter(
    (i) => i.status === 'Available' && (!i.aiEmbedding || i.aiEmbedding.length === 0)
  );
  if (missingEmbed.length > 0) {
    console.log(
      `WARN  ${missingEmbed.length} Available item(s) missing aiEmbedding — start the AI service and run scripts/backfillEmbeddings.js before the live similarity demo`
    );
  } else {
    console.log('PASS  all Available items have aiEmbedding');
  }

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
