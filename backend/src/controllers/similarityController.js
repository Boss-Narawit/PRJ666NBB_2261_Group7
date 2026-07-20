const similarityService = require('../services/similarity.service');

// Manual "AI Similarity Check" from the thoughtful-purchase screen: embeds the
// uploaded photo and returns the single best Available wardrobe match,
// unconditionally (no score floor — the client owns the ≥70% messaging).
// `score` is true cosine similarity in [0,1] (clamped at 0), same space as
// persisted SimilarityChecks; the Atlas (1 + cos) / 2 normalization stays
// internal to similarity.service.
exports.checkSimilarity = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Wishlist image is required for similarity check.' });
    }

    const embedding = await similarityService.embedImageBuffer(
      req.file.buffer,
      req.file.originalname
    );
    const best = await similarityService.findBestMatch(req.user.userId, embedding, 0);

    const bestMatch = best
      ? {
          id: best._id,
          name: best.name,
          imageUrl: best.imageUrl,
          score: similarityService.toCosine(best.score),
        }
      : null;

    return res.status(200).json({
      message: 'Similarity check complete',
      matchesFound: !!bestMatch,
      match: bestMatch,
    });
  } catch (error) {
    console.error('Similarity Check Error:', error);
    return res.status(500).json({ message: 'Failed to perform AI similarity check.' });
  }
};
