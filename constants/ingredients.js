// Common ingredients with their names and icons
// This file provides a list of commonly used ingredients with appropriate icons

const commonIngredients = [
  {
    id: 'chicken',
    name: 'Chicken',
    icon: 'nutrition',
    category: 'protein'
  },
  {
    id: 'beef',
    name: 'Beef',
    icon: 'restaurant',
    category: 'protein'
  },
  {
    id: 'fish',
    name: 'Fish',
    icon: 'fish',
    category: 'protein'
  },
  {
    id: 'tofu',
    name: 'Tofu',
    icon: 'cube',
    category: 'protein'
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: 'egg',
    category: 'protein'
  },
  {
    id: 'rice',
    name: 'Rice',
    icon: 'leaf',
    category: 'grain'
  },
  {
    id: 'pasta',
    name: 'Pasta',
    icon: 'restaurant',
    category: 'grain'
  },
  {
    id: 'potato',
    name: 'Potato',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'bread',
    name: 'Bread',
    icon: 'nutrition',
    category: 'grain'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'onion',
    name: 'Onion',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'garlic',
    name: 'Garlic',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'carrot',
    name: 'Carrot',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'bell_pepper',
    name: 'Bell Pepper',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'spinach',
    name: 'Spinach',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    icon: 'leaf',
    category: 'vegetable'
  },
  {
    id: 'olive_oil',
    name: 'Olive Oil',
    icon: 'water',
    category: 'oil'
  },
  {
    id: 'butter',
    name: 'Butter',
    icon: 'water',
    category: 'dairy'
  },
  {
    id: 'cheese',
    name: 'Cheese',
    icon: 'nutrition',
    category: 'dairy'
  },
  {
    id: 'milk',
    name: 'Milk',
    icon: 'water',
    category: 'dairy'
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    icon: 'nutrition',
    category: 'dairy'
  },
  {
    id: 'lemon',
    name: 'Lemon',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'lime',
    name: 'Lime',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'banana',
    name: 'Banana',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'berries',
    name: 'Berries',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'avocado',
    name: 'Avocado',
    icon: 'nutrition',
    category: 'fruit'
  },
  {
    id: 'nuts',
    name: 'Nuts',
    icon: 'nutrition',
    category: 'nuts'
  },
  {
    id: 'beans',
    name: 'Beans',
    icon: 'nutrition',
    category: 'legume'
  },
  {
    id: 'chickpeas',
    name: 'Chickpeas',
    icon: 'nutrition',
    category: 'legume'
  }
];

// Categories for organizing ingredients
const categories = [
  { id: 'protein', name: 'Proteins' },
  { id: 'vegetable', name: 'Vegetables' },
  { id: 'fruit', name: 'Fruits' },
  { id: 'grain', name: 'Grains & Starches' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'oil', name: 'Oils & Fats' },
  { id: 'legume', name: 'Legumes' },
  { id: 'nuts', name: 'Nuts & Seeds' },
  { id: 'other', name: 'Other' }
];

// Helper function to find an ingredient by ID
const findIngredientById = (id) => {
  return commonIngredients.find(ingredient => ingredient.id === id);
};

// Helper function to find ingredients by category
const getIngredientsByCategory = (categoryId) => {
  return commonIngredients.filter(ingredient => ingredient.category === categoryId);
};

// Helper function to search ingredients by name
const searchIngredients = (query) => {
  if (!query) return [];
  const lowerCaseQuery = query.toLowerCase();
  return commonIngredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(lowerCaseQuery) ||
    ingredient.id.toLowerCase().includes(lowerCaseQuery)
  );
};

export {
  commonIngredients,
  categories,
  findIngredientById,
  getIngredientsByCategory,
  searchIngredients
};
