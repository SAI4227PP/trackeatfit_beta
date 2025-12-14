const express = require('express');
const router = express.Router();
const LoggedFood = require('../models/LoggedFood');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const { fatsecretGetFoodById } = require('../routes/fatsecret/fatsecretGetFoodById');
const WorkoutSession = require('../models/V2_fitnessDB/Program/WorkoutSession').WorkoutSession;
const mongoose = require('mongoose'); // <-- Add this line

// Add these constants at the top of the file
const CONSUMER_KEY = "d6356d55bcd34fbd8f71ecf0001ac9db";
const CONSUMER_SECRET = "4aead4cc0cf44149a96ff76711173234";

// Add a logged food entry
router.post('/loggedFood', async (req, res) => {
  const { userId, foodId, recipeId, mealType, nutrition } = req.body;

  if (!userId || !mealType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Initialize nutritionData
    let nutritionData = null;
    
    // If recipeId is provided, use nutrition data from request
    if (recipeId && nutrition) {
      nutritionData = {
        calories: parseFloat(nutrition.calories || 0),
        carbs: parseFloat(nutrition.carbs || 0),
        protein: parseFloat(nutrition.protein || 0),
        fats: parseFloat(nutrition.fats || 0),
        servingSize: nutrition.servingSize || '1 serving'
      };
    }
    // If foodId is provided, fetch from FatSecret
    else if (foodId) {
      const foodData = await fatsecretGetFoodById(foodId, CONSUMER_KEY, CONSUMER_SECRET);
      if (foodData && foodData.food) {
        const servingData = foodData.food.servings.serving;
        const serving = Array.isArray(servingData) ? servingData[0] : servingData;
        nutritionData = {
          calories: parseFloat(serving.calories || 0),
          carbs: parseFloat(serving.carbohydrate || 0),
          protein: parseFloat(serving.protein || 0),
          fats: parseFloat(serving.fat || 0),
          servingSize: serving.serving_description || '1 serving'
        };
      }
    }

    const validMealType = mealType.toLowerCase();
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata', // Use IST timezone
    });
    // Output will be in YYYY-MM-DD format, e.g., '2025-01-26'
    

    let loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });

    if (!loggedFoodDoc) {
      loggedFoodDoc = new LoggedFood({
        userId,
        date: today,
        foods: [],
      });
    }

    // Remove duplicate check since users might want to log the same food multiple times
    const newFood = {
      foodId: foodId || null,
      recipeId: recipeId || null,
      mealType: validMealType,
      addedAt: new Date().toISOString(),
      // Add unique identifier for each food entry
      entryId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nutrition: nutritionData // Add the nutrition data
    };

    loggedFoodDoc.foods.push(newFood);
    await loggedFoodDoc.save();

    // Notify clients with updated data
    notifyAllClients('logged-food', {
      type: 'add',
      userId,
      food: newFood,
      date: today,
      success: true
    });

    res.status(201).json({
      success: true,
      message: 'Food logged successfully',
      data: loggedFoodDoc,
      newEntry: newFood
    });

  } catch (error) {
    console.error('Error Logging Food:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log food',
      details: error.message,
    });
  }
});

// Update the get route to make date optional and handle the query better
router.get('/get-logged-food/:userId', async (req, res) => {
  const { userId } = req.params;
  const date = req.query.date || new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata', // Use IST timezone
  }); // Default to today if no date

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let query = { userId };
    if (date) {
      query.date = date;
    }

    // Fetch documents by userId and optional date
    const loggedFoodItems = await LoggedFood.find(query)
      .sort({ date: -1 }) // Sort by date descending
      .exec();

    res.status(200).json({
      success: true,
      data: loggedFoodItems
    });
  } catch (error) {
    console.error('Error fetching logged food:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch logged food', 
      details: error.message 
    });
  }
});

