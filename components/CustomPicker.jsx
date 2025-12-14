import { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const CustomPicker = ({ value, items, onValueChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const selectedItem = items.find(item => item.value === value);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        onValueChange(item.value);
        setIsVisible(false);
      }}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? '#374151' : '#f3f4f6',
        backgroundColor: item.value === value ? (isDarkMode ? '#374151' : '#f9fafb') : undefined
      }}
    >
      <Text style={{
        color: isDarkMode ? '#fff' : '#111827',
        fontSize: 16
      }}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderRadius: 16,
          backgroundColor: isDarkMode ? '#1f2937' : '#fff',
          borderWidth: 1,
          borderColor: isDarkMode ? '#374151' : '#e5e7eb'
        }}
      >
        <Text style={{
          color: isDarkMode ? '#fff' : '#111827',
          fontSize: 16
        }}>
          {selectedItem?.label}
        </Text>
        <Icon
          name="chevron-down"
          size={20}
          color={isDarkMode ? "#F9FAFB" : "#374151"}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
        >
          <View style={{
            marginHorizontal: 16,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: isDarkMode ? '#1f2937' : '#fff'
          }}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              style={{ maxHeight: 320 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default CustomPicker;
