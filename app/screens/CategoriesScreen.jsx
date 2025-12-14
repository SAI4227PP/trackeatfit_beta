import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useFitness } from '../contexts/FitnessContext';
import { CategoryGridSkeleton } from '../../components/Skeletons/SkeletonLoader';

const API_URL = "https://trackeatfit.onrender.com";
// Memoized category card component (matching Workout/home.jsx style)
// Show two cards per row, increase card size
const CARD_WIDTH = 150;
const CARD_HEIGHT = 100;
const IMAGE_HEIGHT = 100;
const CategoryCard = memo(({ category, onPress, style }) => (
    <TouchableOpacity
        style={[
            { marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: 'hidden' },
            style
        ]}
        onPress={onPress}
    >
        <LinearGradient
            colors={category.bgGradient || ["#f1f5f9", "#e0e7ef"]}
            style={{ width: '100%', height: '100%', borderRadius: 16, padding: 0 }}
        >
            {category.image && (
                <View style={{ width: '100%', height: CARD_HEIGHT, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                    <Image
                        source={{ uri: category.image }}
                        style={{ width: '100%', height: IMAGE_HEIGHT, borderTopLeftRadius: 16, borderTopRightRadius: 16, resizeMode: 'contain' }}
                    />
                    <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, paddingVertical: 2, alignItems: 'center' }}>
                        <Text style={{ color: '#1e293b', fontWeight: '600', fontSize: 16 }}>
                            {category.name}
                        </Text>
                    </View>
                </View>
            )}
        </LinearGradient>
    </TouchableOpacity>
));


const TABS = [
    { id: 'all', label: 'All' },
    { id: 'bodypart', label: 'Body Parts' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'exercisetype', label: 'Exercise Types' }
];

const CategoriesScreen = () => {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    // Fetch categories from API
    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [bodyPartsRes, equipmentRes, exerciseTypesRes] = await Promise.all([
                fetch(`${API_URL}/api/v2/bodyparts`),
                fetch(`${API_URL}/api/v2/equipments`),
                fetch(`${API_URL}/api/v2/exercisetypes`)
            ]);
            if (!bodyPartsRes.ok || !equipmentRes.ok || !exerciseTypesRes.ok) throw new Error('Failed to fetch categories');
            const bodyPartsData = await bodyPartsRes.json();
            const equipmentData = await equipmentRes.json();
            const exerciseTypesData = await exerciseTypesRes.json();

            // Normalize and combine
            const bodyParts = (bodyPartsData.results || bodyPartsData).map(bp => ({
                ...bp,
                type: 'bodypart',
                icon: 'body',
                color: '#ef4444',
                bgGradient: ['#ffffff', '#fee2e2'],
            }));
            const equipment = (equipmentData.results || equipmentData).map(eq => ({
                ...eq,
                type: 'equipment',
                icon: 'fitness',
                color: '#3b82f6',
                bgGradient: ['#ffffff', '#dbeafe'],
            }));
            const exerciseTypes = (exerciseTypesData.results || exerciseTypesData).map(et => ({
                ...et,
                type: 'exercisetype',
                icon: 'dumbbell',
                color: '#10b981',
                bgGradient: ['#ffffff', '#d1fae5'],
            }));
            setCategories([...bodyParts, ...equipment, ...exerciseTypes]);
        } catch (err) {
            setError('Failed to fetch categories');
            setCategories([]);
            console.error('Error fetching categories:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Memoized filtering logic
    const filteredCategories = useCallback(() => {
        if (activeTab === 'all') return categories;
        if (activeTab === 'bodypart') return categories.filter(cat => cat.type === 'bodypart');
        if (activeTab === 'equipment') return categories.filter(cat => cat.type === 'equipment');
        if (activeTab === 'exercisetype') return categories.filter(cat => cat.type === 'exercisetype');
        return categories;
    }, [categories, activeTab]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleRetry = () => {
        fetchCategories();
    };

    if (error) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
                    <TouchableOpacity 
                        onPress={handleRetry}
                        style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
    );
}

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons name="chevron-back-outline" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Categories</Text>
                    </View>
                </View>

                {/* Category Tabs */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            style={{
                                marginRight: 16,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 999,
                                backgroundColor: activeTab === tab.id ? '#3b82f6' : '#f3f4f6'
                            }}
                        >
                            <Text
                                style={{
                                    textTransform: 'capitalize',
                                    color: activeTab === tab.id ? '#fff' : '#64748b'
                                }}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Categories Grid */}
                <ScrollView
                    style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#3b82f6"
                        />
                    }
                >
                    {isLoading ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {[1,2,3,4,5,6].map((_, index) => (
                                <CategoryGridSkeleton key={index} />
                            ))}
                        </View>
                    ) : (
                        <View>
                            {(() => {
                                const cats = filteredCategories();
                                const rows = [];
                                for (let i = 0; i < cats.length; i += 2) {
                                    rows.push(
                                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <CategoryCard
                                                category={cats[i]}
                                                onPress={() => navigation.navigate('screens/CategoryDetailScreen', { category: cats[i] })}
                                            />
                                            {cats[i + 1] && (
                                                <CategoryCard
                                                    category={cats[i + 1]}
                                                    onPress={() => navigation.navigate('screens/CategoryDetailScreen', { category: cats[i + 1] })}
                                                />
                                            )}
                                        </View>
                                    );
                                }
                                return rows;
                            })()}
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default CategoriesScreen;

