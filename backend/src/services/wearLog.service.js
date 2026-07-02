const WearLog = require('../models/WearLog');
const Clothing = require('../models/Clothing');
const { withTransaction } = require('../config/db');
const { WEARLOG_PAGE_SIZE } = require('../config/constants');

// WearLog.logDate is stored as midnight UTC (one log per user per day, BR8).
const normalizeToMidnightUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// BR9: wearCount/lastWornAt are derived from WearLogs — recompute from the
// authoritative source rather than incrementally drifting the cached values.
// Must run AFTER the triggering create/delete so the change is reflected.
const recomputeItemAnalytics = async (userId, itemIds, session) => {
  for (const itemId of itemIds) {
    const logs = await WearLog.find({ userId, 'clothingWorn.itemId': itemId }, 'logDate', {
      session,
    }).sort({ logDate: -1 });
    await Clothing.updateOne(
      { _id: itemId, userId },
      {
        $set: {
          'analytics.wearCount': logs.length,
          'analytics.lastWornAt': logs[0] ? logs[0].logDate : null,
        },
      },
      { session }
    );
  }
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
      .sort({ logDate: -1 })
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
  const { clothingWorn, occasion, notes } = data;

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
  // Items must belong to the requesting user's wardrobe.
  const ownedCount = await Clothing.countDocuments({
    _id: { $in: itemIds },
    userId,
  });
  if (ownedCount !== itemIds.length) {
    const e = new Error('One or more clothing items not found in your wardrobe');
    e.status = 422;
    throw e;
  }

  // BR8: one log document per day. A same-day create merges its items into that
  // day's existing log (deduped by itemId) instead of erroring, so a user can log
  // several items across the day. (Moving a log onto an occupied day via PATCH
  // still 409s through the unique index — see updateWearLog.)
  return withTransaction(async (session) => {
    const existing = await WearLog.findOne({ userId, logDate }).session(session);
    let log;
    if (existing) {
      const present = new Set(existing.clothingWorn.map((c) => String(c.itemId)));
      for (const c of clothingWorn) {
        if (!present.has(String(c.itemId))) {
          existing.clothingWorn.push(c);
          present.add(String(c.itemId));
        }
      }
      // A merge only fills occasion/notes the day's log doesn't have yet —
      // never overwrites, but no longer silently drops them either.
      if (occasion !== undefined && !existing.occasion) existing.occasion = occasion;
      if (notes !== undefined && !existing.notes) existing.notes = notes;
      log = await existing.save({ session });
    } else {
      [log] = await WearLog.create([{ userId, logDate, clothingWorn, occasion, notes }], {
        session,
      });
    }
    await recomputeItemAnalytics(userId, itemIds, session);
    return log;
  });
};

// BR10: past wear logs are editable. Partial update of logDate/clothingWorn/
// occasion/notes. Analytics are recomputed for the union of the items present
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
      log.clothingWorn = data.clothingWorn;
    }

    if (data.occasion !== undefined) log.occasion = data.occasion;
    if (data.notes !== undefined) log.notes = data.notes;

    // Duplicate-day (BR8) surfaces as a 11000 key error → errorHandler maps to 409.
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
