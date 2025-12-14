import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  FlatList,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage



class BluetoothHealthTracker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      manager: null,
      scannedDevices: [],
      permissionsGranted: false,
      scanning: false,
      connectingDeviceId: null,
      connectedDevice: null,
      error: null, // State to hold error messages
    };
  }

  componentDidMount() {
    // Initialize BleManager only if not already initialized
    if (!this.state.manager) {
      const bleManager = new BleManager();
      console.log('Initializing BleManager...');
      this.setState({ manager: bleManager });
    }
    this.loadSavedDevice(); // Load saved device data on mount

  }

  componentWillUnmount() {
    const { manager, connectedDevice } = this.state;

    // Only disconnect the device if it's connected and it's not the end of the app
    if (manager && connectedDevice) {
      console.log('Disconnecting from device:', connectedDevice.id);
      manager.cancelDeviceConnection(connectedDevice.id)
        .then(() => {
          console.log('Device disconnected');
          this.setState({ connectedDevice: null });
        })
        .catch((error) => {
          console.error('Failed to disconnect:', error);
        });
    }

    // Optional: Destroy BleManager only if no device is connected
    if (manager && !connectedDevice) {
      console.log('Destroying BleManager...');
      manager.destroy();
    }
  }

  isDuplicateDevice = (devices, nextDevice) => {
    return devices.findIndex((device) => nextDevice.id === device.id) > -1;
  };

  loadSavedDevice = async () => {
    try {
      const savedDeviceId = await AsyncStorage.getItem('connectedDeviceId');
      if (savedDeviceId) {
        console.log('Saved device found, attempting to reconnect...');
        const { manager } = this.state;
        if (manager) {
          manager.connectToDevice(savedDeviceId)
            .then(device => {
              this.setState({ connectedDevice: device });
              console.log('Reconnected to saved device:', savedDeviceId);
            })
            .catch(error => {
              console.error('Failed to reconnect:', error);
            });
        }
      }
    } catch (error) {
      console.error('Error loading saved device:', error);
    }
  };

  saveDeviceToStorage = async (device) => {
    try {
      await AsyncStorage.setItem('connectedDeviceId', device.id);
      console.log('Device saved:', device.id);
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };


  scanForPeripherals = () => {
    const { manager } = this.state;
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error during scanning:', error);
        this.setState({ error: 'Error scanning for devices.' });
        return;
      }

      if (device && (device.localName || device.name)) {
        this.setState((prevState) => {
          const { scannedDevices } = prevState;
          if (!this.isDuplicateDevice(scannedDevices, device)) {
            return { scannedDevices: [...scannedDevices, device] };
          }
          return null;
        });
      }
    });
  };

  requestAndroid31Permissions = async () => {
    try {
      const bluetoothScanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Bluetooth Scan Permission',
          message: 'This app requires Bluetooth Scan permission to find devices.',
          buttonPositive: 'OK',
        }
      );
      const bluetoothConnectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Bluetooth Connect Permission',
          message: 'This app requires Bluetooth Connect permission to interact with devices.',
          buttonPositive: 'OK',
        }
      );
      const fineLocationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app requires Location permission to detect Bluetooth devices.',
          buttonPositive: 'OK',
        }
      );

      return (
        bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
        bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
        fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        if (androidVersion < 31) {
          const fineLocationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app requires Location permission to detect Bluetooth devices.',
              buttonPositive: 'OK',
            }
          );
          return fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          return await this.requestAndroid31Permissions();
        }
      } catch (error) {
        console.error('Error while requesting permissions:', error);
        this.setState({ error: 'Error requesting permissions.' });
        return false;
      }
    } else {
      return true;
    }
  };

  startScan = async () => {
    const { permissionsGranted, manager } = this.state;
    if (!permissionsGranted) {
      const granted = await this.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth and location permissions are required to scan and connect to health devices. Please enable them in your app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      this.setState({ permissionsGranted: true });
    }

    if (!manager) {
      console.error('Bluetooth Manager is not initialized.');
      this.setState({ error: 'Bluetooth Manager is not initialized.' });
      return;
    }

    console.log('Starting scan...');
    this.setState({ scanning: true });
    this.scanForPeripherals();
  };

  stopScan = () => {
    const { manager } = this.state;
    if (manager) {
      console.log('Stopping scan...');
      manager.stopDeviceScan();
      this.setState({ scanning: false });
    }
  };

  connectToDevice = async (device) => {
    const { manager } = this.state;
    if (!manager) {
      console.error('Bluetooth Manager is not initialized.');
      this.setState({ error: 'Bluetooth Manager is not initialized.' });
      return;
    }

    // Prevent reconnect if already connected to this device
    if (this.state.connectedDevice && this.state.connectedDevice.id === device.id) {
      console.log('Already connected to this device:', device.id);
      return;
    }

    this.setState({ connectingDeviceId: device.id });

    try {
      console.log('Attempting to connect to device:', device.id);

      // Connect to the device
      await manager.connectToDevice(device.id);
      console.log('Device connected:', device.id);

      const deviceInfo = await device.discoverAllServicesAndCharacteristics();
console.log('Discovered services and characteristics:', deviceInfo);

    // Get health data (Example: heart rate and steps)
    this.readHealthData(device);


      // Stop scanning after successful connection
      manager.stopDeviceScan();
      console.log('Scanning stopped.');

      
      // Set the connected device and reset connecting state
      this.setState({ connectedDevice: device, connectingDeviceId: null, scanning: false });
      console.log('Device connected successfully:', device.id);
    
      // Save the connected device data
      this.saveDeviceToStorage(device);
    
    } catch (error) {
      console.error('Connection failed:', error);
      this.setState({ error: 'Failed to connect to the device.' });
      Alert.alert('Connection Error', 'Failed to connect to the device.');
      this.setState({ connectingDeviceId: null, scanning: false });
    }
  };


  disconnectDevice = () => {
    const { manager, connectedDevice } = this.state;
    if (manager && connectedDevice) {
      console.log('Disconnecting from device:', connectedDevice.id);
      manager.cancelDeviceConnection(connectedDevice.id)
        .then(async () => {
          console.log('Device disconnected');
          
          // Clear the saved device data from AsyncStorage
          await AsyncStorage.removeItem('connectedDeviceId');
          console.log('Device data removed from AsyncStorage');
  
          this.setState({ connectedDevice: null });
        })
        .catch((error) => {
          console.error('Failed to disconnect:', error);
          this.setState({ error: 'Failed to disconnect from device.' });
        });
    }
  };
  
