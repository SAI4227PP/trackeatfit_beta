const express = require('express');
const router = express.Router();
const { UserProgramProgress } = require('../../../models/V2_fitnessDB/Program/UserProgramProgress');
const { ExerciseProgram: ExerciseProgramModel, ProgramSchema } = require('../../../models/V2_fitnessDB/Program/ExerciseProgram');
const { V3_exerciseSchema } = require('../../../models/V2_fitnessDB/V3_exercises');
const { getV2FitnessConnection } = require('../../../config/database');

let ExerciseProgram;
// Cache for beginner recommendations
let beginnerRecommendationsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Helper function to get beginner recommendations with caching
async function getBeginnerRecommendations(v2Conn) {
  const currentTime = Date.now();
  if (beginnerRecommendationsCache && (currentTime - lastCacheTime) < CACHE_DURATION) {
    return beginnerRecommendationsCache;
  }

  // First try with strict criteria
  let beginnerExercises = await v2Conn.model('V3_exercises').find({
    difficulty: 'beginner',
    equipment: { $in: ['bodyweight', 'none'] },
    rating: { $gte: 4 }
  })
  .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
  .sort({ rating: -1 })
  .limit(8)
  .lean();

  // If no results, try with relaxed criteria
  if (!beginnerExercises.length) {
    beginnerExercises = await v2Conn.model('V3_exercises').find({
      $or: [
        { difficulty: 'beginner' },
        { idealFor: 'beginner' }
      ],
      equipment: { $in: ['bodyweight', 'none', 'dumbbell', 'resistance band'] },
      rating: { $gte: 3 }
    })
    .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
    .sort({ rating: -1 })
    .limit(8)
    .lean();
  }

  // If still no results, get any exercises suitable for beginners
  if (!beginnerExercises.length) {
    beginnerExercises = await v2Conn.model('V3_exercises').find({
      $or: [
        { difficulty: { $in: ['beginner', 'intermediate'] } },
        { idealFor: { $in: ['beginner', 'intermediate'] } }
      ]
    })
    .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
    .sort({ rating: -1 })
    .limit(8)
    .lean();
  }

  const CDN_URL = 'https://cdn.trackeatfit.me';
  
  // Group exercises by muscle groups for consistency
  const groupedExercises = beginnerExercises.reduce((acc, exercise) => {
    // Update mainImage URL
    if (exercise.mainImage) {
      exercise.mainImage = exercise.mainImage.replace(
        'https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com',
        CDN_URL
      );
    }

    // Ensure we have target information
    let targetMuscles = [];
    if (exercise.target) {
      targetMuscles = Array.isArray(exercise.target) ? exercise.target : [exercise.target];
    } else if (exercise.bodyPart) {
      targetMuscles = [exercise.bodyPart];
    }

    const primaryMuscle = targetMuscles[0] || 'full body';

    if (!acc[primaryMuscle]) {
      acc[primaryMuscle] = [];
    }
    acc[primaryMuscle].push(exercise);
    return acc;
  }, {});

  // If still no exercises in any group, create a default full body group
  if (Object.keys(groupedExercises).length === 0) {
    // Create default beginner exercises
    const defaultExercises = [
      {
        exerciseName: 'Bodyweight Squats',
        category: 'strength',
        bodyPart: 'full body',
        equipment: 'bodyweight',
        target: ['full body'],
        idealFor: 'beginner',
        duration: 60,
        caloriesBurnedPerSet: 8,
        rating: 4.5
      },
      {
        exerciseName: 'Push-ups',
        category: 'strength',
        bodyPart: 'upper body',
        equipment: 'bodyweight',
        target: ['chest', 'shoulders', 'triceps'],
        idealFor: 'beginner',
        duration: 45,
        caloriesBurnedPerSet: 7,
        rating: 4.5
      },
      {
        exerciseName: 'Walking',
        category: 'cardio',
        bodyPart: 'full body',
        equipment: 'none',
        target: ['full body'],
        idealFor: 'beginner',
        duration: 1800,
        caloriesBurnedPerSet: 150,
        rating: 4.0
      }
    ];

    groupedExercises['full body'] = defaultExercises;
  }

  beginnerRecommendationsCache = groupedExercises;
  lastCacheTime = currentTime;
  return groupedExercises;
}

