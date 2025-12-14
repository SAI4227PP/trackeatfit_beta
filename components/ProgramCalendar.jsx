import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ProgramCalendar({ visible, onClose, schedule, startDate }) {
  const navigation = useNavigation();

  const getDayLabel = (dayIndex) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleExercisePress = (exercise) => {
    onClose(); // Close calendar modal first
    navigation.navigate('screens/Exercise', {
      exerciseId: exercise.exercise || exercise.exerciseId,
      exerciseName: exercise.name,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Program Calendar</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Calendar Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {schedule?.map((day, index) => (
            <View key={index} className="mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-sm text-gray-500">{getDayLabel(index)}</Text>
                    <Text className="text-lg font-bold text-gray-900">{day.title}</Text>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-600 font-medium">Day {index + 1}</Text>
                  </View>
                </View>

                {/* Exercises List */}
                <View className="mt-3 space-y-2">
                  {day.exercises?.map((exercise, exIndex) => (
                    <View key={exIndex} className="flex-row items-center bg-gray-50 p-3 rounded-xl">
                      <TouchableOpacity 
                        className="flex-1 flex-row items-center"
                        onPress={() => handleExercisePress(exercise)}
                      >
                        <View className="bg-blue-100 rounded-full p-2 mr-3">
                          <Ionicons name="barbell-outline" size={18} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">{exercise.exerciseName}</Text>
                          <Text className="text-gray-500 text-sm">
                            {exercise.sets} sets • {exercise.reps} reps
                          </Text>
                        </View>
                        <View className="bg-blue-50 rounded-full p-2">
                          <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Workout Stats */}
                <View className="mt-4 flex-row justify-between bg-gray-50 rounded-xl p-3">
                  <View className="items-center">
                    <Text className="text-gray-500 text-xs">Exercises</Text>
                    <Text className="text-gray-900 font-bold">{day.exercises?.length || 0}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-500 text-xs">Duration</Text>
                    <Text className="text-gray-900 font-bold">
                      {day.exercises?.reduce((total, ex) => total + (ex.duration || 0), 0) || 45} min
                    </Text>
                  </View>
                  <View className="items-center">
                    <View className="flex-row items-center">
                      {['beginner', 'intermediate', 'advanced'].map((level, i) => (
                        <View 
                          key={level}
                          className={`h-2 w-2 rounded-full mx-0.5 ${
                            (day.difficulty || 'beginner').toLowerCase() === level
                              ? 'bg-blue-600'
                              : 'bg-blue-200'
                          }`}
                        />
                      ))}
                    </View>
                    <Text className="text-gray-500 text-xs mt-1 capitalize">
                      {day.difficulty || 'Beginner'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
