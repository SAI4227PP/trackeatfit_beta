import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useAnimatedStyle, 
    withRepeat, 
    withSequence, 
    withTiming,
    useSharedValue
} from 'react-native-reanimated';
import { useEffect } from 'react'; // Import useEffect from react instead

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function SkeletonItem({ width, height, style }) {
    const translateX = useSharedValue(-width);

    useEffect(() => {
        translateX.value = withRepeat(
            withSequence(
                withTiming(width, { duration: 1000 }),
                withTiming(-width, { duration: 0 })
            ),
            -1
        );
    }, [width]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={[{ width, height, overflow: 'hidden', borderRadius: 8 }, style]}>
            <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }}>
                <AnimatedGradient
                    style={[{ width: '100%', height: '100%' }, animatedStyle]}
                    colors={['#e5e7eb', '#f3f4f6', '#e5e7eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </View>
        </View>
    );
}

export function CategorySkeleton() {
    return (
        <View style={{ width: 130, height: 160, marginRight: 16 }}>
            <LinearGradient
                colors={['#ffffff', '#f3f4f6']}
                style={{ padding: 16, borderRadius: 16, height: '100%' }}
            >
                <SkeletonItem width={48} height={48} style={{ marginBottom: 8 }} />
                <SkeletonItem width={80} height={20} style={{ marginBottom: 8 }} />
                <SkeletonItem width={60} height={16} />
            </LinearGradient>
        </View>
    );
}

export function CategoryGridSkeleton() {
    return (
        <View style={{ width: '48%', height: 160, marginBottom: 16 }}>
            <LinearGradient
                colors={['#ffffff', '#f3f4f6']}
                style={{ padding: 16, borderRadius: 16, height: '100%' }}
            >
                <SkeletonItem width={48} height={48} style={{ marginBottom: 8 }} />
                <SkeletonItem width={80} height={20} style={{ marginBottom: 8 }} />
                <SkeletonItem width={60} height={16} />
            </LinearGradient>
        </View>
    );
}
