const mongoose = require('mongoose');

const similarityCheckSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThoughtfulPurchase',
      required: true,
    },
    clothingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
    score: { type: Number, required: true, min: 0, max: 1 }, // 0.0–1.0 from AI service
    alertSent: { type: Boolean, default: false }, // true once score ≥ 0.70 notification sent (BR16)
  },
  { timestamps: true }
);

similarityCheckSchema.index({ purchaseId: 1, clothingId: 1 }, { unique: true }); // BR18: check once per pair
similarityCheckSchema.index({ purchaseId: 1 });

module.exports = mongoose.model('SimilarityCheck', similarityCheckSchema);
