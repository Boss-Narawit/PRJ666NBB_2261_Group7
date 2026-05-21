const mongoose = require('mongoose');
const { OUTFIT_SEASONS } = require('../config/constants');

const outfitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    clothingItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clothing' }],
    occasion: { type: String },
    season: { type: String, enum: OUTFIT_SEASONS },
    rating: { type: Number, min: 1, max: 5 },
    imageUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

outfitSchema.index({ userId: 1 });
outfitSchema.index({ clothingItems: 1 }); // multikey — supports reverse lookup by item

module.exports = mongoose.model('Outfit', outfitSchema);
