import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AIDietScreen() {
    const { isDarkMode } = useTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [dominantDosha, setDominantDosha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [answers, setAnswers] = useState({
        bodyBuild: '',
        skinHair: '',
        digestion: '',
        mindEmotions: '',
        sleep: ''
    });
    const [surveyCompleted, setSurveyCompleted] = useState(false);
    const [dietPlan, setDietPlan] = useState(null);

    const questions = [
        {
            title: "Body Build",
            options: [
                { text: "Slim, hard to gain weight", value: "Vata" },
                { text: "Medium build, muscular, gains/loses weight easily", value: "Pitta" },
                { text: "Sturdy, gains weight easily, slow metabolism", value: "Kapha" }
            ]
        },
        {
            title: "Skin & Hair",
            options: [
                { text: "Dry skin, rough hair", value: "Vata" },
                { text: "Warm/oily skin, acne prone, fine hair", value: "Pitta" },
                { text: "Smooth/oily skin, thick lustrous hair", value: "Kapha" }
            ]
        },
        {
            title: "Digestion",
            options: [
                { text: "Irregular appetite, bloating, gas", value: "Vata" },
                { text: "Strong appetite, prone to heartburn, acidity", value: "Pitta" },
                { text: "Slow digestion, tendency to gain weight", value: "Kapha" }
            ]
        },
        {
            title: "Mind & Emotions",
            options: [
                { text: "Creative, spontaneous, anxious", value: "Vata" },
                { text: "Intense, focused, prone to anger", value: "Pitta" },
                { text: "Calm, steady, prone to attachment", value: "Kapha" }
            ]
        },
        {
            title: "Sleep",
            options: [
                { text: "Light sleeper, wakes easily", value: "Vata" },
                { text: "Moderate sleeper, may have vivid dreams", value: "Pitta" },
                { text: "Deep sleeper, hard to wake up", value: "Kapha" }
            ]
        }
    ];

    const doshaDescriptions = {
        Vata: {
            description: "You have a Vata constitution which means you're creative, quick-thinking, and adaptable. Focus on maintaining regular routines and staying grounded.",
        },
        Pitta: {
            description: "You have a Pitta constitution which means you're focused, determined, and naturally confident. Focus on staying balanced and managing intensity.",
        },
        Kapha: {
            description: "You have a Kapha constitution which means you're naturally calm, steady, and supportive. Focus on staying active and maintaining enthusiasm.",
        }
    };

    const calculateDominantDosha = () => {
        const counts = {
            Vata: 0,
            Pitta: 0,
            Kapha: 0
        };
        
        Object.values(answers).forEach(value => {
            if (value) counts[value]++;
        });

        const maxCount = Math.max(...Object.values(counts));
        const dominant = Object.keys(counts).find(key => counts[key] === maxCount);
        
        return {
            dominant,
            counts
        };
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await loadSavedResults();
            try {
                const savedDietPlan = await AsyncStorage.getItem('dietPlan');
                if (savedDietPlan) {
                    const { plan, dosha } = JSON.parse(savedDietPlan);
                    if (dosha === dominantDosha) { // Only load if it matches current dosha
                        setDietPlan(plan);
                    }
                }
            } catch (error) {
                console.error('Error loading saved diet plan:', error);
            }
        };
        loadInitialData();
    }, [dominantDosha]);

    const loadSavedResults = async () => {
        try {
            const savedResults = await AsyncStorage.getItem('doshaResults');
            if (savedResults) {
                const { dosha, completed } = JSON.parse(savedResults);
                setDominantDosha(dosha);
                setSurveyCompleted(completed);
            }
        } catch (error) {
            console.error('Error loading saved results:', error);
        }
    };

    const saveResults = async (dosha) => {
        try {
            await AsyncStorage.setItem('doshaResults', JSON.stringify({
                dosha,
                completed: true,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving results:', error);
        }
    };

    const handleSurveyComplete = () => {
        const result = calculateDominantDosha();
        setDominantDosha(result.dominant);
        setShowResults(true);
        setSurveyCompleted(true);
        saveResults(result.dominant);
    };

    const handleRetakeSurvey = async () => {
        try {
            await AsyncStorage.removeItem('doshaResults');
            setSurveyCompleted(false);
            setAnswers({
                bodyBuild: '',
                skinHair: '',
                digestion: '',
                mindEmotions: '',
                sleep: ''
            });
            setCurrentSection(0);
        } catch (error) {
            console.error('Error clearing saved results:', error);
        }
    };

    const generateDietPlan = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://34.9.217.14:8000/${dominantDosha}`);
            const data = await response.json();
            setDietPlan(data);
            // Store diet plan in local storage
            await AsyncStorage.setItem('dietPlan', JSON.stringify({
                plan: data,
                dosha: dominantDosha,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error generating diet plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: isDarkMode ? '#111827' : '#FFFFFF'
        }}>
            {/* Header */}
            <View style={{
                paddingTop: 60,
                paddingBottom: 20,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB'
            }}>
                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                }}>
                    AI Diet Planner
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    marginTop: 4
                }}>
                    Your personalized meal plan
                </Text>
            </View>

            {/* Main Content */}
            <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
                {!surveyCompleted ? (
                    <TouchableOpacity 
                        onPress={() => setIsModalVisible(true)}
                        style={{
                            backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 200,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <MaterialCommunityIcons 
                            name="clipboard-list-outline" 
                            size={40} 
                            color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
                        />
                        <Text style={{
                            fontSize: 22,
                            fontWeight: 'bold',
                            color: isDarkMode ? '#FFFFFF' : '#000000',
                            marginTop: 16,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            Discover Your dosha Type
                        </Text>
                        <Text style={{
                            color: isDarkMode ? '#9CA3AF' : '#6B7280',
                            textAlign: 'center',
                            lineHeight: 20,
                            maxWidth: '80%',
                        }}>
                            Take a quick survey to get your personalized Ayurvedic diet recommendations
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={{
                            backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                            borderRadius: 16,
                            padding: 24,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                            marginBottom: 16,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 24,
                            }}>
                                <MaterialCommunityIcons 
                                    name="spa" 
                                    size={32} 
                                    color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        color: isDarkMode ? '#FFFFFF' : '#000000',
                                        marginLeft: 12,
                                    }}>
                                        Dosha Type : {dominantDosha}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setIsInfoModalVisible(true)}
                                        style={{ marginLeft: 25 }}
                                    >
                                        <MaterialCommunityIcons
                                            name="information"
                                            size={24}
                                            color={isDarkMode ? '#60A5FA' : '#3B82F6'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#3B82F6',
                                    padding: 16,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onPress={handleRetakeSurvey}
                            >
                                <MaterialCommunityIcons 
                                    name="refresh" 
                                    size={20} 
                                    color="#FFFFFF" 
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                                    Retake Survey
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Diet Plan Generation Card */}
                        {!dietPlan && (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                                    borderRadius: 16,
                                    padding: 24,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                                onPress={generateDietPlan}
                                disabled={isLoading}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: 'bold',
                                        color: isDarkMode ? '#FFFFFF' : '#000000',
                                        marginBottom: 4,
                                    }}>
                                        {isLoading ? 'Generating...' : 'Generate Diet Plan'}
                                    </Text>
                                    <Text style={{
                                        color: isDarkMode ? '#9CA3AF' : '#6B7280',
                                        fontSize: 14,
                                    }}>
                                        Get personalized meal recommendations for your {dominantDosha} type
                                    </Text>
                                </View>
                                <MaterialCommunityIcons 
                                    name={isLoading ? "loading" : "food-apple-outline"}
                                    size={24} 
                                    color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
                                />
                            </TouchableOpacity>
                        )}

                        {/* Diet Plan Display */}
                        {dietPlan && (
                            <View style={{ marginTop: 20, gap: 24 }}>
                                {['Breakfast', 'Lunch', 'Dinner'].map((meal, idx) => (
                                    <View key={meal} style={{
                                        backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                                        borderRadius: 18,
                                        padding: 22,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.12,
                                        shadowRadius: 10,
                                        elevation: 4,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                            <MaterialCommunityIcons
                                                name={meal === 'Breakfast' ? 'coffee' : meal === 'Lunch' ? 'silverware-fork-knife' : 'moon-waning-crescent'}
                                                size={26}
                                                color={isDarkMode ? '#60A5FA' : '#3B82F6'}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Text style={{
                                                fontSize: 20,
                                                fontWeight: 'bold',
                                                color: isDarkMode ? '#FFFFFF' : '#000000',
                                            }}>
                                                {meal}
                                            </Text>
                                        </View>
                                        <View style={{
                                            backgroundColor: isDarkMode ? '#23272e' : '#FFFFFF',
                                            borderRadius: 14,
                                            padding: 14,
                                            marginBottom: 8,
                                        }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                                color: isDarkMode ? '#60A5FA' : '#3B82F6',
                                                marginBottom: 8,
                                            }}>
                                                Vegetarian
                                            </Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                {dietPlan[meal].Veg.map((item, index) => (
                                                    <View key={index} style={{
                                                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                        borderRadius: 20,
                                                        paddingVertical: 6,
                                                        paddingHorizontal: 12,
                                                        marginBottom: 6,
                                                        marginRight: 6,
                                                    }}>
                                                        <Text style={{
                                                            color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                                            fontSize: 15,
                                                        }}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <View style={{ height: 1, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', marginVertical: 10 }} />
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                                color: isDarkMode ? '#60A5FA' : '#3B82F6',
                                                marginBottom: 8,
                                            }}>
                                                Non-Vegetarian
                                            </Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                {dietPlan[meal].Non_Veg.map((item, index) => (
                                                    <View key={index} style={{
                                                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                        borderRadius: 20,
                                                        paddingVertical: 6,
                                                        paddingHorizontal: 12,
                                                        marginBottom: 6,
                                                        marginRight: 6,
                                                    }}>
                                                        <Text style={{
                                                            color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                                            fontSize: 15,
                                                        }}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Snacks Section */}
                                <View style={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                                    borderRadius: 18,
                                    padding: 22,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 10,
                                    elevation: 4,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                        <MaterialCommunityIcons
                                            name="cookie"
                                            size={26}
                                            color={isDarkMode ? '#60A5FA' : '#3B82F6'}
                                            style={{ marginRight: 10 }}
                                        />
                                        <Text style={{
                                            fontSize: 20,
                                            fontWeight: 'bold',
                                            color: isDarkMode ? '#FFFFFF' : '#000000',
                                        }}>
                                            Snacks
                                        </Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: isDarkMode ? '#23272e' : '#FFFFFF',
                                        borderRadius: 14,
                                        padding: 14,
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {dietPlan.Snacks.map((item, index) => (
                                                <View key={index} style={{
                                                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                    borderRadius: 20,
                                                    paddingVertical: 6,
                                                    paddingHorizontal: 12,
                                                    marginBottom: 6,
                                                    marginRight: 6,
                                                }}>
                                                    <Text style={{
                                                        color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                                        fontSize: 15,
                                                    }}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                {/* Foods to Avoid Section */}
                                {/* <View style={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                                    borderRadius: 18,
                                    padding: 22,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 10,
                                    elevation: 4,
                                    marginBottom: 20,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                        <MaterialCommunityIcons
                                            name="alert-circle-outline"
                                            size={26}
                                            color={isDarkMode ? '#F87171' : '#DC2626'}
                                            style={{ marginRight: 10 }}
                                        />
                                        <Text style={{
                                            fontSize: 20,
                                            fontWeight: 'bold',
                                            color: isDarkMode ? '#F87171' : '#DC2626',
                                        }}>
                                            Foods to Avoid
                                        </Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: isDarkMode ? '#23272e' : '#FFFFFF',
                                        borderRadius: 14,
                                        padding: 14,
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {dietPlan.Foods_to_avoid.slice(0, 15).map((item, index) => (
                                                <View key={index} style={{
                                                    backgroundColor: isDarkMode ? '#F87171' : '#FEE2E2',
                                                    borderRadius: 20,
                                                    paddingVertical: 6,
                                                    paddingHorizontal: 12,
                                                    marginBottom: 6,
                                                    marginRight: 6,
                                                }}>
                                                    <Text style={{
                                                        color: isDarkMode ? '#FFFFFF' : '#DC2626',
                                                        fontSize: 15,
                                                    }}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View> */}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Survey Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                        maxHeight: '90%',
                    }}>
                        {/* Modal Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                            }}>
                                Body Type Assessment
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text style={{ color: '#3B82F6' }}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Progress Indicator */}
                        <View style={{
                            height: 4,
                            backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                            borderRadius: 2,
                            marginBottom: 20,
                        }}>
                            <View style={{
                                width: `${((currentSection + 1) / 5) * 100}%`,
                                height: '100%',
                                backgroundColor: '#3B82F6',
                                borderRadius: 2,
                            }} />
                        </View>

                        <ScrollView>
                            <View style={{ gap: 24 }}>
                                {!showResults ? (
                                    <>
                                        <Text style={{
                                            fontSize: 18,
                                            fontWeight: '600',
                                            color: isDarkMode ? '#FFFFFF' : '#000000',
                                            marginBottom: 16,
                                        }}>
                                            {questions[currentSection].title}
                                        </Text>

                                        {questions[currentSection].options.map((option, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    const field = questions[currentSection].title.toLowerCase().replace(/\s+/g, '');
                                                    setAnswers(prev => ({ ...prev, [field]: option.value }));
                                                    if (currentSection < 4) {
                                                        setCurrentSection(prev => prev + 1);
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: answers[questions[currentSection].title.toLowerCase().replace(/\s+/g, '')] === option.value
                                                        ? '#3B82F6'
                                                        : isDarkMode ? '#374151' : '#F3F4F6',
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <Text style={{
                                                    color: answers[questions[currentSection].title.toLowerCase().replace(/\s+/g, '')] === option.value
                                                        ? '#FFFFFF'
                                                        : isDarkMode ? '#E5E7EB' : '#374151',
                                                }}>
                                                    {option.text}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#3B82F6',
                                                padding: 16,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                                marginTop: 16,
                                            }}
                                            onPress={handleSurveyComplete}
                                        >
                                            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                                Get Your Results
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={{ padding: 16 }}>
                                        <Text style={{
                                            fontSize: 24,
                                            fontWeight: 'bold',
                                            color: isDarkMode ? '#FFFFFF' : '#000000',
                                            marginBottom: 16,
                                            textAlign: 'center'
                                        }}>
                                            Your Dominant Body Type
                                        </Text>
                                        <Text style={{
                                            fontSize: 32,
                                            fontWeight: 'bold',
                                            color: '#3B82F6',
                                            textAlign: 'center',
                                            marginBottom: 24,
                                        }}>
                                            {dominantDosha}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#3B82F6',
                                                padding: 16,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                setShowResults(false);
                                                setIsModalVisible(false);
                                                setCurrentSection(0);
                                                setAnswers({
                                                    bodyBuild: '',
                                                    skinHair: '',
                                                    digestion: '',
                                                    mindEmotions: '',
                                                    sleep: ''
                                                });
                                            }}
                                        >
                                            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                                Done
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Info Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isInfoModalVisible}
                onRequestClose={() => setIsInfoModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderRadius: 20,
                        padding: 20,
                        width: '90%',
                        maxWidth: 400,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: isDarkMode ? '#FFFFFF' : '#000000',
                            }}>
                                {dominantDosha} Dosha
                            </Text>
                            <TouchableOpacity onPress={() => setIsInfoModalVisible(false)}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={{
                            fontSize: 16,
                            color: isDarkMode ? '#E5E7EB' : '#374151',
                            lineHeight: 24,
                        }}>
                            {doshaDescriptions[dominantDosha]?.description}
                        </Text>

                        <TouchableOpacity
                            style={{
                                backgroundColor: '#3B82F6',
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginTop: 20,
                            }}
                            onPress={() => setIsInfoModalVisible(false)}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
