import { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

const CustomDropdown = ({ options, selectedValue, onSelect, placeholder }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option) => {
    onSelect(option);
    setIsDropdownOpen(false);
  };

  return (
    <View style={{ marginTop: 10, width: 120 }}>
      <TouchableOpacity 
        onPress={handleDropdownToggle} 
        style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
      >
        <Text style={{ color: '#1f2937', flex: 1, fontSize: 16, marginLeft: 4 }}>{selectedValue || placeholder}</Text>
        <Text style={{ color: '#4b5563', fontSize: 12 }}>{isDropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setIsDropdownOpen(false)}
          activeOpacity={1}
        >
          <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 20, maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <Text style={{ fontSize: 20, color: '#4b5563', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onPress={() => handleOptionSelect(item)} 
                  style={{ paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: index !== options.length - 1 ? 1 : 0, borderBottomColor: '#f3f4f6' }}
                >
                  <Text style={{ color: '#374151', fontSize: 16, textAlign: 'center' }}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomDropdown;