// Add new route to get all logged food entries
router.get('/get-all-logged-food/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const allLoggedFood = await LoggedFood.find({ userId })
      .sort({ date: -1 })
      .lean()
      .exec();

    // Modify simplifiedData to include nutrition while keeping the same structure
    const simplifiedData = allLoggedFood.map(doc => ({
      date: doc.date,
      meals: doc.foods.map(food => ({
        id: food.foodId,
        type: food.mealType,
        time: new Date(food.addedAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        nutrition: food.nutrition ? {
          calories: Number(food.nutrition.calories || 0),
          carbs: Number(food.nutrition.carbs || 0),
          protein: Number(food.nutrition.protein || 0),
          fats: Number(food.nutrition.fats || 0),
          servingSize: food.nutrition.servingSize || '1 serving'
        } : null
      }))
    }));

    // Keep existing summary calculation
    const totalMeals = allLoggedFood.reduce((total, doc) => 
      total + (doc.foods?.length || 0), 0
    );
    const uniqueDates = new Set(allLoggedFood.map(doc => doc.date)).size;

    const summary = {
      totalMeals,
      daysLogged: uniqueDates,
      averagePerDay: (totalMeals / uniqueDates).toFixed(1),
      firstLogDate: allLoggedFood[allLoggedFood.length - 1]?.date,
      lastLogDate: allLoggedFood[0]?.date
    };

    // Keep existing notification
    notifyAllClients('logged-food', {
      type: 'stats-update',
      userId,
      summary,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      summary,
      logs: simplifiedData
    });

  } catch (error) {
    console.error('Error fetching all logged food:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch food history'
    });
  }
});

// Route to delete a logged food entry
router.delete('/delete-logged-food/:userId', async (req, res) => {
  const { userId } = req.params;
  const { foodId, recipeId, mealType } = req.body;


  if (!mealType || (!foodId && !recipeId)) {
    return res.status(400).json({ error: 'Food/Recipe ID and meal type are required' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });

    const loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });
    
    if (!loggedFoodDoc) {
      return res.status(404).json({ error: 'No logged food found for today' });
    }

    // Find the index with exact matching of recipeId/foodId and mealType
    const foodIndex = loggedFoodDoc.foods.findIndex(food => {
      if (recipeId) {
        return food.recipeId && food.recipeId.toString() === recipeId.toString() && 
               food.mealType === mealType;
      }
      if (foodId) {
        return food.foodId && food.foodId.toString() === foodId.toString() && 
               food.mealType === mealType;
      }
      return false;
    });


    if (foodIndex === -1) {
      return res.status(404).json({ error: 'Food/Recipe item not found' });
    }

    // Store the item before removing it
    const deletedItem = loggedFoodDoc.foods[foodIndex];
    
    // Remove the item
    loggedFoodDoc.foods.splice(foodIndex, 1);
    await loggedFoodDoc.save();

    console.log('Deleted item:', deletedItem); // Debug log

    notifyAllClients('logged-food', {
      type: 'delete',
      userId,
      foodId: deletedItem.foodId,
      recipeId: deletedItem.recipeId,
      mealType,
      date: today
    });

    res.status(200).json({
      success: true,
      message: 'Food/Recipe entry deleted successfully',
      data: loggedFoodDoc
    });

  } catch (error) {
    console.error('Error deleting food/recipe entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry',
      details: error.message
    });
  }
});

