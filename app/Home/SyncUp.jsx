import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleFit } from '../../context/GoogleFitContext';
import { useTheme } from '../../context/ThemeContext';

const SyncUp = () => {
  const { isDarkMode } = useTheme();
  const { authorized: googleFitAuthorized } = useGoogleFit();
  const navigation = useNavigation();

  // Dynamically set Google Fit connection status
  const devices = useMemo(
    () => [
      {
        id: '1',
        name: 'Google Fit',
        status: googleFitAuthorized ? 'Connected' : 'Not Connected',
        icon: 'logo-google',
        color: '#34a853',
      },
      {
        id: '2',
        name: 'Apple Health',
        status: 'Not Connected',
        icon: 'logo-apple',
        color: '#111827',
      },
      {
        id: '3',
        name: 'Fitbit',
        status: 'Not Connected',
        icon: 'watch-outline',
        color: '#00bcd4',
      },
    ],
    [googleFitAuthorized]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={isDarkMode ? ['#111827', '#1f2937'] : ['#f8fafc', '#e0e7ef']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color={isDarkMode ? '#fff' : '#111'}
            />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: isDarkMode ? '#f3f4f6' : '#111827' }]}>
            Sync Up Devices
          </Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.description, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>
            Connect your favorite health and fitness devices to sync your activity and health data.
          </Text>
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.name === 'Google Fit') {
                    navigation.navigate('GoogleFitApi');
                  } else if (item.name === 'Apple Health' || item.name === 'Fitbit') {
                    Alert.alert('Coming Soon', `${item.name} integration is coming soon!`);
                  }
                }}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#1f2937', '#111827'] : ['#fff', '#f3f4f6']}
                  style={styles.deviceGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon} size={28} color={item.color} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: isDarkMode ? '#f3f4f6' : '#111827' }]}>
                      {item.name}
                    </Text>
                    <Text style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      {item.status}
                    </Text>
                  </View>
                  <Ionicons
                    name={item.status === 'Connected' ? 'checkmark-circle' : 'chevron-forward'}
                    size={24}
                    color={item.status === 'Connected' ? '#10b981' : isDarkMode ? '#9ca3af' : '#6b7280'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  description: {
    marginBottom: 24,
  },
  deviceButton: {
    marginBottom: 16,
  },
  deviceGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 999,
    padding: 12,
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
};

export default SyncUp;