// Read Health Data from Characteristics (Steps, Heart Rate, etc.)
readHealthData = async (device) => {
  try {
    // Example: Read Heart Rate
    const heartRateServiceUUID = '180d'; // UUID for Heart Rate Service
    const heartRateCharacteristicUUID = '2a37'; // UUID for Heart Rate Measurement

    const heartRateCharacteristic = await device.readCharacteristicForService(
      heartRateServiceUUID, heartRateCharacteristicUUID
    );
    const heartRateData = heartRateCharacteristic.value; // Get heart rate data
    console.log('Heart Rate Data:', heartRateData);

    // Example: Read Step Count (if available)
    const stepServiceUUID = '181a'; // UUID for Step Count
    const stepCharacteristicUUID = '2a53'; // UUID for Step Count Characteristic

    const stepCharacteristic = await device.readCharacteristicForService(
      stepServiceUUID, stepCharacteristicUUID
    );
    const stepData = stepCharacteristic.value; // Get step data
    console.log('Step Data:', stepData);

    // Add more health metrics like calories, blood pressure, sleep, etc., by accessing their corresponding characteristics.
    
  } catch (error) {
    console.error('Error reading health data:', error);
  }
};

  render() {
    const { scannedDevices, scanning, connectingDeviceId, connectedDevice, error } = this.state;
  
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 20 }}>
        <View style={{ flex: 1, paddingTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30 }}>
            Bluetooth Health Tracker
          </Text>
  
          {error && (
            <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#f8d7da', borderRadius: 5 }}>
              <Text style={{ color: '#721c24', fontWeight: 'bold' }}>{error}</Text>
            </View>
          )}
  
          {!scanning && !connectedDevice && (
            <TouchableOpacity
              onPress={this.startScan}
              style={{
                backgroundColor: '#007bff',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: 'white', fontSize: 18 }}>Start Scan</Text>
            </TouchableOpacity>
          )}
  
          {scanning && (
            <>
              <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20, marginBottom: 5 }} />
              <TouchableOpacity
                onPress={this.stopScan}
                style={{
                  backgroundColor: '#dc3545',
                  padding: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginVertical: 20,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>Stop Scan</Text>
              </TouchableOpacity>
            </>
          )}
  
          {connectedDevice ? (
            <Text style={{ fontSize: 18, marginTop: 20 }}>
              Connected to: {connectedDevice.name || 'Unknown Device'}
            </Text>
          ) : (
            <Text style={{ fontSize: 18, marginTop: 20 }}>Scanned Devices:</Text>
          )}
  
          {connectedDevice ? (
            <View style={{ marginTop: 10, padding: 15, backgroundColor: '#e9ecef', borderRadius: 8 }}>
              <Text>Name: {connectedDevice.name || 'Unknown Device'}</Text>
              <Text>ID: {connectedDevice.id}</Text>
  
              {/* Disconnect Icon */}
              <TouchableOpacity onPress={this.disconnectDevice} style={{ position: 'absolute', right: 16, top: 18 }}>
                <Icon name="close-circle-outline" size={28} color="black" />
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={scannedDevices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    marginTop: 10,
                    padding: 15,
                    backgroundColor: '#e9ecef',
                    borderRadius: 8,
                  }}
                >
                  <Text>Name: {item.name || 'Unknown Device'}</Text>
                  <Text>ID: {item.id}</Text>
                  <TouchableOpacity
                    onPress={() => this.connectToDevice(item)}
                    style={{
                      backgroundColor: '#28a745',
                      padding: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                    disabled={connectingDeviceId === item.id}
                  >
                    <Text style={{ color: 'white', fontSize: 16 }}>
                      {connectingDeviceId === item.id ? 'Connecting...' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }
}



export default BluetoothHealthTracker;
