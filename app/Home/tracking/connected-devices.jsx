import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const ConnectedDevices = () => {
  const { isDarkMode } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/active-sessions`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/terminate-session/${sessionId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to terminate session');
      Alert.alert('Success', 'Session terminated successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
      Alert.alert('Error', 'Failed to terminate session');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Styles
  const styles = {
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: 12,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    refreshBtn: {
      backgroundColor: '#EEF2FF',
      padding: 8,
      borderRadius: 999,
    },
    deviceCard: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      marginBottom: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    deviceCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deviceCardLeft: {
      flex: 1,
    },
    deviceTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deviceTypeText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    activeBadge: {
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      marginLeft: 8,
    },
    activeBadgeText: {
      color: '#15803d',
      fontSize: 12,
      fontWeight: '500',
    },
    deviceInfoBox: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    deviceInfoText: {
      fontSize: 14,
      color: isDarkMode ? '#D1D5DB' : '#6B7280',
      marginBottom: 2,
    },
    deviceInfoLabel: {
      fontWeight: '500',
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    connectedSince: {
      fontSize: 12,
      marginTop: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    terminateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? 'rgba(185, 28, 28, 0.2)' : 'rgba(220, 38, 38, 0.1)',
      borderRadius: 12,
      marginTop: 12,
      paddingVertical: 8,
    },
    terminateBtnText: {
      fontWeight: '500',
      marginLeft: 8,
      color: isDarkMode ? '#F87171' : '#DC2626',
    },
    flatList: {
      flex: 1,
    },
    flatListContent: {
      paddingBottom: 24,
    },
  };

  const formatDeviceInfo = (info) => {
    return {
      deviceType: info.deviceType || 'Unknown device',
      browser: info.browser === 'okhttp' ? 'Mobile App' : (info.browser || 'Unknown browser'),
      platform: info.platform === 'unknown' ? 'Not detected' : (info.platform || 'Not detected'),
      os: info.os === 'unknown' ? 'Not detected' : (info.os || 'Not detected'),
      ip: info.ip || 'Unknown IP'
    };
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDeviceInfo = (deviceInfo) => {
    const formattedInfo = formatDeviceInfo(deviceInfo);
    return (
      <View style={styles.deviceInfoBox}>
        <Text style={styles.deviceInfoText}>
          Type: <Text style={styles.deviceInfoLabel}>{formattedInfo.deviceType}</Text>
        </Text>
        <Text style={styles.deviceInfoText}>
          Browser: <Text style={styles.deviceInfoLabel}>{formattedInfo.browser}</Text>
        </Text>
        <Text style={styles.deviceInfoText}>
          Platform: <Text style={styles.deviceInfoLabel}>{formattedInfo.platform}</Text>
        </Text>
        <Text style={styles.deviceInfoText}>
          Os: <Text style={styles.deviceInfoLabel}>{formattedInfo.os}</Text>
        </Text>
        <Text style={styles.deviceInfoText}>
          Ip Address: <Text style={styles.deviceInfoLabel}>{formattedInfo.ip}</Text>
        </Text>
      </View>
    );
  };

  const renderItem = ({ item: session }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceCardTopRow}>
        <View style={styles.deviceCardLeft}>
          <View style={styles.deviceTypeRow}>
            <Icon name="globe-outline" size={24} color="#4F46E5" style={styles.headerIcon} />
            <Text style={styles.deviceTypeText}>{session.deviceInfo.deviceType}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          {renderDeviceInfo(session.deviceInfo)}
          <Text style={styles.connectedSince}>
            Connected since: {formatTimestamp(session.createdAt)}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.terminateBtn}
        onPress={() => handleTerminateSession(session._id)}
        activeOpacity={0.7}
      >
        <Icon name="trash-outline" size={18} color={isDarkMode ? "#FCA5A5" : "#DC2626"} />
        <Text style={styles.terminateBtnText}>
          Terminate Session
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Icon name="globe-outline" size={28} color="#4F46E5" style={styles.headerIcon} />
            <Text style={styles.headerText}>Connected Devices</Text>
          </View>
          <TouchableOpacity 
            onPress={fetchSessions}
            style={styles.refreshBtn}
            activeOpacity={0.7}
          >
            <Icon name="refresh-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <FlatList
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          data={sessions}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshing={loading}
          onRefresh={fetchSessions}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default ConnectedDevices;