// Helper function to process exercise details efficiently
function processExerciseDetails(details, stats) {
  if (!details) return;

  // Process equipment
  if (details.equipment) {
    (Array.isArray(details.equipment) ? details.equipment : [details.equipment])
      .forEach(eq => stats.successfulEquipment.add(eq));
  }

  // Process target muscles
  if (details.target) {
    const targets = Array.isArray(details.target) ? details.target : [details.target];
    targets.forEach(muscle => {
      if (muscle) {
        stats.muscleGroups[muscle] = (stats.muscleGroups[muscle] || 0) + 1;
      }
    });
  }

  // Process secondary muscles
  if (details.secondaryMuscles) {
    const secondaryMuscles = Array.isArray(details.secondaryMuscles) ? 
      details.secondaryMuscles : [details.secondaryMuscles];
    secondaryMuscles.forEach(muscle => {
      if (muscle) {
        stats.muscleGroups[muscle] = (stats.muscleGroups[muscle] || 0) + 0.5;
      }
    });
  }

  // Track category
  if (details.category) {
    stats.categories = stats.categories || {};
    stats.categories[details.category] = (stats.categories[details.category] || 0) + 1;
  }

  // Update difficulty
  if (details.idealFor === 'advanced') {
    stats.maxDifficulty = 'advanced';
  } else if (details.idealFor === 'intermediate' && stats.maxDifficulty !== 'advanced') {
    stats.maxDifficulty = 'intermediate';
  }
}

// Always ensure both models are registered on the connection
router.use((req, res, next) => {
    const v2Conn = getV2FitnessConnection();
    if (v2Conn) {
        if (!ExerciseProgram) {
            ExerciseProgram = v2Conn.model('ExerciseProgram', ProgramSchema, 'exercise_programs');
        }
        if (!v2Conn.models.V3_exercises) {
            v2Conn.model('V3_exercises', V3_exerciseSchema, 'V3_exercises');
        }
    }
    next();
});

