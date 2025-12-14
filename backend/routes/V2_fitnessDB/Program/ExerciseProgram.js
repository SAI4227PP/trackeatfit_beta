const express = require('express');
const router = express.Router();


// Import the model and schema separately to avoid naming conflicts
const { ExerciseProgram: ExerciseProgramModel, ProgramSchema } = require('../../../models/V2_fitnessDB/Program/ExerciseProgram');
const { UserProgramProgress } = require('../../../models/V2_fitnessDB/Program/UserProgramProgress');
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



// @route   GET /api/v2/programs
// @desc    Get all programs (with optional filters & pagination)
// @access  Public

router.get('/', async (req, res) => {
  try {
    const {
      goal,
      category,
      difficulty,
      trainingStyle,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};

    if (goal) filters.goal = goal;
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (trainingStyle) filters.trainingStyle = trainingStyle;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [programs, total] = await Promise.all([
      ExerciseProgram.find(filters)
        .select('programName thumbnail category goal difficulty duration rating isFeatured schedule') // schedule needed for count
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      ExerciseProgram.countDocuments(filters)
    ]);

    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedPrograms = programs.map(program => {
      const totalWorkouts = Array.isArray(program.schedule)
        ? program.schedule.reduce((sum, day) => sum + (Array.isArray(day.exercises) ? day.exercises.length : 0), 0)
        : 0;
      return {
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
        totalWorkouts
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: updatedPrograms
    });
  } catch (err) {
    console.error('❌ Error fetching programs:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch programs',
      error: err.message
    });
  }
});


// @route   GET /api/v2/programs/:id
// @desc    Fetch a single exercise program (optimized)
// @access  Public

router.get('/:id', async (req, res) => {
  try {
    const program = await ExerciseProgram.findById(req.params.id)
      .populate({
        path: 'schedule.exercises.exercise',
        select: 'name equipment targetMuscles primaryImage caloriesBurnedPerSet duration rating isFeatured trainingStyle environment genderSuitability recommendedEquipment tags',
        options: { lean: true } // This also speeds up populated documents
      })
      .lean(); // remove mongoose methods, boosts performance

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found',
      });
    }

    // CDN URL replacement
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const replaceCdn = url =>
      url && typeof url === 'string'
        ? url.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : url;

    // 🚀 Optimized Structuring: only what's needed
    const response = {
      id: program._id,
      name: program.programName,
      description: program.description,
      category: program.category,
      goal: program.goal,
      targetMuscleGroups: program.targetMuscleGroups,
      difficulty: program.difficulty,
      rating: program.rating,
      isFeatured: program.isFeatured,
      trainingStyle: program.trainingStyle,
      environment: program.environment,
      genderSuitability: program.genderSuitability,
      recommendedEquipment: program.recommendedEquipment,
      tags: program.tags,
      duration: program.duration,
      thumbnail: replaceCdn(program.thumbnail),
      schedule: program.schedule.map(day => ({
        day: day.day,
        title: day.title,
        description: day.description,
        exercises: day.exercises.map(ex => ({
          id: ex.exercise?._id,
          name: ex.exerciseName || ex.exercise?.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          tempo: ex.tempo,
          notes: ex.notes,
          equipment: ex.exercise?.equipment,
          image: replaceCdn(ex.exercise?.primaryImage),
          calories: ex.exercise?.caloriesBurnedPerSet,
          duration: ex.exercise?.duration
        }))
      }))
    };

    // --- Add user program status if userId is provided ---
    if (req.query.userId) {
      try {
        const userProgress = await UserProgramProgress.findOne({
          userId: req.query.userId,
          programId: program._id
        }).lean();

        response.userProgramStatus = userProgress ? userProgress.status : 'not_started';
      } catch (progressErr) {
        // If error, just don't include status
        response.userProgramStatus = 'unknown';
      }
    }
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('❌ Program fetch error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});


// Create a new program
router.post('/newprograms', async (req, res) => {
  try {
    // Deep copy to avoid mutating req.body
    const programData = JSON.parse(JSON.stringify(req.body));

    // Map exerciseId -> exercise for each exercise in the schedule
    if (Array.isArray(programData.schedule)) {
      programData.schedule.forEach(day => {
        if (Array.isArray(day.exercises)) {
          day.exercises.forEach(ex => {
            if (ex.exerciseId) {
              ex.exercise = ex.exerciseId;
              delete ex.exerciseId;
            }
          });
        }
      });
    }

    const program = new ExerciseProgram(programData);
    await program.save();
    res.status(201).json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a program
router.put('/programs/:id', async (req, res) => {
  try {
    const program = await ExerciseProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a program
router.delete('/programs/:id', async (req, res) => {
  const program = await ExerciseProgram.findByIdAndDelete(req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  res.json({ message: 'Program deleted' });
});



module.exports = router;