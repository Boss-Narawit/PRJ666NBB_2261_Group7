const mongoose = require('mongoose');
const {
  CLOTHING_CATEGORIES,
  CLOTHING_CONDITIONS,
  CLOTHING_STATUSES,
} = require('../config/constants');

const clothingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: CLOTHING_CATEGORIES },
    colors: {
      type: [String],
      required: true,
      validate: {
        // BR4: `required` alone accepts an empty array on array paths.
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'colors must contain at least one color',
      },
    },
    size: { type: String, required: true },
    imageUrl: { type: String, required: true },
    condition: { type: String, required: true, enum: CLOTHING_CONDITIONS },
    status: { type: String, enum: CLOTHING_STATUSES, default: 'Available' },
    purchasePrice: { type: Number },
    purchaseDate: { type: Date },
    tags: { type: [String], default: [] },
    aiEmbedding: { type: [Number], default: [] }, // fashion-clip vector set by AI service
    notes: { type: String },
    analytics: {
      wearCount: { type: Number, default: 0 },
      lastWornAt: { type: Date },
      lastNotifiedAt: { type: Date }, // throttle forgotten-item re-notify (BR13)
    },
    // Denormalized snapshot of where the item was exported — set by
    // export.service when status flips to 'Exported'. Authoritative record is
    // the Export collection; this is a display cache (like analytics.wearCount).
    exportInfo: {
      partnerName: { type: String },
      type: { type: String }, // 'resale' | 'donation' — matches the Export type
      exportedAt: { type: Date },
    },
  },
  { timestamps: true }
);

clothingSchema.index({ userId: 1 });
clothingSchema.index({ userId: 1, category: 1 });
clothingSchema.index({ userId: 1, status: 1, 'analytics.lastWornAt': 1 }); // forgotten items job: prefix covers {userId,status} queries (BR11/BR13)

module.exports = mongoose.model('Clothing', clothingSchema);
