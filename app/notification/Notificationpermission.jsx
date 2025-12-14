import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInUp,
  FadeOut,
  SlideInUp
} from 'react-native-reanimated';
import { checkNotificationPermission, requestNotificationPermission } from '../../utils/notificationUtils';

const Notificationpermission = ({ onClose = () => {}, visible = false }) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const wasVisible = useRef(false);

  // Only check permission when modal becomes visible
  useEffect(() => {
    if (visible && !wasVisible.current) {
      checkNotificationStatus();
      wasVisible.current = true;
    }
    if (!visible) {
      wasVisible.current = false;
    }
  }, [visible]);

  const checkNotificationStatus = async () => {
    const isEnabled = await checkNotificationPermission();
    setIsPermissionGranted(isEnabled);
  };

  const handleEnableNotifications = async () => {
    try {
      const isGranted = await requestNotificationPermission();
      setIsPermissionGranted(isGranted);
      // Only close and trigger backend registration if permission is granted
      onClose(isGranted);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      onClose(false);
    }
  };

  const handleMaybeLater = () => {
    onClose(false);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose(false)}
      animationType="none"
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <Pressable 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
          }}
          onPress={() => onClose(false)}
        />
        <Animated.View 
          entering={SlideInUp.springify().damping(15).delay(200)}
          exiting={FadeOut}
          style={{
            width: '100%',
            maxWidth: 340,
          }}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={{
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 5,
              overflow: 'hidden',
            }}
          >
            {/* Premium Header */}
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 24,
                alignItems: 'center',
              }}
            >
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 9999,
                padding: 16,
                marginBottom: 8,
              }}>
                <Animated.View
                  entering={BounceIn.delay(400)}
                >
                  <Ionicons name="notifications" size={32} color="white" />
                </Animated.View>
              </View>
              <Text style={{
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 4,
              }}>
                Stay Updated
              </Text>
              <Text style={{
                color: '#dbeafe',
                textAlign: 'center',
              }}>
                Enhance your wellness journey with timely notifications
              </Text>
            </LinearGradient>

            {/* Content */}
            <View style={{
              paddingHorizontal: 24,
              paddingBottom: 0,
              paddingTop: 24,
              backgroundColor: 'white',
            }}>
              {[
                {
                  icon: "🍽️",
                  title: "Meal Reminders",
                  desc: "Never miss your nutrition goals"
                },
                {
                  icon: "🎯",
                  title: "Daily Goals",
                  desc: "Track your progress effortlessly"
                },
                {
                  icon: "📊",
                  title: "Weekly Insights",
                  desc: "Understand your patterns"
                },
                {
                  icon: "💪",
                  title: "Motivation Boost",
                  desc: "Stay inspired and focused"
                }
              ].map(({ icon, title, desc }, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInUp.delay(500 + (index * 100))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: index !== 3 ? 12 : 0,
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#eff6ff',
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#111827',
                      fontWeight: '600',
                      marginBottom: 2,
                    }}>
                      {title}
                    </Text>
                    <Text style={{
                      color: '#6b7280',
                      fontSize: 14,
                    }}>
                      {desc}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={{
              padding: 16,
              backgroundColor: '#f9fafb',
            }}>
              <TouchableOpacity
                onPress={handleEnableNotifications}
                style={{ marginBottom: 12 }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                  }}
                >
                  <Text style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 18,
                  }}>
                    Enable Notifications
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMaybeLater}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{
                  color: '#6b7280',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: 16,
                }}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default Notificationpermission;