// Add a route to update food entry
router.put('/update-logged-food/:userId', async (req, res) => {
  const { userId } = req.params;
  const { foodId, updates } = req.body;

  if (!foodId || !updates) {
    return res.status(400).json({ error: 'Food ID and updates are required' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });
    if (!loggedFoodDoc) {
      return res.status(404).json({ error: 'No logged food found for today' });
    }

    const foodIndex = loggedFoodDoc.foods.findIndex(food => food.foodId === foodId);
    if (foodIndex === -1) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    // Update the food entry
    loggedFoodDoc.foods[foodIndex] = {
      ...loggedFoodDoc.foods[foodIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await loggedFoodDoc.save();

    // Notify clients with specific event type and data
    notifyAllClients('logged-food', {
      type: 'update',
      userId,
      foodId,
      updates,
      date: today
    });

    res.status(200).json({
      message: 'Food entry updated successfully',
      data: loggedFoodDoc.foods[foodIndex],
    });
  } catch (error) {
    console.error('Error updating food entry:', error);
    res.status(500).json({
      error: 'Failed to update food entry',
      details: error.message,
    });
  }
});

// Replace existing get-statistics route with this enhanced version
router.get('/get-statistics/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const now = new Date();
    const today = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // --- Move these up before any usage ---
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(startOfWeek.getDate() - 7);
    const previousWeekEnd = new Date(startOfWeek);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    const previousMonthStart = new Date(startOfMonth);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(startOfMonth);
    previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

    const weeklyCalories = new Array(7).fill(0);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const loggedFoodData = await LoggedFood.find({
      userId,
      date: {
        $gte: startOfMonth.toISOString().split('T')[0],
        $lte: today.toISOString().split('T')[0]
      }
    }).sort({ date: 1 });

    // Initialize the response structure without macros section
    const statsResponse = {
      daily: {
        labels: ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"],
        datasets: [{
          data: new Array(6).fill(0),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2
        }],
        metrics: {
          totalIntake: 0,
          previousIntake: 0,
          burned: 0,
          previousBurned: 0
        }
      },
      weekly: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            data: new Array(7).fill(0),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2
          }
        ]
      },
      monthly: {
        labels: ["W1", "W2", "W3", "W4"],
        datasets: [
          {
            data: new Array(4).fill(0),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2
          }
        ]
      },
      trends: {
        consistencyScore: 0,
        weeklyAverage: 0,
        goalAchievement: 0
      },
      nutrition: {
        daily: { calories: 0, carbs: 0, protein: 0, fats: 0 },
        weekly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
        monthly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
        previous: {
          daily: { calories: 0, carbs: 0, protein: 0, fats: 0 },
          weekly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
          monthly: { calories: 0, carbs: 0, protein: 0, fats: 0 }
        }
      }
    };

    // Process today's data for daily time slots
    const todayData = loggedFoodData.find(day => 
      day.date === today.toISOString().split('T')[0]
    );

    // Reset nutrition values to zero
    statsResponse.nutrition = {
      daily: { calories: 0, carbs: 0, protein: 0, fats: 0 },
      weekly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
      monthly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
      previous: {
        daily: { calories: 0, carbs: 0, protein: 0, fats: 0 },
        weekly: { calories: 0, carbs: 0, protein: 0, fats: 0 },
        monthly: { calories: 0, carbs: 0, protein: 0, fats: 0 }
      }
    };

    if (todayData && todayData.foods.length > 0) {
      // Sort foods by time
      const sortedFoods = todayData.foods.sort((a, b) => 
        new Date(a.addedAt) - new Date(b.addedAt)
      );

      // Updated time slots to match label expectations
      const timeSlots = [
        { start: 6, end: 9, calories: 0 },    // 6:00-8:59 (6AM slot)
        { start: 9, end: 12, calories: 0 },   // 9:00-11:59 (9AM slot)
        { start: 12, end: 15, calories: 0 },  // 12:00-14:59 (12PM slot)
        { start: 15, end: 18, calories: 0 },  // 15:00-17:59 (3PM slot)
        { start: 18, end: 21, calories: 0 },  // 18:00-20:59 (6PM slot)
        { start: 21, end: 24, calories: 0 }   // 21:00-23:59 (9PM slot)
      ];

      sortedFoods.forEach(food => {
        if (food.nutrition) {
          // Convert addedAt to IST and extract hour
          const istDate = new Date(
            new Date(food.addedAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          const hour = istDate.getHours();

          // Find matching time slot
          const slotIndex = timeSlots.findIndex(slot => 
            hour >= slot.start && hour < slot.end
          );

          if (slotIndex !== -1) {
            timeSlots[slotIndex].calories += Number(food.nutrition.calories || 0);

            // Add to daily nutrition totals (only once)
            statsResponse.nutrition.daily.calories += Number(food.nutrition.calories || 0);
            statsResponse.nutrition.daily.carbs += Number(food.nutrition.carbs || 0);
            statsResponse.nutrition.daily.protein += Number(food.nutrition.protein || 0);
            statsResponse.nutrition.daily.fats += Number(food.nutrition.fats || 0);
          }
        }
      });

      // Update daily datasets
      statsResponse.daily.datasets[0].data = timeSlots.map(slot => 
        Number(slot.calories.toFixed(2))
      );
    }

    // Initialize a map to store daily calories for the current week
    const weeklyData = new Map();
    dayNames.forEach(day => weeklyData.set(day, 0));

    // Process all data for weekly and monthly stats
    loggedFoodData.forEach(day => {
      const dayDate = new Date(day.date);
      const isThisWeek = dayDate >= startOfWeek && dayDate <= today;

      if (isThisWeek) {
        const dayName = dayNames[dayDate.getDay()];
        // Sum up calories for each day of the week
        const dayCalories = day.foods.reduce((sum, food) => {
          if (food.nutrition && food.nutrition.calories) {
            return sum + Number(food.nutrition.calories || 0);
          }
          return sum;
        }, 0);
        weeklyData.set(dayName, (weeklyData.get(dayName) || 0) + dayCalories);
      }

      // Process each food entry for weekly/monthly nutrition
      day.foods.forEach(food => {
        // Update nutrition totals (only for weekly and monthly)
        if (food.nutrition) {
          if (isThisWeek) {
            // Update weekly nutrition
            statsResponse.nutrition.weekly.calories += Number(food.nutrition.calories || 0);
            statsResponse.nutrition.weekly.carbs += Number(food.nutrition.carbs || 0);
            statsResponse.nutrition.weekly.protein += Number(food.nutrition.protein || 0);
            statsResponse.nutrition.weekly.fats += Number(food.nutrition.fats || 0);
          }

          // Update monthly nutrition
          statsResponse.nutrition.monthly.calories += Number(food.nutrition.calories || 0);
          statsResponse.nutrition.monthly.carbs += Number(food.nutrition.carbs || 0);
          statsResponse.nutrition.monthly.protein += Number(food.nutrition.protein || 0);
          statsResponse.nutrition.monthly.fats += Number(food.nutrition.fats || 0);
        }
      });
    });

    // Initialize weekly calories for monthly view
    const monthlyWeekCalories = new Array(4).fill(0);

    // Process all data
    loggedFoodData.forEach(day => {
      const dayDate = new Date(day.date);
      const weekNumber = Math.floor((dayDate - startOfMonth) / (7 * 24 * 60 * 60 * 1000));

      // Calculate calories for monthly view (by week)
      if (weekNumber >= 0 && weekNumber < 4) {
        const dayCalories = day.foods.reduce((sum, food) => {
          if (food.nutrition && food.nutrition.calories) {
            return sum + Number(food.nutrition.calories);
          }
          return sum;
        }, 0);
        monthlyWeekCalories[weekNumber] += Number(dayCalories);
      }

      // ...rest of existing food processing...
    });

    // Update monthly data in statsResponse with calorie totals
    statsResponse.monthly = {
      labels: ["W1", "W2", "W3", "W4"],
      datasets: [{
        data: monthlyWeekCalories.map(calories => Number(calories.toFixed(2))),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2
      }]
    };

    // Get current day name and reorder days to start from next day
    const todayIndex = today.getDay();
    const reorderedDays = [
      ...dayNames.slice(todayIndex + 1),
      ...dayNames.slice(0, todayIndex + 1)
    ];

    // Create reordered calorie data array matching the day order
    const reorderedCalories = reorderedDays.map(day => 
      Number(weeklyData.get(day).toFixed(2))
    );

    // Update weekly data in statsResponse
    statsResponse.weekly = {
      labels: reorderedDays,
      datasets: [{
        data: reorderedCalories,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2
      }]
    };

    // Calculate date ranges for previous periods
    // const yesterday = new Date(today);
    // yesterday.setDate(today.getDate() - 1);
    
    // const previousWeekStart = new Date(startOfWeek);
    // previousWeekStart.setDate(startOfWeek.getDate() - 7);
    // const previousWeekEnd = new Date(startOfWeek);
    // previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    
    // const previousMonthStart = new Date(startOfMonth);
    // previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    // const previousMonthEnd = new Date(startOfMonth);
    // previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

    // Fetch previous period data
    const previousData = await LoggedFood.find({
      userId,
      date: {
        $gte: previousMonthStart.toISOString().split('T')[0],
        $lte: yesterday.toISOString().split('T')[0]
      }
    }).sort({ date: 1 });

    // Process previous periods
    previousData.forEach(day => {
      const dayDate = new Date(day.date);
      const isYesterday = dayDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
      const isPreviousWeek = dayDate >= previousWeekStart && dayDate <= previousWeekEnd;
      const isPreviousMonth = dayDate >= previousMonthStart && dayDate <= previousMonthEnd;

      day.foods.forEach(food => {
        if (food.nutrition) {
          // Add to previous daily totals
          if (isYesterday) {
            statsResponse.nutrition.previous.daily.calories += Number(food.nutrition.calories || 0);
            statsResponse.nutrition.previous.daily.carbs += Number(food.nutrition.carbs || 0);
            statsResponse.nutrition.previous.daily.protein += Number(food.nutrition.protein || 0);
            statsResponse.nutrition.previous.daily.fats += Number(food.nutrition.fats || 0);
          }

          // Add to previous weekly totals
          if (isPreviousWeek) {
            statsResponse.nutrition.previous.weekly.calories += Number(food.nutrition.calories || 0);
            statsResponse.nutrition.previous.weekly.carbs += Number(food.nutrition.carbs || 0);
            statsResponse.nutrition.previous.weekly.protein += Number(food.nutrition.protein || 0);
            statsResponse.nutrition.previous.weekly.fats += Number(food.nutrition.fats || 0);
          }

          // Add to previous monthly totals
          if (isPreviousMonth) {
            statsResponse.nutrition.previous.monthly.calories += Number(food.nutrition.calories || 0);
            statsResponse.nutrition.previous.monthly.carbs += Number(food.nutrition.carbs || 0);
            statsResponse.nutrition.previous.monthly.protein += Number(food.nutrition.protein || 0);
            statsResponse.nutrition.previous.monthly.fats += Number(food.nutrition.fats || 0);
          }
        }
      });
    });

    // Round the nutrition values to 2 decimal places
    ['daily', 'weekly', 'monthly'].forEach(period => {
      ['calories', 'carbs', 'protein', 'fats'].forEach(nutrient => {
        statsResponse.nutrition[period][nutrient] = 
          Number(statsResponse.nutrition[period][nutrient].toFixed(2));
        statsResponse.nutrition.previous[period][nutrient] = 
          Number(statsResponse.nutrition.previous[period][nutrient].toFixed(2));
      });
    });

    // --- Add: Calculate burned (exercise calories) for daily, weekly, monthly, previous periods ---
    // Helper to get ISO date string (YYYY-MM-DD)
    const isoDate = d => d.toISOString().split('T')[0];

    // Daily burned (today)
    const dailyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(today)), $lte: new Date(isoDate(today) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);
    // Weekly burned (current week)
    const weeklyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(startOfWeek)), $lte: new Date(isoDate(today) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);
    // Monthly burned (current month)
    const monthlyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(startOfMonth)), $lte: new Date(isoDate(today) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);

    // Previous periods
    const prevDailyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(yesterday)), $lte: new Date(isoDate(yesterday) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);
    const prevWeeklyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(previousWeekStart)), $lte: new Date(isoDate(previousWeekEnd) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);
    const prevMonthlyBurned = await WorkoutSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'in_progress'] }, sessionDate: { $gte: new Date(isoDate(previousMonthStart)), $lte: new Date(isoDate(previousMonthEnd) + 'T23:59:59.999Z') } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCaloriesBurned', 0] } } } }
    ]);

    // After rounding nutrition values, add burned to each period
    statsResponse.nutrition.daily.burned = dailyBurned[0]?.total || 0;
    statsResponse.nutrition.weekly.burned = weeklyBurned[0]?.total || 0;
    statsResponse.nutrition.monthly.burned = monthlyBurned[0]?.total || 0;
    statsResponse.nutrition.previous.daily.burned = prevDailyBurned[0]?.total || 0;
    statsResponse.nutrition.previous.weekly.burned = prevWeeklyBurned[0]?.total || 0;
    statsResponse.nutrition.previous.monthly.burned = prevMonthlyBurned[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: statsResponse
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

// Add water entry
router.post('/add-water/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  try {
    let loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });

    if (!loggedFoodDoc) {
      loggedFoodDoc = new LoggedFood({
        userId,
        date: today,
        foods: [],
        water: [],
        notes: []
      });
    }

    loggedFoodDoc.water.push({
      amount,
      addedAt: new Date()
    });

    await loggedFoodDoc.save();

    notifyAllClients('logged-food', {
      type: 'water-added',
      userId,
      amount,
      date: today
    });

    res.status(201).json({
      success: true,
      message: 'Water logged successfully',
      data: loggedFoodDoc
    });
  } catch (error) {
    console.error('Error logging water:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log water',
      details: error.message
    });
  }
});

