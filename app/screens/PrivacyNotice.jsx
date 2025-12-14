import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SectionTitle = ({ children }) => (
  <Text className="text-xl font-bold text-gray-800 mb-3">{children}</Text>
);

const Section = ({ title, children }) => (
  <View className="mb-6">
    <SectionTitle>{title}</SectionTitle>
    <Text className="text-gray-600 text-base leading-6">{children}</Text>
  </View>
);

const PrivacyNotice = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-2">Privacy Policy & Legal Notice</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <Section title="Legal Disclaimer">
          The information provided by TrackEatFit ("we," "us," or "our") is for general informational and educational purposes only. All content, including text, graphics, images, and information available through this application is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
        </Section>

        <Section title="About TrackEatFit">
          TrackEatFit is a fitness and exercise information platform. While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the app or the information contained within.
        </Section>

        <Section title="Limitation of Liability">
          By using TrackEatFit, you explicitly acknowledge and agree that:
          • You use the app and perform any exercises at your own risk
          • We are not liable for any injury or damage arising from following any content in the app
          • You should consult with healthcare professionals before starting any exercise program
          • We are not responsible for any adverse effects or consequences resulting from the use of any exercises or suggestions
        </Section>

        <Section title="Data Collection & Usage">
          We collect and process:
          • Account information (email, username)
          • Usage data (exercise preferences, workout history)
          • Device information (type, OS, unique identifiers)
          • Performance metrics
          • Crash reports and diagnostics
          
          This data is used for:
          • Service improvement
          • Personalization
          • Analytics
          • Legal compliance
        </Section>

        <Section title="Third-Party Services">
          Our app may use third-party services that collect information. These services have their own privacy policies and terms of service. We are not responsible for the privacy practices or content of these third-party services.
        </Section>

        <Section title="Medical Disclaimer">
          The exercises and information provided are not medical advice. Always:
          • Consult your physician before beginning any exercise program
          • Stop immediately if you experience pain or discomfort
          • Seek immediate medical attention for injuries
          • Consider your individual health conditions and limitations
        </Section>

        <Section title="Nutrition & Food Tracking">
          TrackEatFit provides nutritional information and food tracking features. Please note:
          • Nutritional values are approximate and may vary from actual foods
          • Food database information comes from various sources including user submissions
          • Calorie counts and nutrient information should be considered estimates
          • We do not guarantee the accuracy of nutritional information
          • Consult a registered dietitian for personalized nutrition advice
        </Section>

        <Section title="Food Database Disclaimer">
          Our food database includes:
          • User-submitted food entries
          • Third-party nutritional databases
          • Manufacturer-provided information
          • Generic food estimates
          
          We are not responsible for:
          • Inaccuracies in user-submitted food data
          • Changes in product formulations
          • Variations in serving sizes
          • Regional or seasonal differences in food items
        </Section>

        <Section title="Dietary Recommendations">
          Any dietary recommendations or meal plans provided are general guidelines only:
          • Not suitable for all medical conditions or dietary restrictions
          • May not meet individual nutritional needs
          • Should be reviewed by healthcare professionals
          • Not intended for treating eating disorders or medical conditions
        </Section>

        <Section title="Food Allergies & Restrictions">
          Important notice regarding food allergies:
          • Always verify ingredients independently
          • Do not rely solely on our app for allergy information
          • Restaurant and product ingredients may change
          • Contact food manufacturers directly for allergen information
          • Seek medical attention for allergic reactions
        </Section>

        <Section title="Intellectual Property">
          All content, features, and functionality of TrackEatFit are owned by us and protected by international copyright, trademark, and other intellectual property laws. Any unauthorized use or reproduction is prohibited.
        </Section>

        <Section title="User Responsibilities">
          You agree to:
          • Provide accurate information
          • Use the app responsibly
          • Not misuse or attempt to abuse the service
          • Report any safety concerns or technical issues
          • Not share your account credentials
        </Section>

        <Section title="Changes to Terms">
          We reserve the right to modify these terms at any time. Changes become effective immediately upon posting. Your continued use of the app constitutes acceptance of any modifications.
        </Section>

        <Section title="GDPR Compliance">
          For users in the European Economic Area (EEA):
          • Right to access your personal data
          • Right to rectification of inaccurate data
          • Right to erasure ("right to be forgotten")
          • Right to data portability
          • Right to withdraw consent
          • Right to lodge a complaint with supervisory authorities
          
          Contact our Data Protection Officer at dpo@trackeatfit.com for GDPR-related inquiries.
        </Section>

        <Section title="Indian Privacy Laws Compliance">
          For users in India, in accordance with Information Technology Act, 2000 and Personal Data Protection Bill:
          • Right to confirmation and access of personal data
          • Right to correction and erasure of personal data
          • Right to data portability
          • Right to be forgotten
          • Grievance redressal within stipulated timeframes
          • Data localization compliance
          • Explicit consent for sensitive personal data
        </Section>

        <Section title="Grievance Contact (India)">
          In compliance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:
          
          • Contact our dedicated Data Protection Team
          • Email: support@trackeatfit.xyz
          • We aim to acknowledge within 24 hours
          • Resolution provided within 15 business days
          • Escalation options available if needed
          • Detailed tracking of grievance status
          
          For immediate assistance with data-related concerns, email us at support@trackeatfit.xyz with subject "Data Protection Query"
        </Section>

        <Section title="Data Storage & Transfer (India)">
          • Primary data servers located in India
          • Sensitive personal data stored locally
          • Cross-border transfers with adequate safeguards
          • Regular compliance audits
          • Retention as per Indian regulations
          • Government authority cooperation as required
        </Section>

        <View className="mt-6 mb-8">
          <View className="p-4 bg-red-50 rounded-lg mb-4">
            <Text className="text-red-800 text-sm leading-5 font-semibold">
              Emergency Notice
            </Text>
            <Text className="text-red-700 text-sm leading-5 mt-2">
              In case of injury or medical emergency while exercising, immediately stop and seek professional medical attention. Call your local emergency services or visit the nearest medical facility.
            </Text>
          </View>

          <View className="p-4 bg-yellow-50 rounded-lg mb-4">
            <Text className="text-yellow-800 text-sm leading-5 font-semibold">
              California Privacy Rights (CCPA)
            </Text>
            <Text className="text-yellow-700 text-sm leading-5 mt-2">
              California residents have additional rights regarding their personal information. Visit our California Privacy Notice at privacy.trackeatfit.com/ccpa
            </Text>
          </View>

          <View className="p-4 bg-green-50 rounded-lg mb-4">
            <Text className="text-green-800 text-sm leading-5 font-semibold">
              Indian User Rights
            </Text>
            <Text className="text-green-700 text-sm leading-5 mt-2">
              Indian users have specific rights under IT Act 2000 and PDP Bill. Visit privacy.trackeatfit.com/india for detailed information about your rights and grievance redressal mechanism.
            </Text>
          </View>

          <View className="p-4 bg-blue-50 rounded-lg">
            <Text className="text-blue-800 text-sm leading-5">
              Contact Information:{'\n'}
              • Support: support@trackeatfit.com{'\n'}
              • Legal Inquiries: legal@trackeatfit.com{'\n'}
              • Data Protection: privacy@trackeatfit.com{'\n'}
              • Business Hours: Monday-Friday, 9:00 AM - 5:00 PM EST
            </Text>
          </View>

          <View className="mt-4 p-4 bg-gray-100 rounded-lg">
            <Text className="text-gray-600 text-xs text-center">
              Last Updated: {new Date().toLocaleDateString()}{'\n'}
              Version 1.0.0{'\n'}
              © {new Date().getFullYear()} TrackEatFit. All rights reserved.{'\n'}
              SOC 2 Type II Certified • HIPAA Compliant • GDPR Ready • IT Act Compliant
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyNotice;
