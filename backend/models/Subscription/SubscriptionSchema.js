
// --- Imports ---
const mongoose = require('mongoose');
// Note: Avoid requiring User here to prevent circular dependencies

// --- Schema Definition ---
const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  plan: {
    type: String,
    required: true,
    trim: true,
    uppercase: true, // e.g., BASIC, PRO, PREMIUM
  },

  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true
  },

  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  endDate: {
    type: Date,
    required: true
  },

  autoRenew: {
    type: Boolean,
    default: false
  },

  paymentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  ],

}, {
  timestamps: true,
  versionKey: false
});


// --- Helper: Compute Status ---
function getComputedStatus(startDate, endDate, now = new Date()) {
  // Always use UTC for consistency
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && now < start) return 'INACTIVE';
  if (end && now > end) return 'INACTIVE';
  if (start && end && now >= start && now <= end) return 'ACTIVE';
  return undefined; // fallback to stored status
}

// --- Pre-Validation: Set Default endDate ---
SubscriptionSchema.pre('validate', function (next) {
  if (this.isNew && !this.endDate && this.startDate) {
    // Always use UTC
    this.endDate = new Date(this.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});


// --- Virtuals ---
SubscriptionSchema.virtual('isActive').get(function() {
  // Use helper for status
  return getComputedStatus(this.startDate, this.endDate) === 'ACTIVE';
});

SubscriptionSchema.virtual('computedStatus').get(function() {
  return getComputedStatus(this.startDate, this.endDate) || this.status;
});


SubscriptionSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diff = new Date(this.endDate).getTime() - now.getTime();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});


// --- Transform Output: Always return computed status ---
function computedStatusTransform(doc, ret) {
  const computed = getComputedStatus(ret.startDate, ret.endDate);
  if (computed) ret.status = computed;
  return ret;
}
SubscriptionSchema.set('toJSON', { virtuals: true, transform: computedStatusTransform });
SubscriptionSchema.set('toObject', { virtuals: true, transform: computedStatusTransform });


// --- Pre-save: Ensure status is always consistent ---
SubscriptionSchema.pre('save', function (next) {
  const computed = getComputedStatus(this.startDate, this.endDate);
  if (computed) this.status = computed;
  next();
});


// --- Pre-save: Ensure only one active subscription per user ---
// Note: This is not fully race-condition safe; for full safety, use a unique partial index in MongoDB.
SubscriptionSchema.pre('save', async function(next) {
  if (this.status === 'ACTIVE') {
    const Subscription = mongoose.model('Subscription');
    const existingActive = await Subscription.findOne({
      userId: this.userId,
      status: 'ACTIVE',
      _id: { $ne: this._id }
    });
    if (existingActive) {
      const err = new Error('User already has an active subscription.');
      err.name = 'ValidationError';
      return next(err);
    }
  }
  next();
});

// --- Pre-save: Auto-cancel all but the most recent active subscription for the user ---
SubscriptionSchema.pre('save', async function(next) {
  if (this.status === 'ACTIVE') {
    const Subscription = mongoose.model('Subscription');
    // Find all active subscriptions for the user, sorted by startDate descending
    const activeSubs = await Subscription.find({ userId: this.userId, status: 'ACTIVE', _id: { $ne: this._id } }).sort({ startDate: -1 });
    if (activeSubs.length > 0) {
      // Keep the most recent (including this one if it's new), cancel the rest
      const toCancel = activeSubs.map(sub => sub._id);
      await Subscription.updateMany({ _id: { $in: toCancel } }, { $set: { status: 'CANCELLED' } });
    }
  }
  next();
});


// --- Statics ---
// Bulk expire subscriptions (useful for cron jobs)
SubscriptionSchema.statics.expireOldSubscriptions = async function() {
  await this.updateMany(
    { endDate: { $lt: new Date() }, status: { $ne: 'INACTIVE' } },
    { $set: { status: 'INACTIVE' } }
  );
};

// Cancel all but the most recent active subscription for a user
SubscriptionSchema.statics.cancelOldActiveSubscriptions = async function(userId) {
  // Find all active subscriptions for the user, sorted by startDate descending
  const activeSubs = await this.find({ userId, status: 'ACTIVE' }).sort({ startDate: -1 });
  if (activeSubs.length > 1) {
    // Keep the most recent, cancel the rest
    const toCancel = activeSubs.slice(1).map(sub => sub._id);
    await this.updateMany({ _id: { $in: toCancel } }, { $set: { status: 'CANCELLED' } });
  }
};


