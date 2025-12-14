const express = require('express');
const router = express.Router();
const MacronutrientData = require('../models/MacronutrientData');

// Save or Update Macronutrient Data
router.post('/save-macronutrient-data', async (req, res) => {
  const {
    carbsPercentage,
    proteinsPercentage,
    fatsPercentage,
    gramsCarbs,
    gramsProteins,
    gramsFats,
    weight,
    userId,
  } = req.body;

  try {
    // Check if total percentage is 100
    const totalPercentage = carbsPercentage + proteinsPercentage + fatsPercentage;
    if (totalPercentage !== 100) {
      return res.status(400).json({ error: 'The total percentage of macronutrients must equal 100%.' });
    }

    const data = {
      userId,
      carbsPercentage,
      proteinsPercentage,
      fatsPercentage,
      carbsWeight: gramsCarbs.toString(),
      proteinsWeight: gramsProteins.toString(),
      fatsWeight: gramsFats.toString(),
      totalPercentage,
      weight: weight.toString(),
    };

    // Check if the user already has data
    let macronutrientData = await MacronutrientData.findOne({ userId });

    if (macronutrientData) {
      // Update existing data
      macronutrientData = await MacronutrientData.findOneAndUpdate({ userId }, data, { new: true });
      return res.status(200).json({ message: 'Data updated successfully', data: macronutrientData });
    } else {
      // Create new data
      const newMacronutrientData = new MacronutrientData(data);
      await newMacronutrientData.save();
      return res.status(201).json({ message: 'Data saved successfully', data: newMacronutrientData });
    }
  } catch (error) {
    console.error('Error saving or updating data:', error);
    res.status(500).json({ error: 'Failed to save or update macronutrient data' });
  }
});

// Get Macronutrient Data by User ID
router.get('/get-macronutrient-data/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const macronutrientData = await MacronutrientData.findOne({ userId });

    if (macronutrientData) {
      return res.status(200).json({ message: 'Data retrieved successfully', data: macronutrientData });
    } else {
      return res.status(200).json({ message: 'No macronutrient data found for this user', data: [] });
    }
  } catch (error) {
    console.error('Error fetching macronutrient data:', error);
    res.status(500).json({ error: 'Failed to fetch macronutrient data' });
  }
});

module.exports = router;
