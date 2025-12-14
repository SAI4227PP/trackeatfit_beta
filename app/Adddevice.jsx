import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import images from '../constants/images';
import { useGoogleFit } from '../context/GoogleFitContext';

const Adddevice = ({ }) => {

  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All'); // Default tab is 'All'
  const [recipes, setRecipes] = useState([]);
  const { authorized } = useGoogleFit();

  const handlefavitoures = ()=>{
    navigation.navigate('favorite');
  }

  const handlegooglefit = ()=>{
    navigation.navigate('GoogleFitApi');
  }


  // Render the content based on the active tab
  const renderContent = () => {
    if (activeTab === 'All') {
      return (
        <View>
          <Text style={{ color: 'black', fontSize: 18, fontWeight: '600', marginBottom: 16, marginLeft: 8 }}>Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {/* healthConnect */}
            <TouchableOpacity style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 8, marginBottom: 16, width: 110, marginRight: 16, marginTop: 12 }}>
              <View style={{ marginTop: 6, marginLeft: 16 }}>
                <Image
                  source={images.healthConnect}
                  style={{ width: 36, height: 40 }}
                  resizeMode='contain'
                />
              </View>
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ color: 'black', fontWeight: '600', marginLeft: 16 }}>health</Text>
                <Text style={{ color: 'black', fontWeight: '600', marginLeft: 4 }}>Connect by</Text>
                <Text style={{ color: 'black', fontWeight: '600', marginTop: 4 }}>Health Conn...</Text>
              </View>
            </TouchableOpacity>

            {/* google fitness connect (now clickable) */}
            <TouchableOpacity onPress={handlegooglefit} style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 12, marginBottom: 16, width: 110, marginRight: 16, marginTop: 12 }}>
              <View style={{ marginTop: 6, marginLeft: 16 }}>
                <Image
                  source={images.google_fitness_fit_app_logo}
                  style={{ width: 36, height: 40 }}
                  resizeMode='contain'
                />
              </View>
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ color: 'black', fontWeight: '600', marginLeft: 4 }}>Google Fit</Text>
                <Text style={{ color: 'black', fontWeight: '600', marginTop: 4 }}>Activity Tra..</Text>
              </View>
            </TouchableOpacity>
            {/* Add more featured items as needed */}
          </ScrollView>
          
          <Text style={{ color: 'black', fontSize: 18, fontWeight: '600', marginBottom: 16, marginLeft: 8 }}>All Apps</Text>
          {/* Vertical Scroll for All Apps */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* google fitness connect */}
  <TouchableOpacity onPress={handlegooglefit} style={{ backgroundColor: 'white', flexDirection: 'row', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 16, marginBottom: 8, width: '100%', marginRight: 16, marginTop: 8 }}>
        <View style={{ marginTop: 4 }}>
            <Image
            source={images.google_fitness_fit_app_logo}
            style={{ width: 48, height: 48 }}
            resizeMode='contain'
            />
            </View>
      <View style={{ flexDirection: 'column', marginLeft: 12, marginTop: 4, flexShrink: 1 }}>
        <Text style={{ color: 'black', fontWeight: '600', marginLeft: 4, marginTop: 4 }}>Google Fit</Text>
        <Text style={{ color: 'black', fontWeight: '600' }}>Connect Google Fit to TrackEatFit to see your weight data in Google...</Text>
    </View>
  </TouchableOpacity>

            {/* google fitness connect */}
  <TouchableOpacity style={{ backgroundColor: 'white', flexDirection: 'row', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 16, marginBottom: 16, width: '100%', marginRight: 16, marginTop: 4 }}>
        <View style={{ marginTop: 4 }}>
            <Image
            source={images.healthConnect}
            style={{ width: 48, height: 48 }}
            resizeMode='contain'
            />
            </View>
      <View style={{ flexDirection: 'column', marginLeft: 12, marginTop: 4, flexShrink: 1 }}>
      <Text style={{ color: 'black', fontWeight: '600', marginLeft: 4 }}>Health Connect by Android</Text>
        <Text style={{ color: 'black', fontWeight: '600' }}>Health Connect gives you a simple way to share data between your h...</Text>
    </View>
  </TouchableOpacity>
            {/* Add more apps as needed */}
          </ScrollView>
        </View>
      );
    }

    if (activeTab === 'Connected') {
      return (
        <View>
          <Text style={{ color: 'black', fontSize: 18, fontWeight: '600', marginBottom: 16, marginLeft: 8 }}>Connected Devices</Text>
          {authorized ? (
            <TouchableOpacity
              onPress={handlegooglefit}
              style={{ backgroundColor: 'white', flexDirection: 'row', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, padding: 16, marginBottom: 8, width: '100%', marginRight: 16, marginTop: 8 }}
            >
              <View style={{ marginTop: 4 }}>
                <Image
                  source={images.google_fitness_fit_app_logo}
                  style={{ width: 48, height: 48 }}
                  resizeMode='contain'
                />
              </View>
              <View style={{ flexDirection: 'column', marginLeft: 12, marginTop: 4, flexShrink: 1 }}>
                <Text style={{ color: 'black', fontWeight: '600', marginLeft: 4, marginTop: 4 }}>Google Fit</Text>
                <Text style={{ color: 'black', fontWeight: '600' }}>Connected</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: '#6B7280', marginLeft: 8 }}>No connected devices found.</Text>
          )}
        </View>
      );
    }

    return (
      <View style={{ flex: 1, marginLeft: 24, marginTop: 20 }}>
        <Text style={{ color: 'black', fontSize: 18 }}>No Connected devices found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Header Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingVertical: 16 }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={30} color="black" />
              </TouchableOpacity>
              <Text style={{ color: 'black', fontWeight: '600', fontSize: 18, marginLeft: 12 }}>Apps & Devices</Text>
            </View>
      

      {/* Navigation Bar Below the Label */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#f3f4f6' }}>
        {/* Tab 1 - All */}
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: activeTab === 'All' ? '#6B8E23' : 'transparent'
          }}
          onPress={() => setActiveTab('All')}
        >
          <Text style={{ fontSize: 14, fontWeight: activeTab === 'All' ? '600' : '500' }}>All</Text>
        </TouchableOpacity>

        {/* Tab 2 - Connected */}
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: activeTab === 'My Meals' ? '#6B8E23' : 'transparent'
          }}
          onPress={() => setActiveTab('Connected')}
        >
          <Text style={{ fontSize: 14, fontWeight: activeTab === 'Connected' ? '600' : '500' }}>Connected</Text>
        </TouchableOpacity>

        
      </View>

      {/* Content Based on Active Tab */}
      <View style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default Adddevice;
