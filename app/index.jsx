import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '../constants/images';
import videos from '../constants/videos';
import { useGlobalContext } from '../context/GlobalProvider';

const PREMIUM_GRADIENTS = {
    accent: ['#FFD700', '#FFA500', '#FF8C00', '#FF7000'],  // Enhanced 4-color gradient
    overlay: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'],
};

export default function App() {
    const { isLoading, isLoggedIn, setUser, setIsLoggedIn } = useGlobalContext();

    // All hooks must be called unconditionally, before any return
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const logoAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;
    const [tagline] = useState("Elevate Your Wellness Journey");
    const [typedText, setTypedText] = useState("");
    const typingIndex = useRef(0);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const subtitle = "Expert nutrition. Personalized fitness. A thriving community. TrackEatFit empowers you to achieve your healthiest, happiest self.";
    const [subtitleTypedText, setSubtitleTypedText] = useState('');
    const subtitleTypingIndex = useRef(0);
    const videoRef = useRef(null);
    const [videoError, setVideoError] = useState(null);

    // Check local cache for user data
    useEffect(() => {
        const checkUserCache = async () => {
            try {
                const cachedUser = await AsyncStorage.getItem('user');
                if (cachedUser) {
                    const parsedUser = JSON.parse(cachedUser);
                    setUser(parsedUser);
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Error loading cached user:', error);
            }
        };
        checkUserCache();
    }, []);

    // Add fade animation for content
    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Animation states for logo/brand and content
    useEffect(() => {
        Animated.sequence([
            Animated.timing(logoAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            }),
            Animated.timing(contentAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Typing effect for tagline with smoother animation
    useEffect(() => {
        setTypedText('');
        typingIndex.current = 0;
        setShowSubtitle(false);
        const interval = setInterval(() => {
            if (typingIndex.current < tagline.length) {
                const nextChar = tagline[typingIndex.current];
                setTypedText(prev => prev + nextChar);
                typingIndex.current += 1;
                
                // Only complete the animation after the last character is displayed
                if (typingIndex.current === tagline.length) {
                    setTimeout(() => setShowSubtitle(true), 300);
                    clearInterval(interval);
                }
            }
        }, 50); // Slightly slower for better readability
        return () => clearInterval(interval);
    }, [tagline]);

    // Typing effect for subtitle with word-by-word animation
    useEffect(() => {
        if (!showSubtitle) {
            setSubtitleTypedText('');
            subtitleTypingIndex.current = 0;
            return;
        }


        // Split subtitle into words and filter out empty strings
        const words = subtitle.split(' ').filter(word => word.length > 0);
        let currentText = '';
        let currentWordIndex = 0;

        const interval = setInterval(() => {
            if (currentWordIndex >= words.length) {
                clearInterval(interval);
                return;
            }

            const word = words[currentWordIndex];
            const space = currentWordIndex === 0 ? '' : ' ';
            currentText += space + word;
            
            setSubtitleTypedText(currentText);
            
            currentWordIndex++;
        }, 100); // Word by word animation speed

        return () => clearInterval(interval);
    }, [showSubtitle, subtitle]);

    // Control video playback
    useEffect(() => {
        try {
            if (videoRef.current && videoRef.current.pauseAsync) {
                videoRef.current.pauseAsync().then(() => {
                    setTimeout(() => {
                        videoRef.current.playAsync && videoRef.current.playAsync();
                    }, 100);
                });
            }
        } catch (err) {
            setVideoError('Video playback failed to initialize.');
            console.error('Video playback error:', err);
        }
    }, []);

    // If loading, display the loading spinner
    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.5)"]}
                    style={{ padding: 32, borderRadius: 24, alignItems: 'center' }}
                >
                    <View style={{ alignItems: 'center' }}>
                        <Image 
                            source={images.Premium_icon} 
                            style={{ width: 96, height: 96, marginBottom: 16 }} 
                            resizeMode="contain" 
                        />
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginBottom: 8 }}>
                            Preparing Your Experience
                        </Text>
                        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                            Loading personalized nutrition features...
                        </Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // If logged in, redirect to home
    if (isLoggedIn) {
        return <Redirect href="/home" />;
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar 
                style="dark"
                backgroundColor="transparent"
                translucent
            />
            {/* Video Background */}
            <View style={{ flex: 1 }}>
                {videoError ? (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', zIndex: 1 }]}> 
                        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', padding: 24 }}>
                            {videoError}
                        </Text>
                    </View>
                ) : (
                    <Video
                        ref={videoRef}
                        source={videos.index_video}
                        style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}
                        isMuted
                        isLooping
                        resizeMode="cover"
                        shouldPlay
                        rate={1.0}
                        ignoreSilentSwitch="obey"
                        onError={e => {
                            setVideoError('Failed to load background video.');
                            console.error('Video error:', e);
                        }}
                    />
                )}
                <LinearGradient
                    colors={PREMIUM_GRADIENTS.overlay}
                    style={StyleSheet.absoluteFill}
                />
                {/* Logo & Brand Name Animation at the Top */}
                <Animated.View
                    style={{
                        opacity: logoAnim,
                        alignSelf: "center",
                        width: "100%",
                        marginTop: 48,
                        flexDirection: 'column',
                        alignItems: 'center',
                        transform: [
                            {
                                scale: logoAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.85, 1]
                                })
                            },
                            {
                                translateY: logoAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0]
                                })
                            }
                        ],
                    }}
                >
                    <Animated.View
                        style={{
                            width: 150,
                            height: 120,
                            borderRadius: 60,
                            backgroundColor: "rgba(255,255,255,0.95)",
                            justifyContent: "center",
                            alignItems: "center",
                            shadowColor: "#FFD700",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            marginBottom: 4,
                            alignSelf: "center",
                            opacity: logoAnim,
                            transform: [
                                {
                                    scale: logoAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.85, 1]
                                    })
                                },
                                {
                                    translateY: logoAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0]
                                    })
                                }
                            ],
                        }}
                    >
                        <Animated.Image
                            source={images.logo}
                            style={{
                                width: 120,
                                height: 90,
                                resizeMode: "contain",
                                opacity: logoAnim,
                                alignSelf: "center",
                            }}
                        />
                    </Animated.View>
                </Animated.View>
                {/* Professional Tagline */}
                <View style={{ alignItems: 'center', marginTop: 144 }}>
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: '800',
                            color: 'white',
                            textAlign: 'center',
                            letterSpacing: 1.5,
                            textShadowColor: 'rgba(0,0,0,0.25)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 6,
                        }}
                    >
                        {typedText}
                    </Text>
                    <View style={{ height: 18 }} /> 
                    {showSubtitle && (
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: 'white',
                                textAlign: 'center',
                                maxWidth: 320,
                                opacity: 0.92,
                                lineHeight: 22,
                                letterSpacing: 0.2,
                                textShadowColor: 'rgba(0,0,0,0.18)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                            }}
                        >
                            {subtitleTypedText}
                        </Text>
                    )}
                    {/* Action Button to go to Sign In page */}
                  {showSubtitle && subtitleTypedText === subtitle && (

                        <>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => router.push('/(auth)/sign-in')}
                            style={{
                                marginTop: 64,
                                paddingHorizontal: 32,
                                paddingVertical: 12,
                                borderRadius: 999,
                                backgroundColor: '#FFD700',
                                shadowColor: '#FFD700',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.18,
                                shadowRadius: 8,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a202c', letterSpacing: 0.5 }}>
                                Get Started with TrackEatFit
                            </Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => router.push('/(auth)/log-continue')}
                            style={{
                                marginTop: 16,
                                paddingHorizontal: 32,
                                paddingVertical: 12,
                                borderRadius: 999,
                                backgroundColor: '#FFA500',
                                shadowColor: '#FFA500',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a202c', letterSpacing: 0.5 }}>
                                Continue
                            </Text>
                        </TouchableOpacity> */}
                        </>
                    )}
                </View>
                {/* Brand Content Area */}
                <View style={{ padding: 24, paddingTop: 48, flex: 1, justifyContent: 'flex-end' }}>
                    {/* ...existing code for content area (if any)... */}
                </View>
            </View>
        </SafeAreaView>
    );
}