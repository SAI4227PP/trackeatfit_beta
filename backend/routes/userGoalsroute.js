const express = require('express');
const UserGoal = require('../models/UserGoal');
const User = require('../models/User');
const router = express.Router();

// Route for updating the user's calorie goal
router.post('/update-calories/:userId', async (req, res) => {
  const { userId } = req.params;
  const { calories } = req.body;

  try {
    // Check if the user already has a goal
    let userGoal = await UserGoal.findOne({ userId });

    if (userGoal) {
      // Update the calorie goal if it already exists
      userGoal.caloriesGoal = calories.toString();
      await userGoal.save();
      return res.status(200).json({ message: 'Calories goal updated successfully', userGoal });
    } else {
      // Create a new user goal if none exists
      userGoal = new UserGoal({
        userId,
        caloriesGoal: calories.toString()
      });
      await userGoal.save();
      return res.status(201).json({ message: 'Calories goal created successfully', userGoal });
    }
  } catch (error) {
    console.error('Error updating calories:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Route for fetching the user's calorie goal
router.get('/get-calories/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user's calorie goal
    const userGoal = await UserGoal.findOne({ userId });

    if (!userGoal) {
      return res.status(404).json({ message: 'No calorie goal found for this user.' });
    }

    return res.status(200).json({ caloriesGoal: userGoal.caloriesGoal });
  } catch (error) {
    console.error('Error fetching user calories:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update or create weight goal
router.post('/update-weight-goal/:userId', async (req, res) => {
  const { userId } = req.params;
  const { 
    currentWeight, 
    targetWeight, 
    weeklyGoal, 
    timeframe, 
    weightUnit 
  } = req.body;

  try {    // Update user's weight and target weight in personal section
    await User.findByIdAndUpdate(userId, {
      'personal.weight': currentWeight,
      'personal.targetWeight': targetWeight,
      'personal.weightUnit': weightUnit
    });

    const startDate = new Date();
    const expectedEndDate = new Date();
    const weeks = parseInt(timeframe.split('_')[0]);
    expectedEndDate.setDate(expectedEndDate.getDate() + (weeks * 7));

    const weightGoals = {
      currentWeight,
      targetWeight,
      weeklyGoal,
      timeframe,
      weightUnit,
      lastWeightUpdate: new Date(),
      startDate,
      expectedEndDate
    };

    const updatedGoal = await UserGoal.findOneAndUpdate(
      { userId },
      { $set: { weightGoals } },
      { new: true, upsert: true, runValidators: true }
    );

    // Populate user data
    const populatedGoal = await UserGoal.findOne({ _id: updatedGoal._id });
    const userData = await User.findById(userId).select('weight targetWeight');

    res.status(200).json({
      success: true,
      message: 'Weight goal updated successfully',
      goal: updatedGoal,
      userData
    });

  } catch (error) {
    console.error('Error updating weight goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weight goal',
      error: error.message
    });
  }
});

// Get weight goal
router.get('/weight-goal/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [userGoal, userData] = await Promise.all([
      UserGoal.findOne({ userId }),
      User.findById(userId).select('personal.weight personal.targetWeight personal.height personal.weightUnit metrics')
    ]);

    // Calculate BMI and other metrics
    const calculateMetrics = (weight, height) => {
      if (!weight || !height) return null;
      
      // Convert height from cm to meters
      const heightInM = height / 100;
      // Calculate BMI
      const bmi = weight / (heightInM * heightInM);
      
      // Calculate ideal weight range (BMI between 18.5 and 24.9)
      const idealWeightMin = 18.5 * (heightInM * heightInM);
      const idealWeightMax = 24.9 * (heightInM * heightInM);

      return {
        bmi: parseFloat(bmi.toFixed(1)),
        idealWeightRange: {
          min: parseFloat(idealWeightMin.toFixed(1)),
          max: parseFloat(idealWeightMax.toFixed(1))
        }
      };
    };    // If no userGoal exists, return default values
    if (!userGoal || !userGoal.weightGoals) {
      const currentWeight = userData.personal?.weight || 0;
      const metrics = calculateMetrics(currentWeight, userData.personal?.height);
      const defaultWeightGoals = {
        currentWeight: userData.personal?.weight || 0,
        targetWeight: userData.personal?.targetWeight || 0,
        weightUnit: userData.personal?.weightUnit || 'kg',
        height: userData.personal?.height || 0,
        weeklyGoal: 'moderate',
        timeframe: '12_weeks',
        weightUnit: userData.personal?.weightUnit || 'kg',
        lastWeightUpdate: new Date(),
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000)), // 12 weeks from now
        metrics: {
          ...metrics,
          totalWeightToLose: 0,
          weeklyTarget: 0,
          progressPercentage: 0,
          remainingWeight: 0,
          remainingWeeks: 12
        }
      };      return res.status(200).json({
        success: true,
        weightGoals: defaultWeightGoals,
        userData: {
          _id: userData._id,
          
        }
      });
    }    // If userGoal exists, calculate metrics
    const currentWeight = userData.personal?.weight || userGoal.weightGoals.currentWeight;
    const targetWeight = userData.personal?.targetWeight || userGoal.weightGoals.targetWeight;
    const metrics = calculateMetrics(currentWeight, userData.personal?.height);

    // Calculate progress metrics
    const startDate = userGoal.weightGoals.startDate;
    const expectedEndDate = userGoal.weightGoals.expectedEndDate;
    const totalWeightToLose = Math.abs(currentWeight - targetWeight);
    const totalDays = Math.ceil((expectedEndDate - startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((expectedEndDate - new Date()) / (1000 * 60 * 60 * 24));
    const remainingWeeks = Math.ceil(remainingDays / 7);
    const weeklyTarget = totalWeightToLose / (totalDays / 7);
    const initialDifference = Math.abs(userGoal.weightGoals.currentWeight - targetWeight);
    const currentDifference = Math.abs(currentWeight - targetWeight);
    const progressPercentage = initialDifference > 0 
      ? Math.min(100, Math.max(0, ((initialDifference - currentDifference) / initialDifference) * 100))
      : 0;

    const weightGoalsResponse = {
      ...userGoal.weightGoals.toObject(),
      currentWeight,
      targetWeight,
      metrics: {
        ...metrics,
        totalWeightToLose: parseFloat(totalWeightToLose.toFixed(1)),
        weeklyTarget: parseFloat(weeklyTarget.toFixed(1)),
        progressPercentage: parseFloat(progressPercentage.toFixed(1)),
        remainingWeight: parseFloat(currentDifference.toFixed(1)),
        remainingWeeks
      }
    };
      res.status(200).json({
      success: true,
      weightGoals: weightGoalsResponse,
      userData: {
        _id: userData._id,
        targetWeight: userData.personal?.targetWeight || 0,
        weight: userData.personal?.weight || 0,
        height: userData.personal?.height || 0,
        weightUnit: userData.personal?.weightUnit || 'kg'
      }
    });

  } catch (error) {
    console.error('Error fetching weight goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight goal',
      error: error.message
    });
  }
});

// Track weight progress
router.post('/track-weight/:userId', async (req, res) => {
  const { userId } = req.params;
  const { weight } = req.body;

  try {
    // Update both UserGoal and User models
    const userGoal = await UserGoal.findOne({ userId });    const user = await User.findByIdAndUpdate(
      userId,
      { 'personal.weight': weight },
      { new: true }
    ).select('personal.weight personal.targetWeight personal.weightUnit');

    if (!userGoal) {
      return res.status(404).json({
        success: false,
        message: 'No goal found for this user'
      });
    }

    userGoal.weightGoals.currentWeight = weight;
    userGoal.weightGoals.lastWeightUpdate = new Date();
    await userGoal.save();

    res.status(200).json({
      success: true,
      message: 'Weight progress updated successfully',
      currentWeight: weight,
      lastUpdate: userGoal.weightGoals.lastWeightUpdate,
      userData: user
    });

  } catch (error) {
    console.error('Error tracking weight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track weight',
      error: error.message
    });
  }
});

module.exports = router;
