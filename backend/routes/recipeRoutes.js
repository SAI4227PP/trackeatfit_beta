const express = require('express');
const router = express.Router();
const { getRecipeModel, connectRecipeDB } = require('../config/database');
const compression = require('compression');

// Enable compression for all routes
router.use(compression());

// Middleware to ensure database connection
router.use(async (req, res, next) => {
    try {
        const Recipe = getRecipeModel();
        if (!Recipe) {
            await connectRecipeDB();
        }
        next();
    } catch (error) {
        return res.status(500).json({ 
            message: 'Recipe database not connected',
            error: error.message 
        });
    }
});

// CDN URL for images
const CDN_URL = 'https://cdn.trackeatfit.me';

// Search recipes with minimal information and pagination
router.get('/search', async (req, res) => {
    try {
        // Input validation
        const searchQuery = req.query.q?.trim() || '';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const Recipe = getRecipeModel();
        const query = {
            recipe_name: { $regex: searchQuery, $options: 'i' }
        };

        const [rawRecipes, total] = await Promise.all([
            Recipe.find(query)
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    image: 1,
                    calories_per_serving: 1,
                    'recipe.cuisineType': 1,
                    'recipe.mealType': 1,
                    'recipe.dishType': 1,
                    'recipe.totalNutrients.FAT': 1,
                    'recipe.totalNutrients.CHOCDF': 1,
                    'recipe.totalNutrients.PROCNT': 1,
                })
                .lean() // Convert to plain JavaScript objects
                .skip(skip)
                .limit(limit)
                .sort({ recipe_name: 1 }),
            Recipe.countDocuments(query)
        ]);

        if (!rawRecipes || rawRecipes.length === 0) {
            return res.status(404).json({
                message: 'No recipes found',
                currentPage: page,
                totalPages: 0,
                totalRecipes: 0
            });
        }

        // Format response data
        const recipes = rawRecipes.map(recipe => ({
            recipe_id: recipe.recipe_id,
            recipe_name: recipe.recipe_name,
            image: recipe.image
                ? recipe.image.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
                : '',
            calories_per_serving: Number(recipe.calories_per_serving?.toFixed(2)) || 0,
            cuisineType: recipe.recipe?.cuisineType || ['Various'],
            mealType: recipe.recipe?.mealType || ['Main Course'],
            dishType: recipe.recipe?.dishType || ['Main'],
            nutrients: {
                fat: Number(recipe.recipe?.totalNutrients?.FAT?.quantity?.toFixed(2)) || 0,
                carbs: Number(recipe.recipe?.totalNutrients?.CHOCDF?.quantity?.toFixed(2)) || 0,
                protein: Number(recipe.recipe?.totalNutrients?.PROCNT?.quantity?.toFixed(2)) || 0
            }
        }));

        // Set cache headers (1 day)
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');

        res.json({
            recipes,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecipes: total
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ 
            message: 'Error searching recipes',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get all recipes with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.cuisineType) {
            query['recipe.cuisineType'] = req.query.cuisineType;
        }
        if (req.query.mealType) {
            query['recipe.mealType'] = req.query.mealType;
        }
        if (req.query.search) {
            query['recipe_name'] = { $regex: req.query.search, $options: 'i' };
        }

        const [rawRecipes, total] = await Promise.all([
            Recipe.find(query)
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    image: 1,
                    calories_per_serving: 1,
                    totalTime: 1,
                    dietLabels: 1,
                    'recipe.cuisineType': 1,
                    'recipe.mealType': 1,
                    'recipe.dishType': 1,
                    // 'recipe.healthLabels': 1
                })
                .lean()
                .skip(skip)
                .limit(limit)
                .sort({ recipe_name: 1 }),
            Recipe.countDocuments(query)
        ]);

        if (!rawRecipes || rawRecipes.length === 0) {
            return res.status(404).json({
                message: 'No recipes found',
                currentPage: page,
                totalPages: 0,
                totalRecipes: 0
            });
        }

        const formattedRecipes = rawRecipes.map(recipe => ({
            _id: recipe._id,
            recipe_id: recipe.recipe_id,
            recipe_name: recipe.recipe_name,
            image: recipe.image
                ? recipe.image.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
                : (recipe.recipe?.img_url
                    ? recipe.recipe.img_url.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
                    : ''),
            calories_per_serving: Number(recipe.calories_per_serving.toFixed(2)),
            totalTime: recipe.totalTime || 30,
            dietLabels: recipe.dietLabels  || [],
            // healthLabels: recipe.recipe?.healthLabels || [],
            cuisineType: recipe.recipe?.cuisineType || ['Various'],
            mealType: recipe.recipe?.mealType || ['Main Course'],
            dishType: recipe.recipe?.dishType || ['Main']
        }));

        res.json({
            recipes: formattedRecipes,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecipes: total
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get recipe by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        let recipe;
        
        // Try to find by ObjectId first
        try {
            recipe = await Recipe.findById(req.params.id)
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    image: 1,
                    calories_per_serving: 1,
                    totalTime: 1,
                    dietLabels: 1,
                    recipe: 1,
                    images: 1,
                    // totalCO2Emissions: 1,
                    // co2EmissionsClass: 1
                });
        } catch (error) {
            // If ObjectId fails, try to find by recipe_id
            recipe = await Recipe.findOne({ recipe_id: parseInt(req.params.id) })
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    image: 1,
                    calories_per_serving: 1,
                    totalTime: 1,
                    dietLabels: 1,
                    recipe: 1,
                    images: 1,
                    // totalCO2Emissions: 1,
                    // co2EmissionsClass: 1
                });
        }

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Return full recipe details
        res.json({
            recipe_id: recipe.recipe_id,
            recipe_name: recipe.recipe_name,
            image: recipe.image
                ? recipe.image.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
                : '',
            calories_per_serving: Number(recipe.calories_per_serving.toFixed(2)),
            totalTime: recipe.totalTime,
            dietLabels: recipe.dietLabels,
            recipe: recipe.recipe,
            images: Array.isArray(recipe.images)
                ? recipe.images.map(img =>
                    typeof img === 'string'
                        ? img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
                        : img
                  )
                : recipe.images,
            // totalCO2Emissions: recipe.totalCO2Emissions,
            // co2EmissionsClass: recipe.co2EmissionsClass,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/recipe/:id', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        let recipe;
        
        try {
            recipe = await Recipe.findById(req.params.id)
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    calories_per_serving: 1,
                    // 'totalNutrients.CHOCDF.quantity': 1,  // carbs
                    // 'totalNutrients.FAT.quantity': 1,     // fats
                    // 'totalNutrients.PROCNT.quantity': 1,  // protein
                    'recipe.yield': 1,  // serving size
                });
        } catch (error) {
            recipe = await Recipe.findOne({ recipe_id: parseInt(req.params.id) })
                .select({
                    recipe_id: 1,
                    recipe_name: 1,
                    calories_per_serving: 1,
                    // 'totalNutrients.CHOCDF.quantity': 1,
                    // 'totalNutrients.FAT.quantity': 1,
                    // 'totalNutrients.PROCNT.quantity': 1,
                    'recipe.yield': 1,
                });
        }

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        res.json({
            recipe_id: recipe.recipe_id,
            recipe_name: recipe.recipe_name,
            calories: Number(recipe.calories_per_serving.toFixed(2)),
            // carbs: Number((recipe.recipe.totalNutrients?.CHOCDF?.quantity || 0).toFixed(2)),
            // fats: Number((recipe.totalNutrients?.FAT?.quantity || 0).toFixed(2)),
            // protein: Number((recipe.totalNutrients?.PROCNT?.quantity || 0).toFixed(2)),
            servingSize: recipe.recipe?.yield || 1
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new recipe
router.post('/', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        if (!req.body.ingredients || req.body.ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients cannot be empty' });
        }
        if (!req.body.instructions || req.body.instructions.length === 0) {
            return res.status(400).json({ message: 'Instructions cannot be empty' });
        }
        const recipe = new Recipe(req.body);
        const newRecipe = await recipe.save();
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ 
            message: err.message, 
            details: err.errors ? Object.values(err.errors).map(e => e.message) : []
        });
    }
});

// Update a recipe
router.patch('/:id', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        
        Object.assign(recipe, req.body);
        const updatedRecipe = await recipe.save();
        res.json(updatedRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a recipe
router.delete('/:id', async (req, res) => {
    try {
        const Recipe = getRecipeModel();
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json({ message: 'Recipe deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
