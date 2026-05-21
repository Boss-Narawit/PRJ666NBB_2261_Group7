const mongoose = require('mongoose');
const { PURCHASE_STATUSES } = require('../config/constants');

const thoughtfulPurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemName: { type: String, required: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    estimatedPrice: { type: Number },
    sourceUrl: { type: String },
    cooldownEndsAt: { type: Date, required: true }, // BR14: must be ≥ 1440 min from createdAt
    status: { type: String, enum: PURCHASE_STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

thoughtfulPurchaseSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('ThoughtfulPurchase', thoughtfulPurchaseSchema);
