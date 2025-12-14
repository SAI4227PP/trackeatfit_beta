const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FLAT'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTill: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1000
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  applicablePlans: [
    {
      type: String
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },

  // ✅ Add this field
  description: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
