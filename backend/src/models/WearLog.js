const mongoose = require('mongoose');

const wearLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    logDate: { type: Date, required: true }, // stored as midnight UTC
    clothingWorn: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
        outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit' },
      },
    ],
    outfitName: { type: String, trim: true },
    occasion: { type: String },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// BR8: multiple outfit logs per user per day are allowed. Non-unique index kept
// for date-range queries (listWearLogs filters/sorts by logDate).
wearLogSchema.index({ userId: 1, logDate: 1 });
wearLogSchema.index({ 'clothingWorn.itemId': 1 }); // multikey — per-item wear frequency queries

module.exports = mongoose.model('WearLog', wearLogSchema);
