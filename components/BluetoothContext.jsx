import React, { createContext, useContext, useState, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';

// Create the Bluetooth context
const BluetoothContext = createContext();

export const BluetoothProvider = ({ children }) => {
  const [manager, setManager] = useState(null);
  const [connectedDevice, setConnectedDevice] = useState(null);

  useEffect(() => {
    // Initialize BleManager only once
    const bleManager = new BleManager();
    setManager(bleManager);

    return () => {
      // Clean up BleManager when the app is closed
      bleManager.destroy();
    };
  }, []);

  const connectToDevice = async (device) => {
    if (manager) {
      try {
        console.log('Connecting to device:', device.id);
        await manager.connectToDevice(device.id);
        console.log('Device connected:', device.id);
        setConnectedDevice(device);
      } catch (error) {
        console.error('Failed to connect to device:', error);
      }
    }
  };

  const disconnectDevice = async () => {
    if (manager && connectedDevice) {
      try {
        console.log('Disconnecting from device:', connectedDevice.id);
        await manager.cancelDeviceConnection(connectedDevice.id);
        console.log('Device disconnected');
        setConnectedDevice(null);
      } catch (error) {
        console.error('Failed to disconnect from device:', error);
      }
    }
  };

  return (
    <BluetoothContext.Provider value={{ manager, connectedDevice, connectToDevice, disconnectDevice }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => useContext(BluetoothContext);
