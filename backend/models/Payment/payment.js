const mongoose = require('mongoose');

const subPaymentSchema = new mongoose.Schema({
  paymentId: { type: String, trim: true },
  method: { type: String, trim: true },
  status: { type: String, trim: true },
  amount: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  createdAt: { type: Date, default: Date.now },
  notes: mongoose.Schema.Types.Mixed
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false // <-- make it optional
  },

  razorpay: {
    orderId: { type: String, required: true, trim: true },
    paymentId: { type: String, trim: true },
    signature: { type: String, trim: true }
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },

  status: {
    type: String,
    enum: ['INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'INITIATED',
    index: true
  },

  statusHistory: [
    {
      status: { type: String },
      timestamp: { type: Date }
    }
  ],

  paymentMethod: {
    type: String,
    enum: ['CARD', 'UPI', 'NETBANKING', 'WALLET', 'UNKNOWN'],
    default: 'UNKNOWN'
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'],
    index: true
  },

  couponCode: {
    type: String,
    trim: true,
    match: [/^[A-Z0-9_-]+$/, 'Invalid coupon code format'],
    default: null
  },

  appliedDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  verified: {
    type: Boolean,
    default: false
  },

  transactionRef: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },

  meta: {
    userAgent: { type: String, trim: true },
    ip: { type: String, trim: true }
  },

  payments: [subPaymentSchema]

}, {
  timestamps: true,
  versionKey: false
});

paymentSchema.index({ userId: 1, subscriptionId: 1 });
paymentSchema.index({ 'razorpay.orderId': 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
