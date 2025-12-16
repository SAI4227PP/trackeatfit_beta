import LottieView from 'lottie-react-native';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

const CustomAlertSign = ({
  visible,
  onClose,
  message,
  animation,
  showAnimation = true,
}) => (
  <Modal transparent={true} visible={visible} animationType="fade">
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <View
        style={{
          width: 288, // w-72 = 18rem * 16px
          paddingHorizontal: 20, // px-5 = 1.25rem * 16px
          paddingVertical: 32, // py-8 = 2rem * 16px
          backgroundColor: '#fff',
          borderRadius: 24, // rounded-2xl
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Animation */}
        {showAnimation && animation ? (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <LottieView
              source={animation}
              autoPlay
              loop={false}
              style={{ width: 100, height: 100 }}
            />
          </View>
        ) : null}
        {/* Message */}
        <Text
          style={{
            marginBottom: 24, // mb-6
            textAlign: 'center',
            fontSize: 16, // text-base
            fontWeight: '500', // font-medium
            color: '#374151', // text-gray-700
            lineHeight: 24, // leading-relaxed
          }}
        >
          {message}
        </Text>
        {/* OK Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: '100%',
            backgroundColor: '#000',
            paddingVertical: 12, // py-3
            borderRadius: 16, // rounded-xl
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: '600', // font-semibold
              fontSize: 16, // text-base
            }}
          >
            OK
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CustomAlertSign;
