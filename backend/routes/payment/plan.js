const express = require('express');
const router = express.Router();
const Plan = require('../../models/Subscription/Plan');

// Optional: Add authentication & admin middleware if needed
// const { verifyAdmin } = require('../../middleware/auth');

// --- [PUBLIC] Get all visible plans (sorted) ---
// Optimized: select only necessary fields for faster response
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isPublic: true })
      .select('planCode name tagline description price currency durationInDays billingCycle trialDays features isRecommended sortOrder promo highlightColor gatewayProductId')
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    res.status(200).json({
      message: 'Plans fetched successfully',
      plans
    });
  } catch (error) {
    console.error('[GET /plans]', error);
    res.status(500).json({
      error: 'Unable to fetch plans',
      code: 'SERVER_ERROR'
    });
  }
});


// --- [ADMIN] Create a new plan ---
router.post('/create', /* verifyAdmin, */ async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('[POST /plans/create]', error);
    res.status(400).json({
      error: 'Plan creation failed',
      details: error.message
    });
  }
});


// --- [ADMIN] Update a plan ---
router.put('/:id', /* verifyAdmin, */ async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.status(200).json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('[PUT /plans/:id]', error);
    res.status(400).json({
      error: 'Plan update failed',
      details: error.message
    });
  }
});


// --- [ADMIN] Delete a plan ---
router.delete('/:id', /* verifyAdmin, */ async (req, res) => {
  try {
    const result = await Plan.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.status(200).json({
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE /plans/:id]', error);
    res.status(500).json({
      error: 'Failed to delete plan',
      details: error.message
    });
  }
});

module.exports = router;
