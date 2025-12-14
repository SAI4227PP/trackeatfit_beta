import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { categories, commonIngredients, searchIngredients } from '../constants/ingredients';
import { useTheme } from '../context/ThemeContext';

const IngredientInput = ({ 
  selectedIngredients, 
  onAddIngredient, 
  onRemoveIngredient 
}) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customIngredient, setCustomIngredient] = useState('');  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [tempSelectedIngredients, setTempSelectedIngredients] = useState([]);
  const searchInputRef = useRef(null);

  // Filter ingredients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIngredients([]);
    } else {
      setFilteredIngredients(searchIngredients(searchQuery));
    }
  }, [searchQuery]);

  // Get ingredients by selected category
  const getCategoryIngredients = () => {
    if (!selectedCategory) return [];
    return commonIngredients.filter(ingredient => ingredient.category === selectedCategory);
  };
  // Handle adding a custom ingredient
  const handleAddCustomIngredient = () => {
    if (customIngredient.trim() !== '') {
      const customId = customIngredient.trim().toLowerCase();
      
      if (multiSelectMode) {
        // In multi-select mode, add to temp selections
        if (!tempSelectedIngredients.includes(customId)) {
          setTempSelectedIngredients([...tempSelectedIngredients, customId]);
        }
        setCustomIngredient('');
      } else {
        // Single select mode
        onAddIngredient(customId);
        setCustomIngredient('');
        setIsModalVisible(false);
      }
    }
  };  // Initialize temp selection when modal opens
  useEffect(() => {
    if (isModalVisible) {
      // Ensure selectedIngredients is an array before spreading
      // Create a deep copy to avoid reference issues
      setTempSelectedIngredients(
        Array.isArray(selectedIngredients) ? [...selectedIngredients] : []
      );
      console.log('Modal opened, initialized temp ingredients:', 
        Array.isArray(selectedIngredients) ? [...selectedIngredients] : []
      );
    }
  }, [isModalVisible, selectedIngredients]);

  // Handle selecting an ingredient from the list
  const handleSelectIngredient = (ingredient) => {
    if (multiSelectMode) {
      // In multi-select mode, just add/remove from temp selection
      if (tempSelectedIngredients.includes(ingredient.id)) {
        setTempSelectedIngredients(tempSelectedIngredients.filter(id => id !== ingredient.id));
      } else {
        setTempSelectedIngredients([...tempSelectedIngredients, ingredient.id]);
      }
    } else {
      // Single select mode (original behavior)
      onAddIngredient(ingredient.id);
      setSearchQuery('');
      setIsModalVisible(false);
    }
  };  // Save multi-selected ingredients
  const handleSaveSelection = () => {
    if (!Array.isArray(selectedIngredients) || !Array.isArray(tempSelectedIngredients)) {
      console.log('Invalid array format:', { selectedIngredients, tempSelectedIngredients });
      setIsModalVisible(false);
      return;
    }
    
    console.log('Before saving - Current selected:', selectedIngredients);
    console.log('Before saving - Temp selected:', tempSelectedIngredients);
    
    // First, remove any ingredients that were unselected
    const toRemove = selectedIngredients.filter(id => !tempSelectedIngredients.includes(id));
    console.log('Ingredients to remove:', toRemove);
    
    toRemove.forEach(id => {
      onRemoveIngredient(id);
    });
    
    // Then, add any newly selected ingredients
    const toAdd = tempSelectedIngredients.filter(id => !selectedIngredients.includes(id));
    console.log('Ingredients to add:', toAdd);
      // Instead of multiple individual calls, pass the entire final array at once
    // First, make a single call with all selections for better state handling
    if (toAdd.length > 0 || toRemove.length > 0) {
      // Use the parent's callback to update all the ingredients at once
      const finalIngredients = tempSelectedIngredients;
      onAddIngredient({ type: 'UPDATE_ALL', ingredients: finalIngredients });
    }
    
    // All selections have been processed, now close the modal
    setSearchQuery('');
    setIsModalVisible(false);
  };// Check if ingredient is already selected
  const isIngredientSelected = (ingredientId) => {
    if (multiSelectMode) {
      return Array.isArray(tempSelectedIngredients) && tempSelectedIngredients.includes(ingredientId);
    } else {
      return Array.isArray(selectedIngredients) && selectedIngredients.includes(ingredientId);
    }
  };

  // Render ingredients by category
  const renderCategoryIngredients = () => {
    const categoryIngredients = getCategoryIngredients();
    return (
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
          {categories.find(c => c.id === selectedCategory)?.name || 'Ingredients'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {categoryIngredients.map(ingredient => (
            <TouchableOpacity
              key={ingredient.id}
              style={{
                marginRight: 8,
                marginBottom: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isIngredientSelected(ingredient.id)
                  ? '#556B2F'
                  : isDarkMode ? '#374151' : '#f3f4f6',
              }}
              onPress={() => handleSelectIngredient(ingredient)}
            >
              <Ionicons 
                name={ingredient.icon} 
                size={14} 
                color={isIngredientSelected(ingredient.id) ? 'white' : '#556B2F'} 
                style={{ marginRight: 4 }} 
              />
              <Text style={{
                color: isIngredientSelected(ingredient.id) ? '#fff' : (isDarkMode ? '#e5e7eb' : '#444'),
                fontWeight: '500',
              }}>
                {ingredient.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View>
      {/* Selected Ingredients Display */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
        >
          {selectedIngredients.length > 0 ? (
            selectedIngredients.map((ingredientId, index) => {
              const ingredient = commonIngredients.find(i => i.id === ingredientId) || { name: ingredientId, icon: 'nutrition' };
              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: '#556B2F',
                    marginRight: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    elevation: 1,
                  }}
                  onPress={() => onRemoveIngredient(ingredientId)}
                >
                  <Ionicons name={ingredient.icon || 'nutrition'} size={14} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontWeight: '500', textTransform: 'capitalize', marginRight: 8 }}>
                    {ingredient.name || ingredientId}
                  </Text>
                  <Ionicons name="close-circle" size={16} color="white" />
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              No ingredients selected
            </Text>
          )}
        </ScrollView>
        {/* Add Ingredient Button */}
      </View>            
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          borderRadius: 12,
          backgroundColor: isDarkMode ? '#2d3748' : '#fff',
          borderWidth: 1,
          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
          elevation: 1,
        }}
        onPress={() => {
          setMultiSelectMode(false); // Reset to single select mode by default when opening
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" size={18} color="#556B2F" style={{ marginRight: 8 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Text style={{ fontWeight: '500', color: isDarkMode ? '#e5e7eb' : '#444' }}>
            Add Ingredients
          </Text>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280', marginLeft: 8 }}>
            (toggle multi-select inside)
          </Text>
        </View>
      </TouchableOpacity>

      {/* Ingredient Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View 
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              backgroundColor: isDarkMode ? '#2d3748' : '#fff',
              elevation: 5,
              maxHeight: '80%',
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#222' }}>
                Add Ingredients
              </Text>
              {/* Multi-select toggle */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{
                    marginRight: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: multiSelectMode ? '#556B2F' : (isDarkMode ? '#374151' : '#e5e7eb'),
                  }}
                  onPress={() => setMultiSelectMode(!multiSelectMode)}
                >                  
                  <Ionicons 
                    name={multiSelectMode ? "checkbox" : "square-outline"} 
                    size={16} 
                    color={multiSelectMode ? "white" : isDarkMode ? '#999' : '#666'} 
                    style={{marginRight: 4}} 
                  />                  
                  <Text style={{
                    color: multiSelectMode ? '#fff' : (isDarkMode ? '#d1d5db' : '#444'),
                    fontSize: 12,
                    fontWeight: '500',
                  }}>
                    Multi-select
                  </Text>
                  {multiSelectMode && Array.isArray(tempSelectedIngredients) && tempSelectedIngredients.length > 0 && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 999, width: 20, height: 20, marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#556B2F', fontSize: 12, fontWeight: 'bold' }}>
                        {tempSelectedIngredients.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>                
                {multiSelectMode ? (
                  <TouchableOpacity 
                    style={{ backgroundColor: '#556B2F', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8 }}
                    onPress={handleSaveSelection}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={{ padding: 8 }}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={isDarkMode ? 'white' : 'black'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Input */}
            <View 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              }}
            >
              <Icon name="search" size={18} color={isDarkMode ? '#999' : '#666'} />
              <TextInput
                ref={searchInputRef}
                style={{ flex: 1, marginLeft: 8, color: isDarkMode ? '#fff' : '#222' }}
                placeholder="Search ingredients..."
                placeholderTextColor={isDarkMode ? '#999' : '#666'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="x" size={18} color={isDarkMode ? '#999' : '#666'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {searchQuery.trim() !== '' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: '600', marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
                  Search Results
                </Text>
                {filteredIngredients.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {filteredIngredients.map(ingredient => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={{
                          marginRight: 8,
                          marginBottom: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isIngredientSelected(ingredient.id)
                            ? '#556B2F'
                            : isDarkMode ? '#374151' : '#e5e7eb',
                        }}
                        onPress={() => handleSelectIngredient(ingredient)}
                      >
                        <Ionicons 
                          name={ingredient.icon} 
                          size={14} 
                          color={isIngredientSelected(ingredient.id) ? 'white' : '#556B2F'} 
                          style={{ marginRight: 4 }} 
                        />
                        <Text style={{
                          color: isIngredientSelected(ingredient.id) ? '#fff' : (isDarkMode ? '#e5e7eb' : '#444'),
                          fontWeight: '500',
                        }}>
                          {ingredient.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      No ingredients found. Add custom ingredient:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <TextInput
                        style={{
                          flex: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          marginRight: 8,
                          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                          color: isDarkMode ? '#fff' : '#222',
                        }}
                        value={customIngredient}
                        onChangeText={setCustomIngredient}
                        placeholder="Enter custom ingredient"
                        placeholderTextColor={isDarkMode ? '#999' : '#666'}
                      />
                      <TouchableOpacity
                        style={{ backgroundColor: '#556B2F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                        onPress={handleAddCustomIngredient}
                      >
                        <Text style={{ color: '#fff', fontWeight: '500' }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Categories */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {searchQuery.trim() === '' && (
                <>
                  <Text style={{ fontWeight: '600', marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
                    Categories
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                    {categories.map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={{
                          marginRight: 8,
                          marginBottom: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: selectedCategory === category.id
                            ? '#556B2F'
                            : isDarkMode ? '#374151' : '#e5e7eb',
                        }}
                        onPress={() => setSelectedCategory(category.id)}
                      >
                        <Text style={{
                          color: selectedCategory === category.id ? '#fff' : (isDarkMode ? '#e5e7eb' : '#444'),
                          fontWeight: '500',
                        }}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Custom Ingredient Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
                      Custom Ingredient
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={{
                          flex: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          marginRight: 8,
                          backgroundColor: isDarkMode ? '#f3f4f6' : '#e5e7eb',
                          color: isDarkMode ? '#222' : '#444',
                        }}
                        value={customIngredient}
                        onChangeText={setCustomIngredient}
                        placeholder="Enter ingredient name"
                        placeholderTextColor={isDarkMode ? '#999' : '#666'}
                      />
                      <TouchableOpacity
                        style={{ backgroundColor: '#556B2F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, opacity: customIngredient.trim() === '' ? 0.5 : 1 }}
                        onPress={handleAddCustomIngredient}
                        disabled={customIngredient.trim() === ''}
                      >
                        <Text style={{ color: '#fff', fontWeight: '500' }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Ingredients by Category */}
                  {selectedCategory && renderCategoryIngredients()}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default IngredientInput;
