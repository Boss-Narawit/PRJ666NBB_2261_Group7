const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clothingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    type: { type: String, required: true, enum: ['sale', 'donation', 'upcycle', 'resale'] },
    price: { type: Number }, // applicable when type is 'sale' or 'resale'
    description: { type: String },
    status: {
      type: String,
      enum: ['active', 'sold', 'donated', 'removed'],
      default: 'active',
    },
    checklistCompleted: { type: Boolean, default: false }, // BR17/BR20
    consent: { type: Boolean, default: false }, // BR17: explicit user consent required
    selectedFields: { type: [String], default: [] }, // BR22: user-chosen fields to share
  },
  { timestamps: true }
);

exportSchema.index({ status: 1 });
exportSchema.index({ userId: 1 });

module.exports = mongoose.model('Export', exportSchema);
