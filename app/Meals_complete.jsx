import React, { useRef, useState } from 'react';
import { Animated, Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const StatusCard = ({ totalCalories, targetCalories }) => {
  const { isDarkMode } = useTheme();
  const status = totalCalories > targetCalories ? 'Optimal' : 'Below Target';
  const percentage = Math.round((totalCalories / targetCalories) * 100);

  const cardStyle = {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: status === 'Optimal' 
      ? isDarkMode ? '#064e3b' : '#dcfce7'
      : isDarkMode ? '#78350f' : '#fef3c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginVertical: 16,
  };

  const headerTextStyle = {
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
    fontSize: 20,
    fontWeight: 'bold',
  };

  const statusBadgeStyle = {
    backgroundColor: status === 'Optimal' 
      ? isDarkMode ? '#065f46' : '#bbf7d0'
      : isDarkMode ? '#92400e' : '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  };

  const statusTextStyle = {
    color: status === 'Optimal' 
      ? isDarkMode ? '#86efac' : '#15803d'
      : isDarkMode ? '#fcd34d' : '#b45309',
    fontWeight: '600',
  };

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={headerTextStyle}>
          Nutritional Analysis
        </Text>
        <View style={statusBadgeStyle}>
          <Text style={statusTextStyle}>
            {status}
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', fontWeight: '500' }}>Current Intake</Text>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#111827', fontWeight: 'bold', fontSize: 18 }}>
            {totalCalories.toLocaleString()} kcal
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', fontWeight: '500' }}>Daily Target</Text>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#111827', fontWeight: 'bold', fontSize: 18 }}>
            {targetCalories.toLocaleString()} kcal
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 100, marginTop: 12 }}>
          <View 
            style={{ 
              height: 8, 
              borderRadius: 100, 
              backgroundColor: percentage >= 100 ? '#34d399' : '#fbbf24',
              width: `${Math.min(percentage, 100)}%` 
            }} 
          />
        </View>
        <Text style={{ color: isDarkMode ? '#f3f4f6' : '#374151', fontSize: 12, marginTop: 4, textAlign: 'right' }}>
          {percentage}% of daily target
        </Text>
      </View>

      <View style={{ backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)', borderRadius: 12, padding: 12 }}>
        <Text style={{ color: status === 'Optimal' ? (isDarkMode ? '#86efac' : '#15803d') : (isDarkMode ? '#fcd34d' : '#b45309'), fontWeight: '500', marginBottom: 8 }}>
          Professional Assessment:
        </Text>
        {status === 'Optimal' ? (
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', lineHeight: 18 }}>
            Your current caloric intake aligns well with your nutritional goals. 
            Maintain this balanced approach for optimal health outcomes.
          </Text>
        ) : (
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', lineHeight: 18 }}>
            Current intake is below recommended levels. Consider increasing 
            your caloric intake through nutrient-dense foods to meet your daily requirements.
          </Text>
        )}
      </View>
    </View>
  );
};

const BulletPoint = ({ text }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ color: isDarkMode ? '#e5e7eb' : '#4b5563', marginRight: 8 }}>•</Text>
      <Text style={{ color: isDarkMode ? '#e5e7eb' : '#4b5563', flex: 1, lineHeight: 18 }}>{text}</Text>
    </View>
  );
};

const InfoSection = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderRadius: 12, marginHorizontal: 20, marginVertical: 8, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
      <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: '600', fontSize: 18, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );
};