// Add note entry
router.post('/add-note/:userId', async (req, res) => {
  const { userId } = req.params;
  const { content } = req.body;

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  try {
    let loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });

    if (!loggedFoodDoc) {
      loggedFoodDoc = new LoggedFood({
        userId,
        date: today,
        foods: [],
        water: [],
        notes: []
      });
    }

    loggedFoodDoc.notes.push({
      content,
      addedAt: new Date()
    });

    await loggedFoodDoc.save();

    notifyAllClients('logged-food', {
      type: 'note-added',
      userId,
      content,
      date: today
    });

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: loggedFoodDoc
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note',
      details: error.message
    });
  }
});

// Delete water entry
router.delete('/delete-water/:userId/:waterId', async (req, res) => {
  const { userId, waterId } = req.params;
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  try {
    const loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });
    if (!loggedFoodDoc) {
      return res.status(404).json({ error: 'No logged food found for today' });
    }

    loggedFoodDoc.water = loggedFoodDoc.water.filter(w => w._id.toString() !== waterId);
    await loggedFoodDoc.save();

    notifyAllClients('logged-food', {
      type: 'water-deleted',
      userId,
      waterId,
      date: today
    });

    res.status(200).json({
      success: true,
      message: 'Water entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete water entry',
      details: error.message
    });
  }
});

