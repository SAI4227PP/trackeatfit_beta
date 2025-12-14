import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const Steps = () => {

  const navigation = useNavigation();

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const loadCheckboxState = async () => {
      try {
        const value = await AsyncStorage.getItem('isChecked');
        if (value !== null) {
          setIsChecked(JSON.parse(value));
        }
      } catch (error) {
        console.error('Failed to load checkbox state', error);
      }
    };

    loadCheckboxState();
  }, []);

  const toggleCheckbox = async () => {
    try {
      const newValue = !isChecked;
      setIsChecked(newValue);
      await AsyncStorage.setItem('isChecked', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save checkbox state', error);
    }
  };

  const handleAddDevice = () => {
    navigation.navigate('Adddevice');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f3f4f6' }}>
        <TouchableOpacity style={{ marginRight: 20, marginLeft: 4 }} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={27} color="black" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, color: 'black', fontWeight: '600', marginBottom: 4 }}>Steps</Text>
      </View>
      <Text style={{ color: 'black', fontWeight: '600', fontSize: 16, marginTop: 8, marginLeft: 12 }}>choose a device</Text>
      
      {/* add a device */}
      <TouchableOpacity onPress={handleAddDevice} style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 12, marginBottom: 12, marginTop: 12, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}> 
          <View style={{ width: 48, height: 48, backgroundColor: '#fee2e2', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: -3 }}>
            <Icon name="add" size={24} color="red" />
          </View>
          <View style={{ flexDirection: 'column' }}>
            <Text style={{ color: 'black', fontWeight: '600', marginLeft: 8 }}>Add a device</Text>
            <Text style={{ color: 'black', fontWeight: '500', marginLeft: 8 }}>Connect your steps tracker to TrackEatFit</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* don't track */}
      <TouchableOpacity onPress={toggleCheckbox} style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
          <View style={{ width: 48, height: 48, backgroundColor: '#6b7280', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ban" size={24} color="white" />
          </View>
          <View style={{ flexDirection: 'column', marginLeft: 8 }}>
            <Text style={{ color: 'black', fontWeight: '600' }}>Don't track steps</Text>
            <Text style={{ color: 'black', fontWeight: '500' }}>No step data will be stored</Text>
          </View>
        </View>
        <Icon name={isChecked ? "checkbox" : "checkbox-outline"} size={24} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Steps;