const TabButton = ({ active, title, onPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 12, 
        backgroundColor: active ? (isDarkMode ? '#1e3a8a' : '#eff6ff') : 'transparent' 
      }}
    >
      <Text style={{ color: active ? (isDarkMode ? '#60A5FA' : '#1D4ED8') : (isDarkMode ? '#9ca3af' : '#374151'), fontWeight: '500' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const HelpModal = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef(null);
  const { isDarkMode } = useTheme();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={{ marginBottom: 16 }}>
            <View style={{ backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="analytics" size={20} color={isDarkMode ? "#60A5FA" : "#1D4ED8"} />
                <Text style={{ color: isDarkMode ? '#60A5FA' : '#1D4ED8', fontWeight: '600', marginLeft: 8 }}>
                  Daily Summary Overview
                </Text>
              </View>
              <Text style={{ color: isDarkMode ? '#93c5fd' : '#1e40af', fontSize: 14, lineHeight: 20 }}>
                Track your nutritional progress and maintain a healthy balance with our comprehensive daily analysis.
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="check-circle" size={18} color={isDarkMode ? "#34D399" : "#059669"} />
                <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', marginLeft: 8, flex: 1 }}>
                  Real-time calorie tracking and analysis
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="check-circle" size={18} color={isDarkMode ? "#34D399" : "#059669"} />
                <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', marginLeft: 8, flex: 1 }}>
                  Personalized nutritional recommendations
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="check-circle" size={18} color={isDarkMode ? "#34D399" : "#059669"} />
                <Text style={{ color: isDarkMode ? '#d1d5db' : '#374151', marginLeft: 8, flex: 1 }}>
                  Evidence-based health guidelines
                </Text>
              </View>
            </View>
          </View>
        );

      case 'targets':
        return (
          <View style={{ marginBottom: 16 }}>
            <View style={{ backgroundColor: isDarkMode ? '#374151' : '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: '600', marginBottom: 8 }}>
                Your Personalized Targets
              </Text>
              <BulletPoint text="Based on your age, gender, and activity level" />
              <BulletPoint text="Adjusted for your specific health goals" />
              <BulletPoint text="Regular updates based on your progress" />
            </View>
            
            <View style={{ borderLeftWidth: 4, borderColor: '#3b82f6', paddingLeft: 12 }}>
              <Text style={{ color: isDarkMode ? '#9ca3af' : '#374151', fontSize: 12, fontStyle: 'italic' }}>
                Targets are calculated using validated medical formulas and updated guidelines from health authorities.
              </Text>
            </View>
          </View>
        );

      case 'help':
        return (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#374151' : '#eff6ff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="support-agent" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: '600' }}>Contact Support</Text>
                <Text style={{ color: isDarkMode ? '#9ca3af' : '#374151', fontSize: 12 }}>Get help from our nutrition experts</Text>
              </View>
              <Icon name="chevron-right" size={20} color={isDarkMode ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>

            <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#374151' : '#eff6ff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="help" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: '600' }}>FAQ</Text>
                <Text style={{ color: isDarkMode ? '#9ca3af' : '#374151', fontSize: 12 }}>Browse common questions</Text>
              </View>
              <Icon name="chevron-right" size={20} color={isDarkMode ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={{ 
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                borderRadius: 12, 
                width: '90%', 
                maxWidth: 600, 
                opacity: fadeAnim 
              }}
            >
              <View style={{ padding: 16, borderBottomWidth: 1, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                    Help Center
                  </Text>
                  <TouchableOpacity 
                    onPress={onClose}
                    style={{ padding: 8, marginRight: -8 }}
                  >
                    <Icon name="close" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ flexDirection: 'row', marginTop: 16 }}
                >
                  <TabButton 
                    title="Overview" 
                    active={activeTab === 'overview'} 
                    onPress={() => setActiveTab('overview')}
                  />
                  <TabButton 
                    title="Targets" 
                    active={activeTab === 'targets'} 
                    onPress={() => setActiveTab('targets')}
                  />
                  <TabButton 
                    title="Get Help" 
                    active={activeTab === 'help'} 
                    onPress={() => setActiveTab('help')}
                  />
                </ScrollView>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={{ padding: 16, maxHeight: 400 }}
              >
                {renderContent()}
              </ScrollView>

              <View style={{ padding: 16, borderTopWidth: 1, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={{ backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '600' }}>
                    Close Guide
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const Header = ({ navigation, title }) => {
  const [helpVisible, setHelpVisible] = useState(false);
  const { isDarkMode } = useTheme();

  return (
    <>
      <View style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#f8fafc', '#f1f5f9']}
          style={{ paddingVertical: 16, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ padding: 8, backgroundColor: '#ffffff', borderRadius: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginRight: 16 }}
              >
                <Icon name="arrow-back" size={22} color="#334155" />
              </TouchableOpacity>
              <View>
                <Text style={{ color: isDarkMode ? '#ffffff' : '#111827', fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
                  Daily Overview
                </Text>
                <Text style={{ color: isDarkMode ? '#d1d5db' : '#111827', fontWeight: 'bold', fontSize: 20 }}>
                  {title}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={{ padding: 8, backgroundColor: '#ffffff', borderRadius: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
              onPress={() => setHelpVisible(true)}
            >
              <Icon name="help-outline" size={22} color="#334155" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
      <HelpModal 
        visible={helpVisible} 
        onClose={() => setHelpVisible(false)} 
      />
    </>
  );
};

const Meals_complete = () => {
  const { isDarkMode } = useTheme();
  const route = useRoute();
  const { totalCalories, userCalories } = route.params || {};
  const navigation = useNavigation();
  const { user } = useGlobalContext();

  const containerStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
  };

  return (
    <SafeAreaView style={containerStyle}>
      <Header navigation={navigation} title="Nutrition Summary" />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <StatusCard totalCalories={totalCalories} targetCalories={2400} />

        <InfoSection title="Personalized Target">
          <View style={{ backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: isDarkMode ? '#60A5FA' : '#1D4ED8', fontWeight: '500', fontSize: 16 }}>
              Your Daily Goal: {userCalories} calories
            </Text>
          </View>
        </InfoSection>

        <InfoSection title="Dietary Guidelines">
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#111827', fontWeight: '500', marginBottom: 8 }}>
            Recommended Daily Intake:
          </Text>
          <BulletPoint text="Women: 1,000 - 1,200 calories" />
          <BulletPoint text="Men: 1,200 - 1,500 calories" />
          <Text style={{ color: isDarkMode ? '#9ca3af' : '#374151', fontSize: 12, marginTop: 4 }}>
            Source: National Institutes of Health
          </Text>
        </InfoSection>

        <InfoSection title="Nutritional Recommendations">
          <BulletPoint text="Prioritize whole, nutrient-dense foods" />
          <BulletPoint text="Monitor intake using the tracking feature" />
          <BulletPoint text="Incorporate balanced snacks between meals" />
          <BulletPoint text="Maintain proper hydration levels" />
        </InfoSection>

        <InfoSection title="Health Advisory">
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#111827', fontWeight: '500', marginBottom: 8 }}>
            Essential for Optimal Health:
          </Text>
          <BulletPoint text="Consistent nutrient absorption" />
          <BulletPoint text="Long-term weight management" />
          <BulletPoint text="Metabolic function maintenance" />
          <View style={{ backgroundColor: isDarkMode ? '#374151' : '#fef3c7', padding: 16, borderRadius: 12, marginTop: 8 }}>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontSize: 12, fontStyle: 'italic', fontWeight: '500' }}>
              Note: Consistently low caloric intake may impact your health goals and overall wellbeing.
            </Text>
          </View>
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Meals_complete;

