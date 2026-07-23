const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const Clothing = require('../models/Clothing');
const SimilarityCheck = require('../models/SimilarityCheck');
const Notification = require('../models/Notification');
const {
  SIMILARITY_THRESHOLD,
  AI_REQUEST_TIMEOUT_MS,
  AI_IMAGE_MAX_BYTES,
} = require('../config/constants');

// Atlas $vectorSearch reports cosine similarity normalized to (1 + cos) / 2, so
// score thresholds are in that [0,1] space — BR16's 0.70 *cosine* cutoff
// converts to an Atlas score of 0.85. toCosine converts a raw Atlas score back
// to true cosine similarity, clamped at 0 for anti-correlated vectors.
const DEFAULT_SCORE_THRESHOLD = (1 + SIMILARITY_THRESHOLD) / 2;
const toCosine = (score) => Math.max(0, score * 2 - 1);

// POSTs an image buffer to the fashion-clip service; returns the 512-dim vector.
const embedImageBuffer = async (buffer, filename = 'image.jpg') => {
  const form = new FormData();
  form.append('image_file', buffer, filename);
  const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/embed`, form, {
    headers: form.getHeaders(),
    timeout: AI_REQUEST_TIMEOUT_MS,
  });
  return aiResponse.data.embedding;
};

// SSRF guard: only fetch remote images over HTTPS, and never follow redirects.
// A client-supplied imageUrl could otherwise point at http://metadata or an
// internal host. timeout stops a hanging host from tying up the worker;
// maxContentLength caps the download size.
const embedImageUrl = async (imageUrl) => {
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch (err) {
    const e = new Error('Invalid image URL');
    e.status = 400;
    throw e;
  }
  if (parsed.protocol !== 'https:') {
    const e = new Error('Image URL must use HTTPS');
    e.status = 400;
    throw e;
  }
  const image = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: AI_REQUEST_TIMEOUT_MS,
    maxContentLength: AI_IMAGE_MAX_BYTES,
    maxRedirects: 0,
  });
  return embedImageBuffer(Buffer.from(image.data));
};

// Single best wardrobe match for an embedding, or null. BR19: archived/exported
// items never count — enforced with a post-$vectorSearch $match (rather than
// the index filter) so the Atlas index doesn't need `status` as a filter field;
// the batch limit of 20 leaves room for discarded non-Available top hits.
const findBestMatch = async (userId, embedding, scoreThreshold = DEFAULT_SCORE_THRESHOLD) => {
  const results = await Clothing.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'aiEmbedding',
        queryVector: embedding,
        numCandidates: 100,
        limit: 20,
        filter: { userId: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $project: {
        name: 1,
        imageUrl: 1,
        category: 1,
        status: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $match: {
        score: { $gte: scoreThreshold },
        status: 'Available',
      },
    },
    { $sort: { score: -1 } },
    { $limit: 1 },
  ]);
  return results[0] || null;
};

// Wardrobe similarity check for a newly created thoughtful purchase.
// BR6: skips silently when the purchase has no image. BR18: one SimilarityCheck
// per (purchase, item) pair — the unique index makes re-runs no-ops. BR16: a
// cosine score ≥ SIMILARITY_THRESHOLD emits a similarity_alert notification.
// Never throws — callers fire-and-forget and a failed check must not affect
// the purchase itself.
const runCheckForPurchase = async (purchase) => {
  try {
    if (!purchase.imageUrl) return; // BR6
    const embedding = await embedImageUrl(purchase.imageUrl);
    // Score threshold 0: always record the best match; BR16 decides below on
    // the true cosine value.
    const best = await findBestMatch(purchase.userId, embedding, 0);
    if (!best) return;

    const score = toCosine(best.score);
    let check;
    try {
      check = await SimilarityCheck.create({
        purchaseId: purchase._id,
        clothingId: best._id,
        score,
      });
    } catch (error) {
      if (error.code === 11000) return; // BR18: pair already checked
      throw error;
    }

    if (score >= SIMILARITY_THRESHOLD) {
      await Notification.create({
        userId: purchase.userId,
        type: 'similarity_alert',
        message: `"${purchase.itemName}" is ${Math.round(score * 100)}% similar to "${best.name}" already in your wardrobe.`,
        relatedId: purchase._id,
      });
      await SimilarityCheck.updateOne({ _id: check._id }, { alertSent: true });
    }
  } catch (error) {
    console.error(`Similarity check failed for purchase ${purchase._id}: ${error.message}`);
  }
};

// The fire-and-forget call is skipped under test (same precedent as the
// NODE_ENV=test bcrypt rounds): no AI service runs there, and dangling requests
// would outlive the per-test DB wipes. runCheckForPurchase is tested directly.
const scheduleCheckForPurchase = (purchase) => {
  if (process.env.NODE_ENV !== 'test') runCheckForPurchase(purchase);
};

module.exports = {
  embedImageBuffer,
  embedImageUrl,
  findBestMatch,
  runCheckForPurchase,
  scheduleCheckForPurchase,
  toCosine,
};
