const mongoose = require('mongoose');
const WearLog = require('../models/WearLog');
const Clothing = require('../models/Clothing');
const { withTransaction } = require('../config/db');
const { WEARLOG_PAGE_SIZE } = require('../config/constants');

// WearLog.logDate is stored as midnight UTC. BR8: a user may log multiple wear
// logs ("outfits") on the same day — each is its own document, no merge/uniqueness.
const normalizeToMidnightUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// The same item listed twice in one outfit is meaningless — keep the first
// occurrence of each itemId (preserves its outfitId, if any).
const dedupeWornByItemId = (clothingWorn) => {
  const seen = new Set();
  const result = [];
  for (const c of clothingWorn) {
    const key = String(c.itemId);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
};

// BR9: wearCount/lastWornAt are derived from WearLogs — recompute from the
// authoritative source rather than incrementally drifting the cached values.
// Must run AFTER the triggering create/delete so the change is reflected.
const recomputeItemAnalytics = async (userId, itemIds, session) => {
  if (itemIds.length === 0) return;
  // aggregate() does not auto-cast like find() — convert ids explicitly.
  const userObjectId = new mongoose.Types.ObjectId(String(userId));
  const itemObjectIds = itemIds.map((id) => new mongoose.Types.ObjectId(String(id)));

  // One pass over the logs instead of a find+update per item. BR9 counts log
  // *documents* — the double $group collapses any legacy duplicate itemId
  // entries within a single log before counting.
  const stats = await WearLog.aggregate([
    { $match: { userId: userObjectId, 'clothingWorn.itemId': { $in: itemObjectIds } } },
    { $unwind: '$clothingWorn' },
    { $match: { 'clothingWorn.itemId': { $in: itemObjectIds } } },
    {
      $group: {
        _id: { logId: '$_id', itemId: '$clothingWorn.itemId' },
        logDate: { $first: '$logDate' },
      },
    },
    {
      $group: {
        _id: '$_id.itemId',
        wearCount: { $sum: 1 },
        lastWornAt: { $max: '$logDate' },
      },
    },
  ]).session(session);

  const statsByItemId = new Map(stats.map((s) => [String(s._id), s]));
  // Items with no remaining logs (e.g. after a delete) reset to 0 / null.
  await Clothing.bulkWrite(
    itemObjectIds.map((itemId) => {
      const s = statsByItemId.get(String(itemId));
      return {
        updateOne: {
          filter: { _id: itemId, userId: userObjectId },
          update: {
            $set: {
              'analytics.wearCount': s ? s.wearCount : 0,
              'analytics.lastWornAt': s ? s.lastWornAt : null,
            },
          },
        },
      };
    }),
    { session }
  );
};

const listWearLogs = async (userId, { page, limit, startDate, endDate } = {}) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || WEARLOG_PAGE_SIZE, 1),
    WEARLOG_PAGE_SIZE
  );

  // Optional logDate range. logDate is stored at midnight UTC, so an inclusive
  // endDate uses $lte on its own midnight. Invalid dates are ignored, not 400.
  const filter = { userId };
  const from = normalizeToMidnightUTC(startDate);
  const to = normalizeToMidnightUTC(endDate);
  if (from || to) {
    filter.logDate = {};
    if (from) filter.logDate.$gte = from;
    if (to) filter.logDate.$lte = to;
  }

  const [wearLogs, total] = await Promise.all([
    WearLog.find(filter)
      // _id tie-break: same-day outfits share a logDate (BR8), and skip/limit
      // pagination over an unstable sort can duplicate or drop ties across pages.
      .sort({ logDate: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('clothingWorn.itemId', 'name brand category imageUrl analytics.wearCount'),
    WearLog.countDocuments(filter),
  ]);

  return { wearLogs, total, page: safePage, limit: safeLimit };
};

const getWearLogById = async (userId, id) => {
  const log = await WearLog.findOne({ _id: id, userId }).populate(
    'clothingWorn.itemId',
    'name brand category imageUrl analytics.wearCount'
  );
  if (!log) {
    const e = new Error('Wear log not found');
    e.status = 404;
    throw e;
  }
  return log;
};

const createWearLog = async (userId, data) => {
  const { clothingWorn, occasion, notes, outfitName } = data;

  const logDate = normalizeToMidnightUTC(data.logDate);
  if (!logDate) {
    const e = new Error('logDate is required and must be a valid date');
    e.status = 422;
    throw e;
  }
  if (!Array.isArray(clothingWorn) || clothingWorn.length === 0) {
    const e = new Error('clothingWorn must be a non-empty array');
    e.status = 422;
    throw e;
  }

  const itemIds = [...new Set(clothingWorn.map((c) => String(c.itemId)))];

  // The same item worn twice in one outfit is meaningless — dedupe by itemId,
  // keeping the first occurrence (preserves any per-entry outfitId).
  const dedupedWorn = dedupeWornByItemId(clothingWorn);

  // BR8: each same-day log is its own document — always create a new one.
  // An item worn across two outfits the same day legitimately counts 2 wears (BR9).
  return withTransaction(async (session) => {
    // Items must belong to the requesting user's wardrobe — checked inside the
    // transaction so ownership is validated against the same snapshot as the write.
    const ownedCount = await Clothing.countDocuments(
      { _id: { $in: itemIds }, userId },
      { session }
    );
    if (ownedCount !== itemIds.length) {
      const e = new Error('One or more clothing items not found in your wardrobe');
      e.status = 422;
      throw e;
    }

    const [log] = await WearLog.create(
      [{ userId, logDate, clothingWorn: dedupedWorn, occasion, notes, outfitName }],
      { session }
    );
    await recomputeItemAnalytics(userId, itemIds, session);
    return log;
  });
};

// BR10: past wear logs are editable. Partial update of logDate/clothingWorn/
// occasion/notes/outfitName. Analytics are recomputed for the union of the items present
// before and after — editing the date alone changes an item's lastWornAt, so
// recompute always runs regardless of which fields changed.
const updateWearLog = async (userId, id, data) => {
  return withTransaction(async (session) => {
    const log = await WearLog.findOne({ _id: id, userId }).session(session);
    if (!log) {
      const e = new Error('Wear log not found');
      e.status = 404;
      throw e;
    }

    const oldItemIds = log.clothingWorn.map((c) => String(c.itemId));

    if (data.logDate !== undefined) {
      const logDate = normalizeToMidnightUTC(data.logDate);
      if (!logDate) {
        const e = new Error('logDate must be a valid date');
        e.status = 422;
        throw e;
      }
      log.logDate = logDate;
    }

    if (data.clothingWorn !== undefined) {
      if (!Array.isArray(data.clothingWorn) || data.clothingWorn.length === 0) {
        const e = new Error('clothingWorn must be a non-empty array');
        e.status = 422;
        throw e;
      }
      const newItemIds = [...new Set(data.clothingWorn.map((c) => String(c.itemId)))];
      const ownedCount = await Clothing.countDocuments(
        { _id: { $in: newItemIds }, userId },
        { session }
      );
      if (ownedCount !== newItemIds.length) {
        const e = new Error('One or more clothing items not found in your wardrobe');
        e.status = 422;
        throw e;
      }
      log.clothingWorn = dedupeWornByItemId(data.clothingWorn);
    }

    if (data.occasion !== undefined) log.occasion = data.occasion;
    if (data.notes !== undefined) log.notes = data.notes;
    if (data.outfitName !== undefined) log.outfitName = data.outfitName;

    // BR8 allows multiple logs per day, so moving a log onto an occupied day is fine.
    await log.save({ session });

    const finalItemIds = log.clothingWorn.map((c) => String(c.itemId));
    const affected = [...new Set([...oldItemIds, ...finalItemIds])];
    await recomputeItemAnalytics(userId, affected, session);

    return log;
  });
};

const deleteWearLog = async (userId, id) => {
  return withTransaction(async (session) => {
    const log = await WearLog.findOne({ _id: id, userId }).session(session);
    if (!log) {
      const e = new Error('Wear log not found');
      e.status = 404;
      throw e;
    }
    const itemIds = [...new Set(log.clothingWorn.map((c) => String(c.itemId)))];
    await WearLog.deleteOne({ _id: id, userId }, { session });
    // Recompute after the delete so the removed log no longer counts (BR9).
    await recomputeItemAnalytics(userId, itemIds, session);
    return { deleted: true };
  });
};

module.exports = {
  listWearLogs,
  getWearLogById,
  createWearLog,
  updateWearLog,
  deleteWearLog,
};
