import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExerciseGuide() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff', paddingHorizontal: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 16, marginLeft: 4 }}>
          <Ionicons name="chevron-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Exercise Guide</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>
          Welcome to the TrackEatFit Exercise Guide. This resource provides evidence-based recommendations, practical tips, and answers to frequently asked questions to help you achieve your fitness goals safely and effectively.
        </Text>

  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Why Exercise Matters</Text>
  <Text style={{ fontSize: 16, marginBottom: 16 }}>
          Regular physical activity is essential for maintaining optimal health. It reduces the risk of chronic diseases, improves mental well-being, supports weight management, and enhances quality of life. The World Health Organization and leading health authorities recommend a balanced exercise routine for all adults.
        </Text>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Core Components of a Balanced Exercise Program</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 }}>1. Cardiovascular (Aerobic) Training</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Examples:</Text> Brisk walking, running, cycling, swimming, rowing, dancing.{"\n"}
          <Text style={{ fontWeight: '600' }}>Benefits:</Text> Enhances heart and lung function, lowers blood pressure, improves endurance, and supports fat loss.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 }}>2. Resistance (Strength) Training</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Examples:</Text> Free weights, resistance bands, weight machines, bodyweight exercises (push-ups, squats, lunges).{"\n"}
          <Text style={{ fontWeight: '600' }}>Benefits:</Text> Builds and maintains muscle mass, strengthens bones, boosts metabolism, and improves functional capacity.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 }}>3. Flexibility & Mobility</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Examples:</Text> Static stretching, dynamic stretching, yoga, Pilates.{"\n"}
          <Text style={{ fontWeight: '600' }}>Benefits:</Text> Increases range of motion, reduces injury risk, and relieves muscle tension.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 }}>4. Balance & Coordination</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Examples:</Text> Tai chi, single-leg stands, balance boards, agility drills.{"\n"}
          <Text style={{ fontWeight: '600' }}>Benefits:</Text> Prevents falls, improves athletic performance, and strengthens the core.
        </Text>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Professional Exercise Recommendations</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Adults (18-64 years):</Text>
          {"\n"}• At least 150 minutes of moderate-intensity aerobic activity per week, or 75 minutes of vigorous-intensity activity.
          {"\n"}• Muscle-strengthening activities involving major muscle groups on 2 or more days per week.
          {"\n"}• Include flexibility and balance exercises at least 2-3 times per week.
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Older Adults (65+ years):</Text>
          {"\n"}• Same as above, with additional focus on balance and fall prevention.
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Youth (6-17 years):</Text>
          {"\n"}• At least 60 minutes of moderate-to-vigorous physical activity daily, including aerobic, muscle, and bone-strengthening activities.
        </Text>

  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Best Practices for Safe and Effective Exercise</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          • Consult your healthcare provider before starting a new exercise program, especially if you have chronic conditions or are new to exercise.{"\n"}
          • Warm up for 5-10 minutes before activity and cool down afterward.{"\n"}
          • Progress gradually—avoid sudden increases in intensity or duration.{"\n"}
          • Stay hydrated and wear appropriate attire and footwear.{"\n"}
          • Listen to your body: rest if you feel pain, dizziness, or shortness of breath.
        </Text>

  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Frequently Asked Questions</Text>
  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>How do I set realistic fitness goals?</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Use the SMART framework: Specific, Measurable, Achievable, Relevant, and Time-bound. Start with small, attainable goals and build up as you progress.
        </Text>

  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>What if I have limited time?</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Short, high-intensity workouts (HIIT) or breaking activity into 10-minute bouts throughout the day can be effective. Consistency is more important than duration.
        </Text>

  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>How can I stay motivated?</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Track your progress, vary your routine, exercise with friends or groups, and celebrate milestones. Find activities you enjoy to make exercise sustainable.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>What should I eat before and after exercise?</Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Before:</Text> Eat a light meal or snack with complex carbohydrates and some protein 1-2 hours before exercise.{"\n"}
          <Text style={{ fontWeight: '600' }}>After:</Text> Refuel with protein and healthy carbohydrates within 30-60 minutes to support recovery and muscle repair.
        </Text>

  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>Is it safe to exercise every day?</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Yes, but alternate intensity and focus (e.g., cardio one day, strength the next) and include at least one rest or active recovery day per week.
        </Text>

  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>How do I prevent injuries?</Text>
  <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Use proper technique, progress gradually, cross-train, and listen to your body. If unsure, consult a certified fitness professional.
        </Text>

  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>Where can I find credible exercise resources?</Text>
  <Text style={{ fontSize: 16, marginBottom: 32 }}>
          Refer to organizations such as the American College of Sports Medicine (ACSM), World Health Organization (WHO), and local health authorities for up-to-date guidelines and resources.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}