// Delete note entry
router.delete('/delete-note/:userId/:noteId', async (req, res) => {
  const { userId, noteId } = req.params;
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  try {
    const loggedFoodDoc = await LoggedFood.findOne({ userId, date: today });
    if (!loggedFoodDoc) {
      return res.status(404).json({ error: 'No logged food found for today' });
    }

    loggedFoodDoc.notes = loggedFoodDoc.notes.filter(n => n._id.toString() !== noteId);
    await loggedFoodDoc.save();

    notifyAllClients('logged-food', {
      type: 'note-deleted',
      userId,
      noteId,
      date: today
    });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      details: error.message
    });
  }
});

// Add a new route to get logged food for a date range (bulk)
router.get('/get-logged-food-range/:userId', async (req, res) => {
  const { userId } = req.params;
  const { start, end } = req.query;

  if (!userId || !start || !end) {
    return res.status(400).json({ error: 'User ID, start date, and end date are required' });
  }

  try {
    // Ensure start and end are in YYYY-MM-DD format and compare as strings
    // Also, make sure date field in MongoDB is stored as string in YYYY-MM-DD format
    const loggedFoodItems = await LoggedFood.find({
      userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .exec();

    // Debug: log what was found
    console.log('Range query:', { userId, start, end, found: loggedFoodItems.map(f => f.date) });

    res.status(200).json({
      success: true,
      data: loggedFoodItems
    });
  } catch (error) {
    console.error('Error fetching logged food range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logged food range',
      details: error.message
    });
  }
});

module.exports = router;
