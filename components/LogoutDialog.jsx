import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';

const LogoutDialog = ({ visible, onConfirm, onCancel }) => {
  const scaleAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const iconStyle = {
    transform: [
      { scale: scaleAnim },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      }
    ]
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={{
            width: '90%',
            maxWidth: 384, // equivalent to max-w-sm
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5
          }}
        >
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#fef2f2',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Animated.View style={iconStyle}>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons 
                  name="logout" 
                  size={36} 
                  color="#dc2626"
                />
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={16} 
                  color="#dc2626" 
                  style={{ position: 'absolute', top: -5, right: -5 }}
                />
              </View>
            </Animated.View>
          </View>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 8
          }}>
            Sign Out
          </Text>
          
          <Text style={{
            color: '#4B5563',
            textAlign: 'center',
            marginBottom: 24
          }}>
            Are you sure you want to sign out? This will clear all your local data.
          </Text>
          
          <View style={{
            flexDirection: 'row',
            width: '100%',
            gap: 12
          }}>
            <TouchableOpacity 
              onPress={onCancel}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#f3f4f6',
                borderRadius: 12
              }}
            >
              <Text style={{
                color: '#374151',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onConfirm}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={{
                  padding: 12,
                  borderRadius: 12
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  Sign Out
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default LogoutDialog;