// 🎯 GET - Get personalized exercise recommendations
router.get('/exercise-recommendations/:userId', async (req, res) => {
  try {
    const v2Conn = getV2FitnessConnection();
    if (!v2Conn) {
      throw new Error('Database connection not available');
    }

    // 1. Get user's workout history with optimized projection
    const userProgress = await UserProgramProgress.find(
      { userId: req.params.userId },
      {
        'sessionLogs.completedExercises': 1,
        'sessionLogs.durationInMinutes': 1,
        'sessionLogs.energyLevel': 1,
        'sessionLogs.difficultyRating': 1,
        'programId': 1
      }
    )
    .populate({
      path: 'programId',
      select: 'targetMuscleGroups difficulty'
    })
    .lean();

    // Handle new users with cached recommendations
    if (!userProgress.length) {
      const groupedExercises = await getBeginnerRecommendations(v2Conn);
      
      // Get actual equipment used in recommendations
      const actualEquipment = new Set();
      Object.values(groupedExercises).flat().forEach(exercise => {
        if (exercise.equipment) {
          if (Array.isArray(exercise.equipment)) {
            exercise.equipment.forEach(eq => actualEquipment.add(eq));
          } else {
            actualEquipment.add(exercise.equipment);
          }
        }
      });

      const muscleGroups = Object.keys(groupedExercises);
      
      return res.status(200).json({
        success: true,
        data: {
          recommendations: groupedExercises,
          reason: 'Here are some beginner-friendly exercises to get you started!',
          stats: {
            preferredDuration: 30,
            topMuscleGroups: muscleGroups,
            difficulty: 'beginner',
            preferredEquipment: Array.from(actualEquipment)
          }
        }
      });
    }

    // 2. Efficiently collect exercise IDs using Set
    const exerciseIds = new Set();
    const exerciseStats = {
      completedExercises: new Set(),
      muscleGroups: {},
      successfulEquipment: new Set(),
      maxDifficulty: 'beginner',
      preferredDuration: 0,
      energyLevels: [],
      difficultyRatings: []
    };

    let totalExercises = 0;
    let totalDuration = 0;

    // Collect IDs and stats in a single pass
    userProgress.forEach(progress => {
      progress.sessionLogs?.forEach(session => {
        if (session.durationInMinutes) totalDuration += session.durationInMinutes;
        if (session.energyLevel) exerciseStats.energyLevels.push(session.energyLevel);
        if (session.difficultyRating) exerciseStats.difficultyRatings.push(session.difficultyRating);

        session.completedExercises?.forEach(exercise => {
          if (!exercise.skipped && exercise.exerciseId) {
            exerciseIds.add(exercise.exerciseId.toString());
            exerciseStats.completedExercises.add(exercise.exerciseId.toString());
            totalExercises++;
          }
        });
      });

      // Process program difficulty
      if (progress.programId?.difficulty === 'advanced') {
        exerciseStats.maxDifficulty = 'advanced';
      } else if (progress.programId?.difficulty === 'intermediate' && exerciseStats.maxDifficulty !== 'advanced') {
        exerciseStats.maxDifficulty = 'intermediate';
      }
    });

    // 3. Fetch exercise details using aggregation for better performance
    const exerciseDetails = await v2Conn.model('V3_exercises').aggregate([
      { $match: { _id: { $in: Array.from(exerciseIds) } } },
      { $project: {
        exerciseName: 1,
        mainImage: 1,
        caloriesBurnedPerSet: 1,
        duration: 1,
        category: 1,
        bodyPart: 1,
        equipment: 1,
        target: 1,
        secondaryMuscles: 1,
        idealFor: 1,
        rating: 1
      }}
    ]);

    // Process exercise details efficiently
    exerciseDetails.forEach(details => processExerciseDetails(details, exerciseStats));

    // Calculate stats efficiently
    exerciseStats.preferredDuration = Math.round(totalDuration / totalExercises) || 30;
    const avgEnergyLevel = exerciseStats.energyLevels.length ? 
      exerciseStats.energyLevels.reduce((a, b) => a + b, 0) / exerciseStats.energyLevels.length : 3;
    const avgDifficultyRating = exerciseStats.difficultyRatings.length ? 
      exerciseStats.difficultyRatings.reduce((a, b) => a + b, 0) / exerciseStats.difficultyRatings.length : 3;

    // 4. Generate exercise recommendations
    // Adjust difficulty based on ratings
    if (avgDifficultyRating < 2.5 && exerciseStats.maxDifficulty !== 'advanced') {
      exerciseStats.maxDifficulty = exerciseStats.maxDifficulty === 'beginner' ? 'intermediate' : 'advanced';
    } else if (avgDifficultyRating > 4 && exerciseStats.maxDifficulty !== 'beginner') {
      exerciseStats.maxDifficulty = exerciseStats.maxDifficulty === 'advanced' ? 'intermediate' : 'beginner';
    }

    // Get top muscle groups and categories efficiently
    const topMuscleGroups = Object.entries(exerciseStats.muscleGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([muscle]) => muscle);

    if (topMuscleGroups.length === 0) {
      topMuscleGroups.push('full body', 'core');
    }

    // Ensure minimum equipment options
    if (exerciseStats.successfulEquipment.size === 0) {
      ['bodyweight', 'none', 'dumbbell', 'resistance band']
        .forEach(eq => exerciseStats.successfulEquipment.add(eq));
    }

    const topCategories = exerciseStats.categories ? 
      Object.entries(exerciseStats.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([category]) => category) : 
      ['strength', 'cardio'];

    // Efficient query for recommended exercises using aggregation
    const recommendationsPipeline = [
      {
        $match: {
          _id: { $nin: Array.from(exerciseStats.completedExercises) },
          $or: [
            { idealFor: exerciseStats.maxDifficulty },
            { 
              idealFor: exerciseStats.maxDifficulty === 'beginner' ? 'intermediate' :
                       exerciseStats.maxDifficulty === 'advanced' ? 'intermediate' : 
                       'beginner'
            }
          ],
          rating: { $gte: 3.5 }
        }
      },
      {
        $match: {
          $or: [
            { target: { $in: topMuscleGroups } },
            { target: topMuscleGroups[0] },
            { secondaryMuscles: { $in: topMuscleGroups } }
          ]
        }
      },
      {
        $match: {
          equipment: { $in: Array.from(exerciseStats.successfulEquipment) },
          category: { $in: topCategories }
        }
      },
      {
        $project: {
          exerciseName: 1,
          mainImage: 1,
          caloriesBurnedPerSet: 1,
          duration: { $ifNull: ["$duration", 30] }, // Default duration if not set
          category: 1,
          bodyPart: 1,
          equipment: 1,
          target: 1,
          secondaryMuscles: 1,
          idealFor: {
            $cond: {
              if: { $isArray: "$idealFor" },
              then: "$idealFor",
              else: ["$idealFor"]
            }
          },
          rating: 1
        }
      },
      { $sort: { rating: -1 } },
      { $limit: 8 }
    ];

    let recommendedExercises = await v2Conn.model('V3_exercises')
      .aggregate(recommendationsPipeline);

    // Fallback to broader search if no recommendations found
    if (!recommendedExercises.length) {
      recommendedExercises = await v2Conn.model('V3_exercises').aggregate([
        {
          $match: {
            difficulty: 'beginner',
            equipment: { $in: ['bodyweight', 'none'] },
            rating: { $gte: 4 }
          }
        },
        {
          $project: {
            exerciseName: 1,
            mainImage: 1,
            caloriesBurnedPerSet: 1,
            duration: 1,
            category: 1,
            bodyPart: 1,
            equipment: 1,
            target: 1,
            secondaryMuscles: 1,
            idealFor: 1,
            rating: 1
          }
        },
        { $sort: { rating: -1 } },
        { $limit: 8 }
      ]);
    }

    // Group exercises efficiently and collect stats
    const CDN_URL = 'https://cdn.trackeatfit.me';
    const allEquipment = new Set();
    const muscleGroups = new Set();
    
    // Sort exercises by category priority (compound exercises first)
    const categoryPriority = {
      'compound': 3,
      'strength': 2,
      'cardio': 1,
      'other': 0
    };
    
    const groupedExercises = recommendedExercises.reduce((acc, exercise) => {
      // Update mainImage URL
      if (exercise.mainImage) {
        exercise.mainImage = exercise.mainImage.replace(
          'https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com',
          CDN_URL
        );
      }

      // Track equipment
      if (exercise.equipment) {
        if (Array.isArray(exercise.equipment)) {
          exercise.equipment.forEach(eq => allEquipment.add(eq));
        } else {
          allEquipment.add(exercise.equipment);
        }
      }

      // Get primary target and track all muscle groups
      const targetMuscles = Array.isArray(exercise.target) ? exercise.target : [exercise.target];
      const primaryMuscle = targetMuscles[0] || 'other';
      muscleGroups.add(primaryMuscle);

      // Track secondary muscles for comprehensive muscle group list
      if (exercise.secondaryMuscles) {
        (Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])
          .forEach(muscle => muscleGroups.add(muscle));
      }

      if (!acc[primaryMuscle]) {
        acc[primaryMuscle] = [];
      }
      
      // Calculate exercise complexity score
      const complexityScore = (
        (exercise.secondaryMuscles?.length || 0) * 0.5 + 
        (categoryPriority[exercise.category] || 0) +
        (exercise.rating || 0)
      );
      
      // Add complexity score for sorting
      acc[primaryMuscle].push({
        ...exercise,
        _complexityScore: complexityScore
      });
      
      // Sort exercises within group by complexity score
      acc[primaryMuscle].sort((a, b) => b._complexityScore - a._complexityScore);
      
      // Remove complexity score before returning
      acc[primaryMuscle] = acc[primaryMuscle].map(({ _complexityScore, ...rest }) => rest);
      
      return acc;
    }, {});

    // Sort and prepare muscle groups based on exercise count and complexity
    const muscleGroupScores = {};
    Object.entries(groupedExercises).forEach(([group, exercises]) => {
      const totalComplexity = exercises.reduce((sum, ex) => 
        sum + (ex.secondaryMuscles?.length || 0) + (categoryPriority[ex.category] || 0), 0);
      muscleGroupScores[group] = totalComplexity * exercises.length;
    });

    const sortedMuscleGroups = Object.entries(muscleGroupScores)
      .sort((a, b) => b[1] - a[1])
      .map(([group]) => group);

    // Generate appropriate reason using sorted muscle groups
    const reason = !recommendedExercises.length
      ? "We're preparing some beginner-friendly exercises to help you start your fitness journey!"
      : userProgress.length === 0 || totalExercises === 0
      ? `Here are some ${exerciseStats.maxDifficulty} level exercises focusing on ${sortedMuscleGroups.join(' and ')} to get you started!`
      : `Based on your performance and preferences, we've selected ${exerciseStats.maxDifficulty} level exercises focusing on ${sortedMuscleGroups.join(' and ')} to help you progress in your fitness journey.`;

    // Calculate stats from actual recommendations
    const equipmentCounts = {};
    let totalDurationFromRecs = 0;
    let exerciseCount = 0;

    recommendedExercises.forEach(exercise => {
      // Track equipment frequency
      if (exercise.equipment) {
        const equipment = Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment];
        equipment.forEach(eq => {
          equipmentCounts[eq] = (equipmentCounts[eq] || 0) + 1;
        });
      }

      // Calculate average duration from recommendations
      if (exercise.duration) {
        totalDurationFromRecs += exercise.duration;
        exerciseCount++;
      }
    });

    const sortedEquipment = Object.entries(equipmentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([eq]) => eq);

    // Calculate preferred duration from recommendations, fallback to user history or default
    const calculatedDuration = exerciseCount > 0 
      ? Math.round(totalDurationFromRecs / exerciseCount)
      : exerciseStats.preferredDuration || 30;

    // Get all unique equipment from actual recommendations
    const actualEquipment = new Set();
    Object.values(groupedExercises).flat().forEach(exercise => {
      if (exercise.equipment) {
        if (Array.isArray(exercise.equipment)) {
          exercise.equipment.forEach(eq => actualEquipment.add(eq));
        } else {
          actualEquipment.add(exercise.equipment);
        }
      }
    });

    // Prepare final stats based on actual recommendations
    const recommendationStats = {
      preferredDuration: calculatedDuration,
      topMuscleGroups: sortedMuscleGroups,
      difficulty: exerciseStats.maxDifficulty,
      preferredEquipment: Array.from(actualEquipment)
    };

    // Validate and sanitize response data
    const validateExercise = (exercise) => {
      return {
        ...exercise,
        duration: exercise.duration || 30,
        caloriesBurnedPerSet: exercise.caloriesBurnedPerSet || 0,
        rating: exercise.rating || 4.0,
        idealFor: Array.isArray(exercise.idealFor) ? exercise.idealFor : [exercise.idealFor],
        secondaryMuscles: Array.isArray(exercise.secondaryMuscles) ? 
          exercise.secondaryMuscles : 
          exercise.secondaryMuscles ? [exercise.secondaryMuscles] : []
      };
    };

    // Validate all exercises in grouped recommendations
    Object.keys(groupedExercises).forEach(muscleGroup => {
      groupedExercises[muscleGroup] = groupedExercises[muscleGroup]
        .map(validateExercise)
        .filter(exercise => 
          exercise.exerciseName && 
          exercise.mainImage && 
          exercise.target
        );
    });

    // Remove empty muscle groups
    Object.keys(groupedExercises).forEach(muscleGroup => {
      if (groupedExercises[muscleGroup].length === 0) {
        delete groupedExercises[muscleGroup];
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        recommendations: groupedExercises,
        reason,
        stats: recommendationStats
      }
    });

  } catch (err) {
    console.error('Error generating exercise recommendations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate exercise recommendations'
    });
  }
});

module.exports = router;
