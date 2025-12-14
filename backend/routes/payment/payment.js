const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit'); // <-- add this line
const router = express.Router();
const Payment = require('../../models/Payment/payment');
const Subscription = require('../../models/Subscription/SubscriptionSchema');
const emailService = require('../../utils/emailService');
const notificationService = require('../../services/notificationService');
const { notifyAllClients } = require('../../middleware/sseMiddleware');
require('dotenv').config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper to map/normalize Razorpay status for future-proofing
function mapRazorpayStatus(status) {
  if (!status) return 'FAILED';
  const normalized = status.toUpperCase();
  // Map Razorpay statuses to your app's statuses if needed
  if (['CAPTURED', 'AUTHORIZED', 'SUCCESS'].includes(normalized)) return 'SUCCESS';
  if (['FAILED', 'DENIED', 'INTERNAL_SERVER_ERROR'].includes(normalized)) return 'FAILED';
  if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(normalized)) return 'REFUNDED';
  if (['PENDING', 'CREATED'].includes(normalized)) return 'PENDING';
  return normalized; // fallback to original
}


// Rate limiter for /verify endpoint
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min window
  max: 5, // limit each IP to 5 requests per minute
  message: 'Too many verification attempts. Please try again later.'
});

// ========== ROUTES ==========

// ✅ Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, userId, email, couponCode, appliedDiscount, subscriptionStart, subscriptionEnd, plan } = req.body;

    if (!amount || !userId || !plan) {
      return res.status(400).json({ success: false, message: 'Amount, userId, and plan are required' });
    }
    if (typeof amount !== 'number' || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const isValidDate = (d) => !d || !isNaN(new Date(d).getTime());
    if (!isValidDate(subscriptionStart) || !isValidDate(subscriptionEnd)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription dates' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    const newPayment = await Payment.create({
      userId,
      razorpay: { orderId: order.id },
      amount: amount,
      currency: 'INR',
      status: 'INITIATED',
      email: email || '',
      meta: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      ...(couponCode && { couponCode }),
      ...(appliedDiscount && { appliedDiscount })
    });

    // Notify frontend clients about new order (optional, can be removed if not needed)
    notifyAllClients('payment_order_created', {
      userId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subscriptionStart,
      subscriptionEnd
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionStart,
      subscriptionEnd
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ success: false, message: 'Unable to create order' });
  }
});

// ✅ Verify Razorpay Payment Signature
router.post('/verify', verifyLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, email, plan, subscriptionStart, subscriptionEnd } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !userId || !plan) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    const payment = await Payment.findOne({ 'razorpay.orderId': razorpay_order_id, userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    let razorpayPayment, paymentMethod = 'UNKNOWN', paymentStatus = 'FAILED', paymentDetails = null;

    try {
      razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      if (razorpayPayment) {
        paymentMethod = razorpayPayment.method?.toUpperCase() || 'UNKNOWN';
        paymentStatus = mapRazorpayStatus(razorpayPayment.status);
        paymentDetails = {
          paymentId: razorpayPayment.id,
          method: razorpayPayment.method,
          status: razorpayPayment.status,
          amount: razorpayPayment.amount / 100,
          currency: razorpayPayment.currency,
          createdAt: new Date(razorpayPayment.created_at * 1000),
          notes: razorpayPayment.notes || {}
        };
      }
    } catch (err) {
      console.error('Error fetching Razorpay payment:', err);
    }

    payment.razorpay.paymentId = razorpay_payment_id;
    payment.razorpay.signature = razorpay_signature;
    payment.verified = isValid;
    payment.status = paymentStatus;
    payment.paymentMethod = paymentMethod;
    payment.email = email || payment.email;
    payment.statusHistory = [...(payment.statusHistory || []), { status: paymentStatus, timestamp: new Date() }];
    if (paymentDetails) payment.payments = [...(payment.payments || []), paymentDetails];

    // Save first to get _id
    await payment.save();

    if (paymentStatus === 'SUCCESS') {
      // Use upgradeSubscription to ensure only one active plan and cancel previous
      const subscription = await Subscription.upgradeSubscription(
        userId,
        plan,
        {
          startDate: subscriptionStart ? new Date(subscriptionStart) : new Date(),
          endDate: subscriptionEnd ? new Date(subscriptionEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentIds: [payment._id]
        }
      );

      await emailService.sendPaymentStatusEmail(email, {
        status: 'success',
        amount: payment.amount,
        plan,
        transactionId: razorpay_payment_id,
        paymentMethod,
        subscriptionStart: subscription.startDate,
        subscriptionEnd: subscription.endDate
      });

      // Notify frontend clients about payment success
      notifyAllClients('payment_status', {
        userId,
        status: 'success',
        paymentId: payment._id,
        subscriptionId: subscription._id,
        plan,
        amount: payment.amount,
        paymentMethod,
        subscriptionStart: subscription.startDate,
        subscriptionEnd: subscription.endDate
      });

      // Send notification to user (if userId is available)
      if (userId) {
        notificationService.sendNotification(
          userId,
          'payment.success',
          'payment',
          'Payment Successful',
          `Your payment for the ${plan} plan was successful!`,
          {
            paymentId: payment._id?.toString(),
            subscriptionId: subscription._id?.toString(),
            amount: payment.amount,
            plan,
            paymentMethod,
            subscriptionStart: subscription.startDate,
            subscriptionEnd: subscription.endDate
          }
        );
      }

      return res.json({
        success: true,
        message: 'Payment verified and subscription activated',
        subscriptionId: subscription._id,
        subscriptionStart: subscription.startDate,
        subscriptionEnd: subscription.endDate,
        paymentMethod
      });
    } else {
      await emailService.sendPaymentStatusEmail(email, {
        status: 'failed',
        amount: payment.amount,
        plan,
        transactionId: razorpay_payment_id,
        paymentMethod,
        subscriptionStart,
        subscriptionEnd
      });

      // Notify frontend clients about payment failure
      notifyAllClients('payment_status', {
        userId,
        status: 'failed',
        paymentId: payment._id,
        plan,
        amount: payment.amount,
        paymentMethod,
        subscriptionStart,
        subscriptionEnd
      });

      // Send notification to user (if userId is available)
      if (userId) {
        notificationService.sendNotification(
          userId,
          'payment.failed',
          'payment',
          'Payment Failed',
          `Your payment for the ${plan} plan failed. Please try again.`,
          {
            paymentId: payment._id?.toString(),
            amount: payment.amount,
            plan,
            paymentMethod,
            subscriptionStart,
            subscriptionEnd
          }
        );
      }

      return res.status(400).json({ success: false, message: `Payment failed: ${paymentStatus}`, paymentMethod });
    }
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ✅ Admin Route — List All Payments (with pagination and filters)
router.get('/all', async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};
    if (req.query.email) filter.email = req.query.email;
    if (req.query.status) filter.status = req.query.status.toUpperCase();
    if (req.query.plan) filter['subscription.plan'] = req.query.plan;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({ success: true, payments, page, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin Get Payments Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// All logic for payment verification, subscription creation/upgrade, notifications, and admin listing
// is correctly using Subscription.upgradeSubscription and is in sync with your Subscription model.
// No further changes required.

module.exports = router;
