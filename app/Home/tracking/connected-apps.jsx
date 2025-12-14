import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useGoogleFit } from '../../../context/GoogleFitContext'; // <-- add import
import { useTheme } from '../../../context/ThemeContext';

const ConnectedApps = () => {
  const { user, updateUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const { 
    authorized: googleFitAuthorized, 
    isLoading: googleFitLoading, 
    authorizeGoogleFit, 
    disconnectGoogleFit 
  } = useGoogleFit(); // <-- use context

  const [apps, setApps] = useState({
    'google_fit': {
      name: 'Google Fit',
      icon: 'google-fit',
      color: '#4285F4',
      isConnected: false,
      lastSync: null,
      permissions: ['activity', 'heart_rate', 'steps'],
    },
    'apple_health': {
      name: 'Apple Health',
      icon: 'heart-pulse',
      color: '#FF2D55',
      isConnected: false,
      lastSync: null,
      permissions: ['activity', 'nutrition', 'vitals'],
    },
    'fitbit': {
      name: 'Fitbit',
      icon: 'watch',
      color: '#00B0B9',
      isConnected: false,
      lastSync: null,
      permissions: ['activity', 'sleep', 'heart_rate'],
    },
    'strava': {
      name: 'Strava',
      icon: 'bike',
      color: '#FC4C02',
      isConnected: false,
      lastSync: null,
      permissions: ['activity', 'routes'],
    },
  });

  // Sync Google Fit connection state with context
  useEffect(() => {
    setApps(prev => ({
      ...prev,
      google_fit: {
        ...prev.google_fit,
        isConnected: !!googleFitAuthorized,
      }
    }));
  }, [googleFitAuthorized]);

  const handleConnect = async (appId) => {
    setLoading(true);
    try {
      if (appId === 'google_fit') {
        if (!apps.google_fit.isConnected) {
          const result = await authorizeGoogleFit();
          if (result?.success) {
            setApps(prev => ({
              ...prev,
              google_fit: {
                ...prev.google_fit,
                isConnected: true,
                lastSync: new Date().toISOString(),
              }
            }));
            Alert.alert('Connected', 'Successfully connected to Google Fit', [{ text: 'OK' }]);
          } else {
            Alert.alert('Error', result?.message || 'Failed to connect to Google Fit');
          }
        } else {
          await disconnectGoogleFit();
          setApps(prev => ({
            ...prev,
            google_fit: {
              ...prev.google_fit,
              isConnected: false,
            }
          }));
          Alert.alert('Disconnected', 'Disconnected from Google Fit', [{ text: 'OK' }]);
        }
        setLoading(false);
        return;
      }
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApps(prev => ({
        ...prev,
        [appId]: {
          ...prev[appId],
          isConnected: !prev[appId].isConnected,
          lastSync: new Date().toISOString(),
        }
      }));

      Alert.alert(
        apps[appId].isConnected ? 'Disconnected' : 'Connected',
        `Successfully ${apps[appId].isConnected ? 'disconnected from' : 'connected to'} ${apps[appId].name}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to ${apps[appId].isConnected ? 'disconnect' : 'connect'} to ${apps[appId].name}`);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSync(new Date().toISOString());
      Alert.alert('Success', 'Data synchronized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  // Styles
  const styles = {
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: {
      padding: 8,
      marginLeft: -8,
      borderRadius: 999,
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#F3F4F6' : '#111827',
      marginLeft: 8,
    },
    scrollView: {
      padding: 16,
    },
    infoBox: {
      backgroundColor: isDarkMode ? 'rgba(30, 64, 175, 0.5)' : '#DBEAFE',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      marginHorizontal: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoTitle: {
      fontWeight: '500',
      marginLeft: 8,
      color: isDarkMode ? '#60A5FA' : '#1D4ED8',
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? '#60A5FA' : '#1D4ED8',
    },
    appsCard: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      marginBottom: 16,
      overflow: 'hidden',
    },
    appsCardHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    appsCardHeaderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#F3F4F6' : '#111827',
    },
    appsCardHeaderDesc: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    appCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    appCardLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    appIconContainer: (color) => ({
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${color}20`,
    }),
    appCardTextContainer: {
      marginLeft: 12,
      flex: 1,
    },
    appCardTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#F3F4F6' : '#111827',
    },
    appCardStatus: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    appCardSync: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    syncButton: {
      marginTop: 16,
      borderRadius: 12,
      opacity: 0.9,
    },
    syncButtonGradient: {
      paddingVertical: 16,
      borderRadius: 12,
    },
    syncButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      textAlign: 'center',
    },
    lastSyncText: {
      textAlign: 'center',
      fontSize: 14,
      marginTop: 16,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
  };

  const AppCard = ({ appId, app }) => (
    <View style={styles.appCardRow}>
      <View style={styles.appCardLeft}>
        <View style={styles.appIconContainer(app.color)}>
          <MaterialCommunityIcons name={app.icon} size={24} color={app.color} />
        </View>
        <View style={styles.appCardTextContainer}>
          <Text style={styles.appCardTitle}>{app.name}</Text>
          <Text style={styles.appCardStatus}>
            {app.isConnected ? 'Connected' : 'Not connected'}
          </Text>
          {app.isConnected && app.lastSync && (
            <Text style={styles.appCardSync}>
              Last sync: {new Date(app.lastSync).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={app.isConnected}
        onValueChange={() => handleConnect(appId)}
        trackColor={{ false: '#d1d5db', true: '#A7F3D0' }}
        thumbColor={app.isConnected ? '#047857' : '#9CA3AF'}
        disabled={loading || (appId === 'google_fit' && googleFitLoading)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Connected Apps</Text>
        </View>
        {loading && <ActivityIndicator color="#047857" />}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={20} color={isDarkMode ? "#93C5FD" : "#1D4ED8"} />
            <Text style={styles.infoTitle}>Data Sync</Text>
          </View>
          <Text style={styles.infoText}>
            Connect your fitness apps to sync activity data, workouts, and health metrics automatically.
          </Text>
        </View>

        <View style={styles.appsCard}>
          <View style={styles.appsCardHeader}>
            <Text style={styles.appsCardHeaderTitle}>Fitness Apps</Text>
            <Text style={styles.appsCardHeaderDesc}>
              Connect your favorite fitness tracking apps
            </Text>
          </View>
          {Object.entries(apps).map(([appId, app]) => (
            <AppCard key={appId} appId={appId} app={app} />
          ))}
        </View>

        <TouchableOpacity
          onPress={syncData}
          disabled={syncing || !Object.values(apps).some(app => app.isConnected)}
          style={styles.syncButton}
        >
          <LinearGradient
            colors={['#15803d', '#166534']}
            style={styles.syncButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.syncButtonRow}>
              <MaterialCommunityIcons 
                name="sync" 
                size={20} 
                color="white" 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.syncButtonText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {lastSync && (
          <Text style={styles.lastSyncText}>
            Last synchronized: {new Date(lastSync).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConnectedApps;
