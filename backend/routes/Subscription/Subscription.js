

const Subscription = require('../../models/Subscription/SubscriptionSchema');
const Payment = require('../../models/Payment/payment');

const express = require('express');
const router = express.Router();

// GET /subscriptions - List all subscriptions (basic example)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    // Populate paymentIds to get payment method and amount
    const subscriptions = await Subscription.find(filter).populate({
      path: 'paymentIds',
      select: 'paymentMethod amount status',
      model: Payment
    });

    // Only return payments (renamed from paymentIds) to avoid duplication
    const formatted = subscriptions.map(sub => {
      const obj = sub.toObject();
      // Map payments to include status
      obj.payments = (obj.paymentIds || []).map(p => p ? {
        _id: p._id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status
      } : null);
      delete obj.paymentIds;
      // Remove the virtual 'id' field to avoid duplication
      delete obj.id;
      return obj;
    });

    res.json({ success: true, subscriptions: formatted });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

module.exports = router;
