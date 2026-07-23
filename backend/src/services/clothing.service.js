const Clothing = require('../models/Clothing');
const User = require('../models/User');
const { forgottenFilter, MS_PER_DAY } = require('./dashboard.service');
const { embedImageUrl } = require('./similarity.service');
const { MAX_CLOTHING_BATCH, MAX_CLOTHING_IMAGES } = require('../config/constants');

// Only these fields are client-writable — userId, analytics (BR9), aiEmbedding,
// and exportInfo are server-managed and must never come from the request body.
// `status` is handled separately in updateClothingItem behind a transition guard
// (only the export flow may set 'Exported'), so it is intentionally excluded
// here — create paths silently ignore a client-sent status and default to
// 'Available' via the schema.
const EDITABLE_FIELDS = [
  'name',
  'brand',
  'category',
  'colors',
  'size',
  'imageUrl',
  'images',
  'condition',
  'purchasePrice',
  'purchaseDate',
  'tags',
  'notes',
];

const pickEditableFields = (body) => {
  const picked = {};
  // Guard null and non-object entries (a default parameter only covers undefined).
  if (!body || typeof body !== 'object') return picked;
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

const httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

// Keep the images[] gallery and the imageUrl cover in agreement before any
// write: imageUrl is always images[0]. Older single-image clients send only
// imageUrl; the multi-image UI sends images[]. Accepts either and derives the
// other, enforcing the per-item photo cap. Runs on the already-whitelisted
// fields so it never introduces non-editable keys.
const reconcileImages = (fields) => {
  const out = { ...fields };
  if (out.images !== undefined) {
    if (!Array.isArray(out.images)) {
      throw httpError(422, 'images must be an array of image URLs');
    }
    const cleaned = out.images.filter((u) => typeof u === 'string' && u.trim());
    // At least one image is required — imageUrl is a required cover (BR4).
    if (cleaned.length === 0) throw httpError(422, 'At least one image is required');
    if (cleaned.length > MAX_CLOTHING_IMAGES) {
      throw httpError(422, `Cannot add more than ${MAX_CLOTHING_IMAGES} images per item`);
    }
    out.images = cleaned;
    out.imageUrl = cleaned[0]; // cover = first image
  } else if (out.imageUrl !== undefined) {
    // Single-image client (or a prefilled hosted URL) — mirror the cover into
    // the gallery so both fields are always populated.
    out.images = [out.imageUrl];
  }
  return out;
};

// Fetches each item's image and stamps Clothing.aiEmbedding via the AI service
// so new items are visible to the similarity check's vector search. Runs
// fire-and-forget after create responds — a create must never fail or slow down
// because the AI service is down; items that miss embedding here are picked up
// by scripts/backfillEmbeddings.js. Sequential on purpose: a bulk create (up to
// BR5's 50 items) would otherwise stampede the single-worker AI service.
const embedNewItems = async (items) => {
  for (const item of items) {
    try {
      const embedding = await embedImageUrl(item.imageUrl);
      await Clothing.updateOne({ _id: item._id }, { aiEmbedding: embedding });
    } catch (error) {
      console.error(`AI embedding failed for clothing ${item._id}: ${error.message}`);
    }
  }
};

// The fire-and-forget call is skipped under test (same precedent as the
// NODE_ENV=test bcrypt rounds): no AI service runs there, and dangling requests
// would outlive the per-test DB wipes. embedNewItems is exported and tested
// directly instead.
const scheduleEmbedding = (items) => {
  if (process.env.NODE_ENV !== 'test') embedNewItems(items);
};

const createClothing = async (userId, body) => {
  const clothing = await Clothing.create({
    ...reconcileImages(pickEditableFields(body)),
    userId,
  });
  scheduleEmbedding([clothing]);
  return clothing;
};

const bulkCreateClothing = async (userId, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(422, 'Request body must be a non-empty array of items');
  }
  // BR5: max items per batch.
  if (items.length > MAX_CLOTHING_BATCH) {
    throw httpError(422, `Cannot add more than ${MAX_CLOTHING_BATCH} items per batch`);
  }
  // Items always belong to the requester — never trust a client-sent userId.
  const created = await Clothing.insertMany(
    items.map((item) => ({
      ...reconcileImages(pickEditableFields(item)),
      userId,
    }))
  );
  scheduleEmbedding(created);
  return created;
};

const getWardrobe = (userId) => Clothing.find({ userId });

const getClothingItem = async (userId, id) => {
  const clothing = await Clothing.findOne({ _id: id, userId });
  if (!clothing) throw httpError(404, 'Clothing item not found');
  return clothing;
};

const updateClothingItem = async (userId, id, body) => {
  const update = reconcileImages(pickEditableFields(body));
  const filter = { _id: id, userId };

  // status is a state-machine field, not a plain editable field: only the
  // export flow may set 'Exported', and once exported an item's status is
  // final (prevents faking an export or re-exporting the same item, which
  // would bypass BR6/BR17/BR20/BR21). Archived <-> Available stays open.
  if (body && body.status !== undefined) {
    // Bad enum strings reject via runValidators below, but null would slip
    // through (enum validators skip null) and silently unset the field —
    // the item would then vanish from every status-filtered view.
    if (body.status === null) throw httpError(422, 'Invalid status value');
    if (body.status === 'Exported') {
      throw httpError(422, 'Only the export flow can set status to Exported');
    }
    update.status = body.status;
    // "Exported is final" is enforced in the query filter itself — one fetch
    // on the happy path; the ambiguous null result is disambiguated below.
    filter.status = { $ne: 'Exported' };
  }

  // A changed cover (images[0]) invalidates the cached fashion-clip vector —
  // clear it in the same write (never let similarity match against a replaced
  // photo) and re-embed in the background below. Adding/removing a *non-cover*
  // photo leaves the cover unchanged, so it must NOT touch the embedding: doing
  // so would drop the item out of similarity search (BR19) until the re-embed
  // lands. Only read the current cover when an image field is actually in the
  // update (rename-only PATCHes stay single-fetch).
  let coverChanged = false;
  if (update.imageUrl !== undefined) {
    const current = await Clothing.findOne({ _id: id, userId }).select('imageUrl');
    coverChanged = !current || current.imageUrl !== update.imageUrl;
    if (coverChanged) update.aiEmbedding = [];
  }

  const updated = await Clothing.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true, // reject invalid enum/required values instead of saving silently (BR4/BR7)
  });

  if (!updated) {
    if (body && body.status !== undefined) {
      // Missed the filter: either the item doesn't exist or it's Exported.
      const current = await Clothing.findOne({ _id: id, userId }).select('status');
      if (current && current.status === 'Exported') {
        throw httpError(422, "An exported item's status is final");
      }
    }
    throw httpError(404, 'Clothing item not found');
  }
  if (coverChanged) scheduleEmbedding([updated]);
  return updated;
};

const deleteClothingItem = async (userId, id) => {
  const deleted = await Clothing.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw httpError(404, 'Clothing item not found');
  return deleted;
};

const getForgottenItemsForUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, 'User not found');

  const thresholdDays = user.preferences.forgottenItemThresholdDays;
  const cutoff = new Date(Date.now() - thresholdDays * MS_PER_DAY);

  // Shared definition with the dashboard + job so counts never disagree (BR11/BR23).
  return Clothing.find(forgottenFilter(userId, cutoff));
};

module.exports = {
  createClothing,
  bulkCreateClothing,
  embedNewItems,
  getWardrobe,
  getClothingItem,
  updateClothingItem,
  deleteClothingItem,
  getForgottenItemsForUser,
};
