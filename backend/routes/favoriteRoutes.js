const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');

// Add to favorites
router.post('/add', async (req, res) => {
  try {
    const { userId, itemType, itemId, name, image, nutrition } = req.body;

    // Create new favorite
    const favorite = new Favorite({
      userId,
      itemType,
      itemId,
      name,
      image,
      nutrition
    });

    await favorite.save();
    res.status(201).json({ message: 'Added to favorites successfully', favorite });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({ message: 'Item already in favorites' });
    } else {
      res.status(500).json({ message: 'Error adding to favorites', error: error.message });
    }
  }
});

// Get user's favorites
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // Optional filter by type (food/recipe)
    
    let query = { userId };
    if (type) {
      query.itemType = type;
    }

    const favorites = await Favorite.find(query).sort({ addedAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// Remove from favorites
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Favorite.findByIdAndDelete(id);
    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error: error.message });
  }
});

// Check if item is favorited
router.get('/check/:userId/:itemType/:itemId', async (req, res) => {
  try {
    const { userId, itemType, itemId } = req.params;
    console.log('Checking favorite status for:', { userId, itemType, itemId });
    
    const favorite = await Favorite.findOne({ 
      userId, 
      itemType, 
      itemId: itemId.toString() 
    });
    
    console.log('Found favorite:', favorite);
    res.json({ 
      isFavorited: !!favorite,
      favorite: favorite // Include the favorite object in response
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ 
      message: 'Error checking favorite status', 
      error: error.message 
    });
  }
});

module.exports = router;