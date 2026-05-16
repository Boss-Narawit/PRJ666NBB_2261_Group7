const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    clothingItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clothing' }],
    occasion: { type: String },
    season: { type: String, enum: ['spring', 'summer', 'fall', 'winter', 'all'] },
    rating: { type: Number, min: 1, max: 5 },
    imageUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

outfitSchema.index({ userId: 1 });
outfitSchema.index({ clothingItems: 1 }); // multikey — supports reverse lookup by item

module.exports = mongoose.model('Outfit', outfitSchema);
