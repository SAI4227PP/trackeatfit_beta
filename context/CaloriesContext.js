import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const CaloriesContext = createContext();
export const useCaloriesContext = () => useContext(CaloriesContext);

const STORAGE_KEY = 'calories_data';
const LAST_RESET_KEY = 'last_reset_date';

export const CaloriesProvider = ({ children }) => {
  const [goalCalories, setGoalCalories] = useState(2400);
  const [foodCalories, setFoodCalories] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [RemainingCalories, setRemainingCalories] = useState(0);
  
  const [carbs, setCarbs] = useState(0);
  const [fats, setfats] = useState(0);
  const [protein, setprotein] = useState(0);
  const [waterIntake, setWaterIntake] = useState(2.4);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    loadStoredData();
  }, []);

  // Update any state change to storage immediately
  useEffect(() => {
    saveDataToStorage();
  }, [goalCalories, foodCalories, exerciseCalories, RemainingCalories, carbs, fats, protein, waterIntake, activeDays]);

  const checkDateAndReset = async () => {
    try {
      const lastResetStr = await AsyncStorage.getItem(LAST_RESET_KEY);
      const now = new Date();
      const todayDate = format(now, 'yyyy-MM-dd');

      if (!lastResetStr) {
        // First time app runs
        await AsyncStorage.setItem(LAST_RESET_KEY, now.toISOString());
        await saveDataToStorage(); // Save initial data
        return;
      }

      const lastReset = new Date(lastResetStr);
      const lastResetDate = format(lastReset, 'yyyy-MM-dd');

      if (lastResetDate < todayDate) {
        // New day, reset daily values but keep goal
        const currentGoal = goalCalories;
        await handleReset();
        setGoalCalories(currentGoal); // Restore goal after reset
      }
    } catch (error) {
      console.error('Error checking date:', error);
    }
  };

  const handleReset = async () => {
    console.log('Date changed, clearing previous day data...');
    
    setFoodCalories(0);
    setExerciseCalories(0);
    setRemainingCalories(goalCalories);
    setCarbs(0);
    setfats(0);
    setprotein(0);

    const now = new Date();
    await AsyncStorage.setItem(LAST_RESET_KEY, now.toISOString());
    await saveDataToStorage();
  };

  const loadStoredData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setGoalCalories(parsedData.goalCalories ?? 2400);
        setFoodCalories(parsedData.foodCalories ?? 0);
        setExerciseCalories(parsedData.exerciseCalories ?? 0);
        setRemainingCalories(parsedData.RemainingCalories ?? parsedData.goalCalories);
        setCarbs(parsedData.carbs ?? 0);
        setfats(parsedData.fats ?? 0);
        setprotein(parsedData.protein ?? 0);
        setWaterIntake(parsedData.waterIntake ?? 0);
        setActiveDays(parsedData.activeDays ?? 0);
      }
      await checkDateAndReset();
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const saveDataToStorage = async () => {
    try {
      const dataToStore = {
        goalCalories,
        foodCalories,
        exerciseCalories,
        RemainingCalories,
        carbs,
        fats,
        protein,
        waterIntake,
        activeDays,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const clearCaloriesData = async () => {
    try {
      console.log('Clearing calories data...');
      // Reset all state values to defaults
      setGoalCalories(2400);
      setFoodCalories(0);
      setExerciseCalories(0);
      setRemainingCalories(0);
      setCarbs(0);
      setfats(0);
      setprotein(0);
      setWaterIntake(2.4);
      setActiveDays(0);
      
      // Remove data from AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_RESET_KEY);
      console.log('Calories data cleared successfully');
    } catch (error) {
      console.error('Error clearing calories data:', error);
    }
  };

  return (
    <CaloriesContext.Provider 
      value={{
        goalCalories,
        setGoalCalories,
        foodCalories,
        setFoodCalories,
        exerciseCalories,
        setExerciseCalories,
        RemainingCalories,
        setRemainingCalories,
        carbs,
        setCarbs,
        fats,
        setfats,
        protein,
        setprotein,
        waterIntake,
        setWaterIntake,
        activeDays,
        setActiveDays,
        clearCaloriesData, // Add this to the context value
      }}
    >
      {children}
    </CaloriesContext.Provider>
  );
};