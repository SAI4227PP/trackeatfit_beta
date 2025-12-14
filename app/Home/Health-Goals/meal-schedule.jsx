import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Animated as RNAnimated, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';


const API_URL = "https://trackeatfit.onrender.com";

const styles = {
  container: (isDarkMode) => ({
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
  }),
  header: (isDarkMode) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: isDarkMode ? 'rgba(31,41,55,0.9)' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6',
  }),
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },
  headerTitle: (isDarkMode) => ({
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: isDarkMode ? '#e5e7eb' : '#111827',
  }),
  flatListContent: {
    padding: 16,
  },
  card: (isDarkMode, isActive) => ({
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: isActive ? '#d1fae5' : isDarkMode ? '#1f2937' : '#f9fafb',
    borderWidth: isDarkMode && !isActive ? 1 : 0,
    borderColor: isDarkMode && !isActive ? '#374151' : undefined,
    elevation: isActive ? 8 : 0,
  }),
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: (isDarkMode) => ({
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#e5e7eb' : '#111827',
  }),
  cardType: (isDarkMode) => ({
    fontSize: 14,
    marginTop: 4,
    color: isDarkMode ? '#d1d5db' : '#4b5563',
  }),
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellBtn: {
    marginRight: 12,
  },
  dragBtn: (isActive) => ({
    padding: 8,
    borderRadius: 999,
    marginLeft: 4,
    backgroundColor: isActive ? '#d1fae5' : undefined,
  }),
  preferencesCard: (isDarkMode) => ({
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: isDarkMode ? 'rgba(31,41,55,0.8)' : '#fff',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? '#374151' : undefined,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  }),
  preferencesTitle: (isDarkMode) => ({
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: isDarkMode ? '#e5e7eb' : '#111827',
  }),
  preferencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferencesLabel: (isDarkMode) => ({
    fontWeight: '500',
    color: isDarkMode ? '#e5e7eb' : '#374151',
  }),
  saveBtn: {
    marginBottom: 24,
  },
  gradientBtn: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  gradientBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  addMealBtn: (isDarkMode) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(6,95,70,0.2)' : '#d1fae5',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? 'rgba(6,95,70,0.3)' : undefined,
    marginTop: 8,
  }),
  addMealText: (isDarkMode) => ({
    fontWeight: '500',
    marginLeft: 8,
    color: isDarkMode ? '#6ee7b7' : '#047857',
  }),
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.7)',
  },
  modalBox: (isDarkMode) => ({
    width: '92%',
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  }),
  modalHeader: (isDarkMode) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6',
    backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  }),
  modalTitle: (isDarkMode) => ({
    fontWeight: 'bold',
    fontSize: 20,
    color: isDarkMode ? '#fff' : '#111827',
  }),
  modalContent: {
    padding: 20,
  },
  modalLabel: (isDarkMode) => ({
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: isDarkMode ? '#6ee7b7' : '#047857',
  }),
  modalInput: (isDarkMode) => ({
    borderWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
    backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
    color: isDarkMode ? '#fff' : '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  }),
  modalTimeBtn: (isDarkMode) => ({
    borderWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
    backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  }),
  modalTimeText: (isDarkMode) => ({
    marginLeft: 8,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#111827',
  }),
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelBtn: (isDarkMode) => ({
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
  }),
  modalCancelText: (isDarkMode) => ({
    fontWeight: 'bold',
    fontSize: 16,
    color: isDarkMode ? '#6ee7b7' : '#047857',
  }),
  modalAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#047857',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  modalAddText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
};

const MealSchedule = () => {
  const { user, updateUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [infoVisible, setInfoVisible] = useState(false);
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [newMealType, setNewMealType] = useState('');
  const [newMealTime, setNewMealTime] = useState(new Date());
  const [showNewMealTimePicker, setShowNewMealTimePicker] = useState(false);
  const infoAnim = React.useRef(new RNAnimated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [schedule, setSchedule] = useState({
    meals: user?.mealSchedule?.meals || [
      { id: 1, type: 'Breakfast', time: new Date(new Date().setHours(8, 0)), enabled: true },
      { id: 2, type: 'Morning Snack', time: new Date(new Date().setHours(10, 30)), enabled: true },
      { id: 3, type: 'Lunch', time: new Date(new Date().setHours(13, 0)), enabled: true },
      { id: 4, type: 'Afternoon Snack', time: new Date(new Date().setHours(16, 0)), enabled: true },
      { id: 5, type: 'Dinner', time: new Date(new Date().setHours(19, 0)), enabled: true },
    ],
    preferences: user?.mealSchedule?.preferences || {
      reminders: true,
      reminderTime: 15,
      waterReminders: true,
      weekendSchedule: true,
    }
  });

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && selectedMealIndex !== null) {
      const updatedMeals = [...schedule.meals];
      updatedMeals[selectedMealIndex] = {
        ...updatedMeals[selectedMealIndex],
        time: selectedTime
      };
      setSchedule(prev => ({ ...prev, meals: updatedMeals }));
    }
  };

  const toggleMealEnabled = (index) => {
    const updatedMeals = [...schedule.meals];
    updatedMeals[index] = {
      ...updatedMeals[index],
      enabled: !updatedMeals[index].enabled
    };
    setSchedule(prev => ({ ...prev, meals: updatedMeals }));
  };

  const addNewMealSlot = () => {
    const newMeal = {
      id: schedule.meals.length + 1,
      type: 'Custom Meal',
      time: new Date(),
      enabled: true
    };
    setSchedule(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal]
    }));
  };

  const updatePreference = (key, value) => {
    setSchedule(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUserData = {
        ...user,
        mealSchedule: schedule,
        lastUpdated: new Date().toISOString(),
      };

      await updateUser(updatedUserData);
      Alert.alert('Success', 'Meal schedule updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update meal schedule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show dropdown info message
  const showInfo = () => {
    setInfoVisible(true);
    RNAnimated.timing(infoAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      RNAnimated.timing(infoAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setInfoVisible(false));
    }, 2000);
  };

  const MealSlot = ({ meal, index, drag, isActive }) => {
    if (!meal) return null; // Guard clause to prevent undefined meal errors

    // Log meal and index for debugging
    console.log('MealSlot:', { meal, index });

    // Animated style for drag feedback
    const animatedStyle = useAnimatedStyle(() => ({
      elevation: isActive ? 8 : 0,
      opacity: isActive ? 0.85 : 1,
      transform: [{ scale: isActive ? 1.03 : 1 }],
    }));

    // Show info alert when drag icon is tapped
    const handleDragIconPress = () => {
      showInfo();
    };

    return (
      <Animated.View style={[styles.card(isDarkMode, isActive), animatedStyle]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedMealIndex(index);
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.cardTime(isDarkMode)}>
                {meal.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.cardType(isDarkMode)}>{meal.type}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              onPress={() => toggleMealEnabled(index)}
              style={styles.bellBtn}
            >
              <MaterialCommunityIcons 
                name={meal.enabled ? "bell" : "bell-off"} 
                size={24} 
                color={meal.enabled ? "#047857" : "#9CA3AF"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={showInfo}
              onLongPress={drag}
              disabled={isActive}
              style={styles.dragBtn(isActive)}
            >
              <MaterialCommunityIcons name="drag" size={28} color={isActive ? "#047857" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // FlatList footer for preferences and save button
  const renderFooter = () => (
    <View>
      {/* Preferences */}
      <View style={styles.preferencesCard(isDarkMode)}>
        <Text style={styles.preferencesTitle(isDarkMode)}>Reminder Preferences</Text>
        
        <View style={styles.preferencesRow}>
          <Text style={styles.preferencesLabel(isDarkMode)}>Meal Reminders</Text>
          <Switch
            value={schedule.preferences.reminders}
            onValueChange={(value) => updatePreference('reminders', value)}
            trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
            thumbColor={schedule.preferences.reminders ? '#047857' : '#9CA3AF'}
          />
        </View>

        <View style={styles.preferencesRow}>
          <Text style={styles.preferencesLabel(isDarkMode)}>Water Intake Reminders</Text>
          <Switch
            value={schedule.preferences.waterReminders}
            onValueChange={(value) => updatePreference('waterReminders', value)}
            trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
            thumbColor={schedule.preferences.waterReminders ? '#047857' : '#9CA3AF'}
          />
        </View>

        <View style={styles.preferencesRow}>
          <Text style={styles.preferencesLabel(isDarkMode)}>Weekend Schedule</Text>
          <Switch
            value={schedule.preferences.weekendSchedule}
            onValueChange={(value) => updatePreference('weekendSchedule', value)}
            trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
            thumbColor={schedule.preferences.weekendSchedule ? '#047857' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={loading}
        style={styles.saveBtn}
      >
        <LinearGradient
          colors={['#15803d', '#166534']}
          style={styles.gradientBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.gradientBtnText}>
            {loading ? 'Saving...' : 'Save Schedule'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // FlatList header for meal slots
  const renderHeader = () => (
    <View style={styles.preferencesCard(isDarkMode)}>
      <Text style={styles.preferencesTitle(isDarkMode)}>Daily Meals</Text>
      <DraggableFlatList
        data={schedule.meals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, drag, isActive }) => {
          const index = schedule.meals.findIndex(m => m.id === item.id);
          return <MealSlot meal={item} index={index} drag={drag} isActive={isActive} />;
        }}
        onDragEnd={({ data }) => setSchedule(prev => ({ ...prev, meals: data }))}
        activationDistance={12} // smoother drag start
        containerStyle={{ paddingBottom: 8 }}
        animationConfig={{ duration: 180 }} // smooth transition
        dragItemOverflow={false}
      />
      <TouchableOpacity onPress={() => setAddMealModalVisible(true)} style={styles.addMealBtn(isDarkMode)}>
        <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#047857" />
        <Text style={styles.addMealText(isDarkMode)}>Add Meal</Text>
      </TouchableOpacity>
    </View>
  );

  const handleAddMealSubmit = () => {
    if (!newMealType.trim()) {
      Alert.alert('Error', 'Please enter a meal type');
      return;
    }
    const newMeal = {
      id: schedule.meals.length + 1,
      type: newMealType,
      time: newMealTime,
      enabled: true
    };
    setSchedule(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal]
    }));
    setAddMealModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container(isDarkMode)}>
        {/* Dropdown info message */}
        {infoVisible && (
          <RNAnimated.View
            style={{
              position: 'absolute',
              top: insets.top + 12, // move below status bar
              left: 0,
              right: 0,
              zIndex: 100,
              alignItems: 'center',
              opacity: infoAnim,
              transform: [
                {
                  translateY: infoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  }),
                },
              ],
            }}
            pointerEvents="none"
          >
            <View
              style={{
                backgroundColor: '#047857',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 24,
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Hold to drag
              </Text>
            </View>
          </RNAnimated.View>
        )}
        <View style={styles.header(isDarkMode)}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.headerBackBtn}
            >
              <Icon name="chevron-back" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
            <Text style={styles.headerTitle(isDarkMode)}>
              Meal Schedule
            </Text>
          </View>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Meal Modal */}
        <Modal
          visible={addMealModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setAddMealModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox(isDarkMode)}>
              {/* Title Bar */}
              <View style={styles.modalHeader(isDarkMode)}>
                <Text style={styles.modalTitle(isDarkMode)}>Add Meal</Text>
                <TouchableOpacity onPress={() => setAddMealModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#fff" : "#222"} />
                </TouchableOpacity>
              </View>
              {/* Content */}
              <View style={styles.modalContent}>
                <Text style={styles.modalLabel(isDarkMode)}>Meal Type</Text>
                <TextInput
                  placeholder="e.g. Snack"
                  value={newMealType}
                  onChangeText={setNewMealType}
                  style={styles.modalInput(isDarkMode)}
                  placeholderTextColor={isDarkMode ? '#6EE7B7' : '#888'}
                />
                <Text style={styles.modalLabel(isDarkMode)}>Meal Time</Text>
                <TouchableOpacity
                  onPress={() => setShowNewMealTimePicker(true)}
                  style={styles.modalTimeBtn(isDarkMode)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color={isDarkMode ? "#A7F3D0" : "#047857"} />
                  <Text style={styles.modalTimeText(isDarkMode)}>
                    {newMealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showNewMealTimePicker && (
                  <DateTimePicker
                    value={newMealTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setShowNewMealTimePicker(false);
                      if (selectedTime) setNewMealTime(selectedTime);
                    }}
                  />
                )}
                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setAddMealModalVisible(false)}
                    style={styles.modalCancelBtn(isDarkMode)}
                  >
                    <Text style={styles.modalCancelText(isDarkMode)}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddMealSubmit}
                    style={styles.modalAddBtn}
                  >
                    <Text style={styles.modalAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {showTimePicker && (
          <DateTimePicker
            value={schedule.meals[selectedMealIndex].time}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default MealSchedule;