// Upgrade a user's subscription plan
SubscriptionSchema.statics.upgradeSubscription = async function(userId, newPlan, options = {}) {
  await this.updateMany(
    { userId, status: 'ACTIVE' },
    { $set: { status: 'CANCELLED' } }
  );
  const subscription = await this.create({
    userId,
    plan: newPlan,
    status: 'ACTIVE',
    startDate: options.startDate || new Date(),
    endDate: options.endDate, // will default if not set
    autoRenew: options.autoRenew || false,
    paymentIds: options.paymentIds || []
  });
  return subscription;
};

// --- Post-find: Update expired/not-yet-active subscriptions' status ---
// For large datasets, recommend using a scheduled job (cron) to update statuses in bulk for scalability.
// This hook is best-effort for small result sets (e.g., user dashboard), not for admin/bulk queries.
async function updateExpiredStatus(docs) {
  const now = new Date();
  if (Array.isArray(docs)) {
    if (docs.length > 100) {
      // For large arrays, skip DB writes for performance; recommend background job for production
      docs.forEach(doc => {
        if (!doc) return;
        const computed = getComputedStatus(doc.startDate, doc.endDate, now);
        if (computed) doc.status = computed;
      });
      return;
    }
    const updates = [];
    docs.forEach(doc => {
      if (!doc || !doc._id) return;
      const computed = getComputedStatus(doc.startDate, doc.endDate, now);
      if (computed && doc.status !== computed) {
        const Subscription = mongoose.model('Subscription');
        updates.push(Subscription.updateOne({ _id: doc._id }, { $set: { status: computed } }));
        doc.status = computed;
      }
    });
    if (updates.length) await Promise.all(updates);
  } else if (docs && docs._id) {
    const computed = getComputedStatus(docs.startDate, docs.endDate, now);
    if (computed && docs.status !== computed) {
      const Subscription = mongoose.model('Subscription');
      await Subscription.updateOne({ _id: docs._id }, { $set: { status: computed } });
      docs.status = computed;
    }
  }
}

// --- Post-save: Add subscription to user (safe with mongoose.model) ---
SubscriptionSchema.post('save', async function (doc, next) {
  try {
    const User = mongoose.model('User'); // avoid require loop
    await User.findByIdAndUpdate(
      doc.userId,
      { $addToSet: { subscriptions: doc._id } },
      { new: true }
    );
    next();
  } catch (err) {
    console.error('[Subscription->post save] Error updating user with subscription:', err);
    next(err);
  }
});


SubscriptionSchema.post('find', updateExpiredStatus);
SubscriptionSchema.post('findOne', updateExpiredStatus);

// --- Post-find: Auto-cancel all but the most recent active subscription for a user if more than one is found ---
async function autoCancelExtraActiveSubscriptions(docs) {
  const Subscription = mongoose.model('Subscription');
  const now = new Date();
  // Normalize docs to array
  const docArray = Array.isArray(docs) ? docs : [docs];
  // Group by userId
  const userSubs = {};
  docArray.forEach(doc => {
    if (doc && doc.userId && doc.status === 'ACTIVE') {
      const key = doc.userId.toString();
      if (!userSubs[key]) userSubs[key] = [];
      userSubs[key].push(doc);
    }
  });
  // For each user, if more than one active, cancel all but the most recent
  for (const userId in userSubs) {
    const activeSubs = userSubs[userId].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    if (activeSubs.length > 1) {
      const toCancel = activeSubs.slice(1).map(sub => sub._id);
      await Subscription.updateMany({ _id: { $in: toCancel } }, { $set: { status: 'CANCELLED' } });
    }
  }
}

SubscriptionSchema.post('find', autoCancelExtraActiveSubscriptions);
SubscriptionSchema.post('findOne', autoCancelExtraActiveSubscriptions);


// --- Indexes & TTL ---
// For auto-expiry, enable this TTL index if you want MongoDB to delete expired subscriptions automatically:
// SubscriptionSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

// For race-condition safety on one-active-subscription-per-user, use a partial unique index (run in Mongo shell):
// db.subscriptions.createIndex({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' } })


// --- Export ---
module.exports = mongoose.model('Subscription', SubscriptionSchema);
