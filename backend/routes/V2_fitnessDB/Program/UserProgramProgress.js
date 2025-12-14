// /routes/userProgress.js
const express = require('express');
const router = express.Router();
const { UserProgramProgress } = require('../../../models/V2_fitnessDB/Program/UserProgramProgress');
const { ExerciseProgram: ExerciseProgramModel, ProgramSchema } = require('../../../models/V2_fitnessDB/Program/ExerciseProgram');
const { V3_exerciseSchema } = require('../../../models/V2_fitnessDB/V3_exercises');

const { getV2FitnessConnection } = require('../../../config/database');
let ExerciseProgram;


// Always ensure both models are registered on the connection
router.use((req, res, next) => {
    const v2Conn = getV2FitnessConnection();
    if (v2Conn) {
        if (!ExerciseProgram) {
            // Register the ExerciseProgram model if not already
            ExerciseProgram = v2Conn.model('ExerciseProgram', ProgramSchema, 'exercise_programs');
        }
        // Register V3_exercises model if not already
        if (!v2Conn.models.V3_exercises) {
            v2Conn.model('V3_exercises', V3_exerciseSchema, 'V3_exercises');
        }
    }
    next();
});

// ✅ GET progress for a specific user & program
router.get('/progress/:userId/:programId', async (req, res) => {
  try {
    const { userId, programId } = req.params;
    // Run both queries in parallel for lower latency
    const [progress, program] = await Promise.all([
      UserProgramProgress.findOne({ userId, programId }),
      ExerciseProgram.findById(programId)
        .select('name description category targetMuscleGroups goal trainingStyle duration difficulty environment genderSuitability recommendedEquipment tags thumbnail schedule')
        .lean()
    ]);
    if (!progress) return res.status(404).json({ success: false, message: 'Progress not found' });

    // Calculate missed days and update progress
    if (program.schedule) {
      progress.calculateMissedDays(program.schedule);
      const totalDays = program.duration.weeks * program.duration.sessionsPerWeek;
      progress.recalculateProgress(totalDays);
      await progress.save();
    }

    // Convert to lean object after saving
    const progressData = progress.toObject();

    // CDN URL replacement for thumbnail
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const replaceCdn = url =>
      url && typeof url === 'string'
        ? url.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : url;

    if (program && program.thumbnail) {
      program.thumbnail = replaceCdn(program.thumbnail);
    }
    progressData.programDetails = program || null;
    return res.status(200).json({
      success: true,
      data: progressData
    });
  } catch (err) {
    console.error('Error fetching user progress:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ GET all programs for a user
router.get('/progress/:userId', async (req, res) => {
  try {
    // Find all progress docs for the user
    const progress = await UserProgramProgress.find({ userId: req.params.userId })
      .select('programId programName status startedAt completedAt progressPercentage totalSessionsCompleted totalMinutesTrained ratingGiven feedback')
      .lean();

    // If no progress, return early
    if (!progress.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Use Set to avoid duplicate programId queries
    const programIds = [...new Set(progress.map(p => p.programId?.toString()).filter(Boolean))];
    if (!programIds.length) {
      // No valid programIds, return progress as is
      return res.status(200).json({ success: true, data: progress });
    }

    // Only fetch needed fields, and use lean for performance
    const programs = await ExerciseProgram.find({ _id: { $in: programIds } })
      .select('name description category targetMuscleGroups goal trainingStyle duration difficulty environment genderSuitability recommendedEquipment tags thumbnail')
      .lean();

    // CDN URL replacement for thumbnail
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const replaceCdn = url =>
      url && typeof url === 'string'
        ? url.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : url;

    // Build a map for O(1) lookup
    const programMap = Object.create(null);
    for (const p of programs) {
      if (p.thumbnail) {
        p.thumbnail = replaceCdn(p.thumbnail);
      }
      programMap[p._id.toString()] = p;
    }

    // Attach program details efficiently
    for (const p of progress) {
      const prog = programMap[p.programId?.toString()];
      p.programDetails = prog || null;
    }

    return res.status(200).json({ success: true, data: progress });
  } catch (err) {
    console.error('Error fetching user programs:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ POST - Log a new session (auto-recalculates progress and missed days)
router.post('/progress/:userId/:programId/session', async (req, res) => {
  try {
    const [progress, program] = await Promise.all([
      UserProgramProgress.findOne({
        userId: req.params.userId,
        programId: req.params.programId
      }),
      ExerciseProgram.findById(req.params.programId).lean()
    ]);

    if (!progress) return res.status(404).json({ success: false, message: 'Progress not found' });

    progress.sessionLogs.push(req.body);

    const totalDays = program.duration.weeks * program.duration.sessionsPerWeek;
    
    // Calculate missed days using program schedule
    progress.calculateMissedDays(program.schedule || []);
    
    // Recalculate overall progress
    progress.recalculateProgress(totalDays);
    await progress.save();

    return res.status(200).json({ success: true, message: 'Session logged successfully', data: progress });
  } catch (err) {
    console.error('Error logging session:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ POST - Start a new program
router.post('/progress/:userId/:programId/start', async (req, res) => {
  try {
    const [existingProgress, program] = await Promise.all([
      UserProgramProgress.findOne({
        userId: req.params.userId,
        programId: req.params.programId
      }),
      ExerciseProgram.findById(req.params.programId).lean()
    ]);

    if (existingProgress) return res.status(400).json({ success: false, message: 'Program already started' });
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

    const progress = new UserProgramProgress({
      userId: req.params.userId,
      programId: req.params.programId,
      programName: req.body.programName || program.name,
      startedAt: new Date(),
      status: 'in_progress'
    });

    // Calculate initial missed days if any
    if (program.schedule) {
      progress.calculateMissedDays(program.schedule);
      const totalDays = program.duration.weeks * program.duration.sessionsPerWeek;
      progress.recalculateProgress(totalDays);
    }

    await progress.save();
    return res.status(201).json({ 
      success: true, 
      message: 'Program started', 
      data: progress.toObject() 
    });
  } catch (err) {
    console.error('Error starting program:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ PATCH - Update session log by index
router.patch('/progress/:userId/:programId/session/:index', async (req, res) => {
  try {
    const { userId, programId, index } = req.params;
    const updates = req.body;

    const [progress, program] = await Promise.all([
      UserProgramProgress.findOne({ userId, programId }),
      ExerciseProgram.findById(programId).lean()
    ]);

    if (!progress) return res.status(404).json({ success: false, message: 'Progress not found' });

    if (!progress.sessionLogs[index]) {
      return res.status(404).json({ success: false, message: 'Session log not found at index' });
    }

    Object.assign(progress.sessionLogs[index], updates);

    const totalDays = program.duration.weeks * program.duration.sessionsPerWeek;
    
    // Calculate missed days using program schedule whenever session is updated
    progress.calculateMissedDays(program.schedule || []);

    progress.recalculateProgress(totalDays);
    await progress.save();

    return res.status(200).json({ success: true, message: 'Session log updated', data: progress });
  } catch (err) {
    console.error('Error updating session log:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ DELETE - Remove a session log by index
router.delete('/progress/:userId/:programId/session/:index', async (req, res) => {
  try {
    const { userId, programId, index } = req.params;
    const [progress, program] = await Promise.all([
      UserProgramProgress.findOne({ userId, programId }),
      ExerciseProgram.findById(programId).lean()
    ]);

    if (!progress) return res.status(404).json({ success: false, message: 'Progress not found' });
    if (!progress.sessionLogs[index]) {
      return res.status(404).json({ success: false, message: 'Session log not found at index' });
    }

    progress.sessionLogs.splice(index, 1);

    const totalDays = program.duration.weeks * program.duration.sessionsPerWeek;
    
    // Recalculate missed days after removing a session
    progress.calculateMissedDays(program.schedule || []);

    progress.recalculateProgress(totalDays);
    await progress.save();

    return res.status(200).json({ success: true, message: 'Session log removed', data: progress });
  } catch (err) {
    console.error('Error deleting session log:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🎯 GET - Get personalized program recommendations
router.get('/recommendations/:userId', async (req, res) => {
  try {
    // 1. Get user's program history and preferences
    const userProgress = await UserProgramProgress.find({ userId: req.params.userId })
      .select('programId status ratingGiven completedAt totalSessionsCompleted difficulty')
      .lean();

    if (!userProgress.length) {
      // New user - recommend beginner programs
      const beginnerPrograms = await ExerciseProgram.find({
        difficulty: 'beginner',
        isFeatured: true
      })
      .select('_id programName category goal duration difficulty thumbnail isFeatured rating')
      .limit(5)
      .lean();

      // Transform the results to include totalWorkouts and fix thumbnail URL
      const CDN_URL = 'https://cdn.trackeatfit.xyz';
      const recommendations = beginnerPrograms.map(program => ({
        _id: program._id,
        programName: program.programName,
        category: program.category,
        goal: program.goal,
        duration: program.duration,
        difficulty: program.difficulty,
        thumbnail: program.thumbnail
          ? program.thumbnail.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
          : program.thumbnail,
        isFeatured: program.isFeatured,
        rating: program.rating,
        totalWorkouts: program.duration ? program.duration.weeks * program.duration.sessionsPerWeek : null
      }));

      return res.status(200).json({
        success: true,
        data: {
          recommendations,
          reason: 'Welcome! These beginner-friendly programs are perfect to start your fitness journey.'
        }
      });
    }

    // 2. Analyze user's preferences and performance
    const programIds = userProgress.map(p => p.programId);
    const completedPrograms = await ExerciseProgram.find({
      _id: { $in: programIds }
    }).lean();

    // Create preference profile
    const preferences = {
      categories: {},
      goals: {},
      difficulty: 'beginner',
      successfulStyles: new Set(),
      avgSessionsCompleted: 0
    };

    let totalSessions = 0;
    completedPrograms.forEach(program => {
      const progress = userProgress.find(p => p.programId.toString() === program._id.toString());
      
      // Consider both completed and in-progress programs for better recommendations
      if (progress && (progress.status === 'completed' || progress.status === 'in_progress')) {
        // Store categories in uppercase to match schema enum
        const category = (program.category || '').toUpperCase();
        const goal = (program.goal || '').toLowerCase();
        
        if (category) {
          preferences.categories[category] = (preferences.categories[category] || 0) + 1;
        }
        if (goal) {
          // Normalize common goal variations
          const normalizedGoal = goal
            .replace(/weight loss/i, 'fat loss')
            .replace(/lose weight/i, 'fat loss')
            .replace(/muscle gain/i, 'muscle gain')  // Match exact enum value
            .replace(/strength gain/i, 'general fitness');
          preferences.goals[normalizedGoal] = (preferences.goals[normalizedGoal] || 0) + 1;
        }
        if (program.trainingStyle) {
          preferences.successfulStyles.add(program.trainingStyle);  // Keep original case for enum match
        }
        totalSessions += progress.totalSessionsCompleted || 0;
      }
    });

    // Calculate average sessions and determine appropriate difficulty
    preferences.avgSessionsCompleted = totalSessions / (userProgress.length || 1);
    if (preferences.avgSessionsCompleted > 20) preferences.difficulty = 'intermediate';
    if (preferences.avgSessionsCompleted > 40) preferences.difficulty = 'advanced';

    // 3. Generate recommendations
    const topCategory = Object.entries(preferences.categories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'CARDIO';
    const topGoal = Object.entries(preferences.goals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'fat loss';

    console.log('Current program attributes:', {
      topCategory,
      topGoal,
      difficulty: preferences.difficulty,
      programIds: programIds.map(id => id.toString())
    });

    // First try: find similar programs based on exact matches
    let recommendations = await ExerciseProgram.find({
      _id: { $ne: programIds[0] },  // Exclude current program
      $and: [
        { 
          $or: [
            { category: 'CARDIO' },
            { goal: 'fat loss' },
            { trainingStyle: 'HIIT' }
          ]
        },
        { difficulty: 'beginner' },
        { isFeatured: true }
      ]
    })
    .select('_id programName category goal duration difficulty thumbnail isFeatured rating')
    .sort({ rating: -1 })
    .limit(5)
    .lean();

    console.log('First recommendation attempt count:', recommendations.length);

    // If no recommendations found, try broader criteria
    if (!recommendations.length) {
      console.log('No initial recommendations, trying broader criteria');
      recommendations = await ExerciseProgram.find({
        _id: { $ne: programIds[0] },
        $or: [
          { 
            $and: [
              { category: 'CARDIO' },
              { difficulty: 'beginner' }
            ]
          },
          { 
            $and: [
              { goal: 'fat loss' },
              { difficulty: 'beginner' }
            ]
          },
          { 
            $and: [
              { isFeatured: true },
              { rating: { $gte: 4.0 } },
              { difficulty: 'beginner' }
            ]
          }
        ]
      })
      .select('_id programName category goal duration difficulty thumbnail isFeatured rating')
      .sort({ rating: -1 })
      .limit(5)
      .lean();

      console.log('Second recommendation attempt count:', recommendations.length);
    }

    // Last resort: any quality beginner programs
    if (!recommendations.length) {
      console.log('Still no recommendations, using fallback query');
      recommendations = await ExerciseProgram.find({
        _id: { $ne: programIds[0] },
        difficulty: 'beginner',
        rating: { $gte: 4.0 }
      })
      .select('_id programName category goal duration difficulty thumbnail isFeatured rating')
      .sort({ rating: -1, isFeatured: -1 })
      .limit(5)
      .lean();

      console.log('Final recommendation attempt count:', recommendations.length);
    }

    // Add totalWorkouts field to each recommendation
    recommendations = recommendations.map(program => ({
      _id: program._id,
      programName: program.programName,
      category: program.category,
      goal: program.goal,
      duration: program.duration,
      difficulty: program.difficulty,
      thumbnail: program.thumbnail
        ? program.thumbnail.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : program.thumbnail,
      isFeatured: program.isFeatured,
      rating: program.rating,
      totalWorkouts: program.duration ? program.duration.weeks * program.duration.sessionsPerWeek : null
    }));

    // Log the final recommendations for debugging
    console.log('Final recommendations:', recommendations.map(r => ({
      programName: r.programName,
      category: r.category,
      goal: r.goal,
      difficulty: r.difficulty,
      totalWorkouts: r.totalWorkouts
    })));

    // 4. Add explanation for recommendations with better messaging
    let reason;
    if (recommendations.length === 0) {
      reason = "We're preparing more programs similar to your '7-Day Fat Loss Blast' program. Check back soon!";
    } else {
      const count = recommendations.length;
      reason = `We found ${count} program${count > 1 ? 's' : ''} similar to your '7-Day Fat Loss Blast' that focus on ${topGoal} through ${topCategory.toLowerCase()} training.`;
    }

    // Add debug information in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Recommendations query result:', {
        recommendationsCount: recommendations.length,
        topCategory,
        topGoal,
        difficulty: preferences.difficulty
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        reason,
        preferences // Include analyzed preferences for transparency
      }
    });

  } catch (err) {
    console.error('Error generating recommendations:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Helper function to get appropriate difficulty levels for recommendations
function getDifficultyLevels(currentDifficulty) {
  switch (currentDifficulty) {
    case 'beginner':
      return ['beginner', 'intermediate'];
    case 'intermediate':
      return ['intermediate', 'beginner', 'advanced'];
    case 'advanced':
      return ['advanced', 'intermediate'];
    default:
      return ['beginner', 'intermediate', 'advanced'];
  }
}

// Exercise recommendations endpoint moved to another file
/*
router.get('/exercise-recommendations/:userId', async (req, res) => {
//   try {
//     // 1. Get user's workout history
//     const userProgress = await UserProgramProgress.find({ userId: req.params.userId })
//       .select('sessionLogs programId')
//       .populate({
//         path: 'programId',
//         select: 'category targetMuscleGroups difficulty'
//       })
//       .lean();

//     // Handle new users with no history
//     if (!userProgress.length) {
//       const v2Conn = getV2FitnessConnection();
//       if (!v2Conn) {
//         throw new Error('Database connection not available');
//       }
//       const beginnerExercises = await v2Conn.model('V3_exercises').find({
//         difficulty: 'beginner',
//         equipment: { $in: ['bodyweight', 'none'] },
//         rating: { $gte: 4 }
//       })
//       .limit(8)
//       .lean();

//       return res.status(200).json({
//         success: true,
//         data: {
//           recommendations: beginnerExercises,
//           reason: 'Here are some beginner-friendly exercises to get you started!',
//           muscleGroups: ['full body'],
//           difficulty: 'beginner'
//         }
//       });
//     }

//     // 2. Analyze exercise history and performance
//     const exerciseStats = {
//       completedExercises: new Set(),
//       muscleGroups: {},
//       successfulEquipment: new Set(),
//       maxDifficulty: 'beginner',
//       preferredDuration: 0
//     };

//     let totalExercises = 0;
//     let totalDuration = 0;

//     // Get all unique exercise IDs from session logs
//     const exerciseIds = new Set();
//     userProgress.forEach(progress => {
//       progress.sessionLogs.forEach(session => {
//         session.completedExercises.forEach(exercise => {
//           if (!exercise.skipped && exercise.exerciseId) {
//             exerciseIds.add(exercise.exerciseId.toString());
//           }
//         });
//       });
//     });

//     // Fetch detailed exercise information
//     const v2Conn = getV2FitnessConnection();
//     if (!v2Conn) {
//       throw new Error('Database connection not available');
//     }
    
//     const exerciseDetails = await v2Conn.model('V3_exercises').find({
//       _id: { $in: Array.from(exerciseIds) }
//     })
//     .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
//     .lean();

//     // Create exercise details map for quick lookup
//     const exerciseDetailsMap = {};
//     exerciseDetails.forEach(ex => {
//       exerciseDetailsMap[ex._id.toString()] = ex;
//     });

//     // Process all session logs with detailed exercise information
//     userProgress.forEach(progress => {
//       progress.sessionLogs.forEach(session => {
//         session.completedExercises.forEach(exercise => {
//           if (!exercise.skipped && exercise.exerciseId) {
//             const details = exerciseDetailsMap[exercise.exerciseId.toString()];
//             exerciseStats.completedExercises.add(exercise.exerciseId.toString());
//             totalExercises++;

//             if (details) {
//               // Track equipment
//               if (details.equipment) {
//                 (Array.isArray(details.equipment) ? details.equipment : [details.equipment])
//                   .forEach(eq => exerciseStats.successfulEquipment.add(eq));
//               }

//               // Track muscle groups - ensure target is always an array
//               if (details.target) {
//                 const targets = Array.isArray(details.target) ? details.target : [details.target];
//                 targets.forEach(muscle => {
//                   if (muscle) {
//                     exerciseStats.muscleGroups[muscle] = (exerciseStats.muscleGroups[muscle] || 0) + 1;
//                   }
//                 });
//               }

//               // Track secondary muscles for broader recommendations - ensure array
//               if (details.secondaryMuscles) {
//                 const secondaryMuscles = Array.isArray(details.secondaryMuscles) ? 
//                   details.secondaryMuscles : [details.secondaryMuscles];
//                 secondaryMuscles.forEach(muscle => {
//                   if (muscle) {
//                     exerciseStats.muscleGroups[muscle] = (exerciseStats.muscleGroups[muscle] || 0) + 0.5; // Give less weight to secondary muscles
//                   }
//                 });
//               }

//               // Track workout style/category
//               if (details.category) {
//                 exerciseStats.categories = exerciseStats.categories || {};
//                 exerciseStats.categories[details.category] = (exerciseStats.categories[details.category] || 0) + 1;
//               }

//               // Track difficulty progression
//               if (details.idealFor === 'advanced') {
//                 exerciseStats.maxDifficulty = 'advanced';
//               } else if (details.idealFor === 'intermediate' && exerciseStats.maxDifficulty !== 'advanced') {
//                 exerciseStats.maxDifficulty = 'intermediate';
//               }
//             }
//           }
//         });

//         // Track session duration and energy levels
//         if (session.durationInMinutes) {
//           totalDuration += session.durationInMinutes;
//         }

//         // Track user's energy and difficulty ratings
//         if (session.energyLevel) {
//           exerciseStats.avgEnergyLevel = (exerciseStats.avgEnergyLevel || 0) + session.energyLevel;
//           exerciseStats.energyLevelCount = (exerciseStats.energyLevelCount || 0) + 1;
//         }
//         if (session.difficultyRating) {
//           exerciseStats.avgDifficultyRating = (exerciseStats.avgDifficultyRating || 0) + session.difficultyRating;
//           exerciseStats.difficultyRatingCount = (exerciseStats.difficultyRatingCount || 0) + 1;
//         }
//       });

//       // Track muscle groups from programs
//       if (progress.programId?.targetMuscleGroups) {
//         progress.programId.targetMuscleGroups.forEach(muscle => {
//           exerciseStats.muscleGroups[muscle] = (exerciseStats.muscleGroups[muscle] || 0) + 1;
//         });
//       }

//       // Track maximum difficulty achieved
//       if (progress.programId?.difficulty === 'advanced') {
//         exerciseStats.maxDifficulty = 'advanced';
//       } else if (progress.programId?.difficulty === 'intermediate' && exerciseStats.maxDifficulty !== 'advanced') {
//         exerciseStats.maxDifficulty = 'intermediate';
//       }
//     });

//     // Calculate preferred exercise duration with better defaults
//     exerciseStats.preferredDuration = Math.round(totalDuration / totalExercises) || 30; // default to 30 mins

//     // 3. Generate exercise recommendations
//     let topMuscleGroups = Object.entries(exerciseStats.muscleGroups)
//       .sort(([,a], [,b]) => b - a)
//       .slice(0, 2)
//       .map(([muscle]) => muscle);

//     // If no muscle groups found, provide defaults
//     if (topMuscleGroups.length === 0) {
//       topMuscleGroups = ['full body', 'core']; // Default muscle groups for beginners
//     }
    
//     // Ensure we have some equipment options
//     if (exerciseStats.successfulEquipment.size === 0) {
//       ['bodyweight', 'none', 'dumbbell', 'resistance band'].forEach(eq => 
//         exerciseStats.successfulEquipment.add(eq)
//       );
//     }

    

//     // Calculate average energy and difficulty ratings
//     const avgEnergyLevel = exerciseStats.energyLevelCount ? 
//       exerciseStats.avgEnergyLevel / exerciseStats.energyLevelCount : 3;
//     const avgDifficultyRating = exerciseStats.difficultyRatingCount ? 
//       exerciseStats.avgDifficultyRating / exerciseStats.difficultyRatingCount : 3;

//     // Adjust difficulty based on user's ratings
//     if (avgDifficultyRating < 2.5 && exerciseStats.maxDifficulty !== 'advanced') {
//       exerciseStats.maxDifficulty = exerciseStats.maxDifficulty === 'beginner' ? 'intermediate' : 'advanced';
//     } else if (avgDifficultyRating > 4 && exerciseStats.maxDifficulty !== 'beginner') {
//       exerciseStats.maxDifficulty = exerciseStats.maxDifficulty === 'advanced' ? 'intermediate' : 'beginner';
//     }

//     // Get top exercise categories
//     const topCategories = exerciseStats.categories ? 
//       Object.entries(exerciseStats.categories)
//         .sort(([,a], [,b]) => b - a)
//         .slice(0, 2)
//         .map(([category]) => category) : 
//       ['strength', 'cardio'];

//     // Find exercises that match user's profile with more flexible criteria
//     let recommendedExercises = await v2Conn.model('V3_exercises').find({
//       _id: { $nin: Array.from(exerciseStats.completedExercises) },
//       $or: [
//         { idealFor: exerciseStats.maxDifficulty },
//         { 
//           idealFor: exerciseStats.maxDifficulty === 'beginner' ? 'intermediate' :
//                    exerciseStats.maxDifficulty === 'advanced' ? 'intermediate' : 
//                    'beginner'
//         }
//       ],
//       $and: [
//         { $or: [
//           { target: { $in: topMuscleGroups } },
//           { target: topMuscleGroups[0] }, // Handle single string case
//           { secondaryMuscles: { $in: topMuscleGroups } }
//         ]},
//         { equipment: { $in: Array.from(exerciseStats.successfulEquipment) } },
//         { category: { $in: topCategories } },
//         { rating: { $gte: 3.5 } }
//       ]
//     })
//     .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
//     .sort({ rating: -1 })
//     .limit(8)
//     .lean();

//     // If no exercises found, try a broader search
//     if (!recommendedExercises.length) {
//       recommendedExercises = await v2Conn.model('V3_exercises').find({
//         difficulty: 'beginner',
//         equipment: { $in: ['bodyweight', 'none'] },
//         rating: { $gte: 4 }
//       })
//       .select('exerciseName mainImage caloriesBurnedPerSet duration category bodyPart equipment target secondaryMuscles idealFor rating')
//       .sort({ rating: -1 })
//       .limit(8)
//       .lean();
//     }

//     // 4. Group exercises by muscle groups for better organization
//     const groupedExercises = {};
//     const CDN_URL = 'https://cdn.trackeatfit.xyz';
//     recommendedExercises.forEach(exercise => {
//       // Update mainImage URL to use CDN
//       if (exercise.mainImage) {
//         exercise.mainImage = exercise.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL);
//       }
      
//       // Handle both array and string cases for target muscles
//       const targetMuscles = Array.isArray(exercise.target) ? exercise.target : [exercise.target];
//       const primaryMuscle = targetMuscles[0] || 'other';
      
//       if (!groupedExercises[primaryMuscle]) {
//         groupedExercises[primaryMuscle] = [];
//       }
//       groupedExercises[primaryMuscle].push(exercise);
//     });

//     // 5. Add explanation for recommendations with better messaging
//     let reason;
//     if (recommendedExercises.length === 0) {
//       reason = "We're preparing some beginner-friendly exercises to help you start your fitness journey!";
//     } else if (userProgress.length === 0 || totalExercises === 0) {
//       reason = `Here are some ${exerciseStats.maxDifficulty} level exercises focusing on ${topMuscleGroups.join(' and ')} to get you started!`;
//     } else {
//       reason = `Based on your performance and preferences, we've selected ${exerciseStats.maxDifficulty} level exercises ` +
//         `focusing on ${topMuscleGroups.join(' and ')} to help you progress in your fitness journey.`;
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         recommendations: groupedExercises,
//         reason,
//         stats: {
//           preferredDuration: exerciseStats.preferredDuration,
//           topMuscleGroups,
//           difficulty: exerciseStats.maxDifficulty,
//           preferredEquipment: Array.from(exerciseStats.successfulEquipment)
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Error generating exercise recommendations:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to generate exercise recommendations'
//     });
//   }
});
*/

module.exports = router;
