const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const router = express.Router();

const { getV2FitnessConnection } = require('../../config/database');
const { V3_exerciseSchema } = require('../../models/V2_fitnessDB/V3_exercises');
const FavoriteExecrise = require('../../models/V2_fitnessDB/FavoriteExercise'); // Add this import

let V3_exercise;

router.use((req, res, next) => {
    if (!V3_exercise) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            V3_exercise = v2Conn.model('V3_exercise', V3_exerciseSchema, 'V3_exercises');
        }
    }
    next();
});

// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

router.use(compression());
router.use(setCloudflareCacheHeader);

// Get all V3 exercises with pagination
router.get('/', async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find({}, projection).skip(skip).limit(limit).lean(),
      V3_exercise.countDocuments()
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get V3 exercises by bodyPart
router.get('/bodypart/:bodyPart', async (req, res) => {
  try {
    let { bodyPart } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find({ bodyPart }, projection).skip(skip).limit(limit).lean(),
      V3_exercise.countDocuments({ bodyPart })
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get V3 exercises by equipment
router.get('/equipment/:equipment', async (req, res) => {
  try {
    let { equipment } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find({ equipment }, projection).skip(skip).limit(limit).lean(),
      V3_exercise.countDocuments({ equipment })
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get V3 exercises by category (exerciseType)
router.get('/exercisetype/:exerciseType', async (req, res) => {
  try {
    let { exerciseType } = req.params;
    exerciseType = exerciseType.toLowerCase();
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    // Use lean() for faster queries and project only required fields
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find({ category: exerciseType }, projection).skip(skip).limit(limit).lean(),
      V3_exercise.countDocuments({ category: exerciseType })
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get V3 exercises by idealFor (difficulty)
router.get('/difficulty/:difficulty', async (req, res) => {
  try {
    let { difficulty } = req.params;
    difficulty = difficulty.toLowerCase();
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find({ idealFor: difficulty }, projection).skip(skip).limit(limit).lean(),
      V3_exercise.countDocuments({ idealFor: difficulty })
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search V3 exercises by exerciseName, bodyPart, equipment, or category
router.get('/search', async (req, res) => {
  try {
    const { query = '', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(query, 'i');
    const searchQuery = {
      $or: [
        { exerciseName: searchRegex },
        { bodyPart: searchRegex },
        { equipment: searchRegex },
        { category: searchRegex }
      ]
    };
    const projection = {
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
    };
    const [exercises, total] = await Promise.all([
      V3_exercise.find(searchQuery, projection).skip(skip).limit(parseInt(limit)).lean(),
      V3_exercise.countDocuments(searchQuery)
    ]);
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercises = exercises.map(obj => ({
      ...obj,
      mainImage: obj.mainImage
        ? obj.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : obj.mainImage
    }));
    const response = {
      data: updatedExercises,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    };
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get V3 exercise by _id (ObjectId)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Get userId from query param if provided
    let ex = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ex = await V3_exercise.findById(id);
    }
    if (!ex) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const updatedExercise = {
      ...ex.toObject(),
      mainImage: ex.mainImage
        ? ex.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : ex.mainImage
    };

    // Add isFavorite if userId is provided
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const fav = await FavoriteExecrise.findOne({ userId, exerciseId: id });
      updatedExercise.isFavorite = !!fav;
    }

    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
    res.json(updatedExercise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new exercise
router.post('/', async (req, res) => {
  try {
    const exercise = new V3_exercise(req.body);
    const saved = await exercise.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE exercise by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await V3_exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Exercise not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE exercise by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await V3_exercise.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Exercise not found' });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
