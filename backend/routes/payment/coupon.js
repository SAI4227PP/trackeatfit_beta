const express = require('express');
const Coupon = require('../../models/Payment/Coupon'); // Adjust the path as necessary
const router = express.Router();

// ===== Utility Functions ===== //
const isCouponExpired = (coupon) => {
  const now = new Date();
  return now < coupon.validFrom || now > coupon.validTill;
};

const calculateDiscount = (coupon, amount) => {
  if (coupon.type === 'PERCENTAGE') {
    let discount = (amount * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  } else if (coupon.type === 'FLAT') {
    return coupon.value;
  }
  return 0;
};

// ===== POST /validate ===== //
router.post('/validate', async (req, res) => {
  try {
    const { code, amount, userId, plan } = req.body;

    if (!code || !userId || !amount || !plan)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon)
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    if (isCouponExpired(coupon))
      return res.status(400).json({ success: false, message: 'Coupon expired or not yet active' });

    if (coupon.usageLimit <= coupon.usedCount)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

    if (coupon.usedBy.includes(userId))
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });

    if (coupon.minOrderAmount && amount < coupon.minOrderAmount)
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.minOrderAmount} required`
      });

    if (coupon.applicablePlans?.length && !coupon.applicablePlans.includes(plan))
      return res.status(400).json({ success: false, message: `Coupon not valid for ${plan} plan` });

    const discount = calculateDiscount(coupon, amount);

    return res.json({
      success: true,
      discount: parseFloat(discount.toFixed(2)),
      type: coupon.type,
      value: coupon.value,
      message: `Coupon applied: You saved ₹${discount}`
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== GET /all ===== //
// GET /all - List all active, valid, not-expired, under-limit coupons for user view
router.get('/all', async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] }
    })
      .select('code type value maxDiscount validFrom validTill minOrderAmount applicablePlans description') // ⬅ only safe fields
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (err) {
    console.error('Fetch user coupons error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});



module.exports = router;
