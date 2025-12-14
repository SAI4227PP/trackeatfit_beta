import LottieView from 'lottie-react-native';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  alertContainer: {
    width: 320,
    padding: 20,
    backgroundColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  lottieContainer: {
    position: 'absolute',
    top: -30
  },
  message: {
    marginTop: 96,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000'
  },
  button: {
    backgroundColor: '#65a30d',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16
  }
});

const CustomAlert = ({ visible, onClose, message, animation, showAnimation = true }) => (
  <Modal transparent={true} visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.alertContainer}>
        
        {showAnimation && animation ? (
          <View style={styles.lottieContainer}>
            <LottieView
              source={animation}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
          </View>
        ) : null}
        
        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CustomAlert;
