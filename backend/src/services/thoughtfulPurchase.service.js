const ThoughtfulPurchase = require('../models/ThoughtfulPurchase');
const { COOLDOWN_MIN_MINUTES } = require('../config/constants');
const { scheduleCheckForPurchase } = require('./similarity.service');

// Purchase lifecycle: pending → approved | rejected. Decisions are final —
// a decided purchase can never be re-decided (422), and approval is further
// gated by the BR15 cooling-off timer (400 while it runs).

const createPurchase = async (userId, data) => {
  // BR14: the cooling-off period must be at least 24h (1440 min) from now.
  const cooldownMinutes = Number(data.cooldownMinutes);
  if (!Number.isFinite(cooldownMinutes) || cooldownMinutes < COOLDOWN_MIN_MINUTES) {
    const e = new Error(`cooldownMinutes must be at least ${COOLDOWN_MIN_MINUTES}`);
    e.status = 400;
    throw e;
  }
  const cooldownEndsAt = new Date(Date.now() + cooldownMinutes * 60 * 1000);

  const purchase = await ThoughtfulPurchase.create({
    userId,
    itemName: data.itemName,
    description: data.description,
    imageUrl: data.imageUrl,
    estimatedPrice: data.estimatedPrice,
    sourceUrl: data.sourceUrl,
    cooldownEndsAt,
    status: 'pending',
  });

  // BR16/BR18: record the wardrobe similarity check for this purchase and
  // alert on a ≥70% match. Fire-and-forget — the purchase must succeed even
  // if the AI service is down (the manual check button still works later).
  scheduleCheckForPurchase(purchase);

  return purchase;
};

const getPurchases = (userId) => ThoughtfulPurchase.find({ userId }).sort({ createdAt: -1 });

const getPurchase = async (userId, purchaseId) => {
  const purchase = await ThoughtfulPurchase.findOne({ _id: purchaseId, userId });
  if (!purchase) {
    const e = new Error('Purchase not found');
    e.status = 404;
    throw e;
  }
  return purchase;
};

const decidePurchase = async (userId, purchaseId, decision) => {
  const purchase = await getPurchase(userId, purchaseId);

  // Only a pending purchase can be decided — a rejected purchase must not
  // flip to approved (or vice versa).
  if (purchase.status !== 'pending') {
    const e = new Error('Purchase has already been decided');
    e.status = 422;
    throw e;
  }

  // BR15: approval must wait out the cooling-off timer; rejecting early is fine.
  if (decision === 'approved' && purchase.cooldownEndsAt > new Date()) {
    const e = new Error('Cooling-off period has not ended yet');
    e.status = 400;
    throw e;
  }

  purchase.status = decision;
  await purchase.save();
  return purchase;
};

const approvePurchase = (userId, purchaseId) => decidePurchase(userId, purchaseId, 'approved');
const rejectPurchase = (userId, purchaseId) => decidePurchase(userId, purchaseId, 'rejected');

module.exports = {
  createPurchase,
  getPurchases,
  getPurchase,
  approvePurchase,
  rejectPurchase,
};
