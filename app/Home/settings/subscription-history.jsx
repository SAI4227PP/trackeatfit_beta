import { useEffect, useState } from 'react';

import { useNavigation } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";


// Simple skeleton loader component
const SkeletonRow = ({ isDarkMode }) => (
  <View
    style={{
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#171717' : '#fff',
      borderColor: isDarkMode ? '#262626' : '#e5e7eb',
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <View style={{
        height: 20,
        width: 96,
        borderRadius: 6,
        backgroundColor: isDarkMode ? '#404040' : '#e5e7eb'
      }} />
      <View style={{
        height: 20,
        width: 48,
        borderRadius: 6,
        backgroundColor: isDarkMode ? '#404040' : '#e5e7eb'
      }} />
    </View>
    <View style={{
      height: 16,
      width: 128,
      borderRadius: 6,
      marginBottom: 8,
      backgroundColor: isDarkMode ? '#404040' : '#e5e7eb'
    }} />
    <View style={{
      height: 16,
      width: 160,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#404040' : '#e5e7eb'
    }} />
  </View>
);

const formatPeriod = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options = { year: 'numeric', month: 'short' };
  return `${startDate.toLocaleString('en-US', options)} - ${endDate.toLocaleString('en-US', options)}`;
};

const StatusBadge = ({ status }) => {
  let color = '#22c55e';
  if (status === 'Expired') color = '#ef4444';
  if (status === 'Cancelled') color = '#f59e42';
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 4,
        backgroundColor: color + '22'
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 12, color }}>{status}</Text>
    </View>
  );
};


const SubscriptionHistory = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => navigation.goBack();

  const userId = user?.id || user?._id; // Replace with dynamic userId if needed


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subscription?userId=${userId}`);
        const data = await res.json();
        if (data && Array.isArray(data.subscriptions)) {
          // Map API data to UI format
          const mapped = data.subscriptions.map(sub => {
            const payment = (sub.payments && sub.payments[0]) || {};
            return {
              id: sub._id,
              plan: sub.plan === 'PREMIUM' ? 'Premium Monthly' : sub.plan,
              period: formatPeriod(sub.startDate, sub.endDate),
              price: payment.amount ? `₹${payment.amount}` : '-',
              status: sub.status === 'ACTIVE' ? 'Active' : (sub.status === 'EXPIRED' ? 'Expired' : sub.status),
              paymentMethod: payment.paymentMethod || '-',
              paymentStatus: payment.status || '-',
              raw: sub
            };
          });
          setHistory(mapped);
        } else {
          setHistory([]);
        }
      } catch (e) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Sort history: active plan first, then others by end date descending
  const sortedHistory = [...history].sort((a, b) => {
    if (a.status === 'Active') return -1;
    if (b.status === 'Active') return 1;
    return new Date(b.raw.endDate) - new Date(a.raw.endDate);
  });

  const currentPlan = sortedHistory.find(item => item.status === 'Active');

  const renderItem = ({ item }) => (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        backgroundColor: isDarkMode ? '#171717' : '#fff',
        borderColor: isDarkMode ? '#262626' : '#e5e7eb',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          fontWeight: 'bold',
          fontSize: 16,
          color: isDarkMode ? '#fff' : '#171717'
        }}>{item.plan}</Text>
        <Text style={{
          fontWeight: 'bold',
          fontSize: 16,
          color: isDarkMode ? '#fff' : '#171717'
        }}>{item.price}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, justifyContent: 'space-between' }}>
        <View>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: isDarkMode ? '#a3a3a3' : '#404040'
          }}>{item.period}</Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            paddingVertical: 2,
            color: isDarkMode ? '#a3a3a3' : '#404040'
          }}>Payment Method: {item.paymentMethod}</Text>
        </View>
        {item.paymentStatus && item.paymentStatus !== '-' && (
          <View style={{
            marginLeft: 8,
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: item.paymentStatus === 'SUCCESS' ? '#22c55e22' : '#ef444422'
          }}>
            <Text style={{
              fontWeight: 'bold',
              fontSize: 12,
              color: item.paymentStatus === 'SUCCESS' ? '#22c55e' : '#ef4444'
            }}>{item.paymentStatus}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#171717' : '#fff'
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderColor: isDarkMode ? '#262626' : '#e5e7eb'
      }}>
        <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 8 }}>
          <Icon name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#181818"} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: isDarkMode ? '#fff' : '#171717'
        }}>
          Subscription
        </Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Current Plan Card */}
        {currentPlan && (
          <View style={{
            borderRadius: 12,
            borderWidth: 1,
            padding: 16,
            marginBottom: 24,
            backgroundColor: isDarkMode ? '#262626' : '#f3f4f6',
            borderColor: isDarkMode ? '#404040' : '#e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{
                fontWeight: 'bold',
                fontSize: 16,
                color: isDarkMode ? '#fff' : '#171717'
              }}>Current Plan</Text>
              <StatusBadge status={currentPlan.status} />
            </View>
            <Text style={{
              fontWeight: 'bold',
              fontSize: 18,
              marginTop: 6,
              marginBottom: 2,
              color: isDarkMode ? '#fff' : '#171717'
            }}>{currentPlan.plan}</Text>
            <Text style={{
              marginTop: 2,
              fontSize: 14,
              fontWeight: '500',
              color: isDarkMode ? '#a3a3a3' : '#404040'
            }}>{currentPlan.period}</Text>
            <Text style={{
              marginTop: 2,
              fontSize: 14,
              fontWeight: '500',
              color: '#737373'
            }}>Payment Method: {currentPlan.paymentMethod}</Text>
            <Text style={{
              fontWeight: 'bold',
              fontSize: 16,
              marginTop: 8,
              color: isDarkMode ? '#fff' : '#171717'
            }}>{currentPlan.price} / month</Text>
          </View>
        )}
        {/* Subscription History List */}
        <Text style={{
          fontWeight: 'bold',
          fontSize: 16,
          marginBottom: 8,
          marginLeft: 2,
          color: isDarkMode ? '#a3a3a3' : '#737373'
        }}>History</Text>
        {loading ? (
          <View style={{ flex: 1 }}>
            {[1,2,3].map(i => <SkeletonRow key={i} isDarkMode={isDarkMode} />)}
          </View>
        ) : (
          <FlatList
            data={sortedHistory}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={{
                borderRadius: 12,
                borderWidth: 1,
                padding: 16,
                alignItems: 'center',
                backgroundColor: isDarkMode ? '#262626' : '#f3f4f6',
                borderColor: isDarkMode ? '#262626' : '#e5e7eb'
              }}>
                <Icon name="card-outline" size={48} color={isDarkMode ? "#22d3ee" : "#0ea5e9"} />
                <Text style={{
                  marginTop: 16,
                  fontWeight: 'bold',
                  fontSize: 18,
                  color: isDarkMode ? '#fff' : '#171717'
                }}>
                  No subscription history found
                </Text>
                <Text style={{
                  marginTop: 8,
                  textAlign: 'center',
                  color: isDarkMode ? '#a3a3a3' : '#737373'
                }}>
                  Your subscription and payment history will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};



export default SubscriptionHistory;
