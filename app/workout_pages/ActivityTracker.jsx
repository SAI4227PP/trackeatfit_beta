import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const MET_VALUES = {
  Running: 9.8,
  Cycling: 7.5,
  Walking: 3.8,
};

// Professional: Exact India bounds (including islands)
const INDIA_BOUNDS = {
  latitudeMin: 6.5546079,
  latitudeMax: 37.084107,
  longitudeMin: 68.1113787,
  longitudeMax: 97.4136132,
  minDelta: 0.0001, // Closest zoom (~10 meters)
  maxDelta: 10,
};

// Initial region centered in India
const INITIAL_REGION = {
  latitude: 22.5937,
  longitude: 78.9629,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const CLEAN_MAP_STYLE = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];

// Add static cache for initial location/region
let cachedLocation = null;
let cachedRegion = null;

const MOVEMENT_THRESHOLD_METERS = 5; // Minimum movement to count as real movement

const ActivityTracker = () => {
  const [location, setLocation] = useState(cachedLocation);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(0);
  const [mode, setMode] = useState('Running');
  const [isTracking, setIsTracking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(!(cachedLocation && cachedRegion));
  const [region, setRegion] = useState(cachedRegion || INITIAL_REGION);
  const [zoom, setZoom] = useState(0.001);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [activeCalories, setActiveCalories] = useState(0);

  // Persist initial location/region across page reloads
  const initialLocationRef = useRef(null);
  const initialRegionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (cachedLocation && cachedRegion) {
      console.log('Using cached location/region:', cachedLocation, cachedRegion);
      setLocation(cachedLocation);
      setRegion(cachedRegion);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission status:', status);
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        console.log('Initial location:', loc.coords);
        const clamped = clampRegionToIndia({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: zoom,
          longitudeDelta: zoom,
        });
        if (isMounted) {
          setLocation(loc.coords);
          setRegion(clamped);
          cachedLocation = loc.coords;
          cachedRegion = clamped;
          setLoading(false);
        }
      } catch (err) {
        console.log('Error getting location:', err);
        Alert.alert('Error', 'Failed to get location.');
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  // Clamp region strictly to India bounds and allowed zoom
  const clampRegionToIndia = (region) => {
    const latitude = Math.min(Math.max(region.latitude, INDIA_BOUNDS.latitudeMin), INDIA_BOUNDS.latitudeMax);
    const longitude = Math.min(Math.max(region.longitude, INDIA_BOUNDS.longitudeMin), INDIA_BOUNDS.longitudeMax);
    const latitudeDelta = Math.min(Math.max(region.latitudeDelta, INDIA_BOUNDS.minDelta), INDIA_BOUNDS.maxDelta);
    const longitudeDelta = Math.min(Math.max(region.longitudeDelta, INDIA_BOUNDS.minDelta), INDIA_BOUNDS.maxDelta);
    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };

  /*
  Why does "Region change (no clamp)" trigger without user interaction?

  This is because the MapView's region prop is controlled by React state (`region`), and you update `region` in several places:
  - In useEffect when location or zoom changes.
  - In handleRegionChangeComplete when the user pans/zooms the map.

  When you update `region` in state, MapView re-renders and triggers `onRegionChangeComplete` even if the change was programmatic (not user interaction).
  This is normal for controlled components in React Native.

  If you want to distinguish between user interaction and programmatic region changes, you need to track the source of the change.
  For most apps, this is not a bug, but expected behavior.

  If you want to log only user-driven region changes, you can debounce or ignore logs when region is updated from your own code (for example, by using a ref flag).

  Example: Add a ref to track programmatic region changes and suppress logs for those.

  */

  const regionChangeByUserRef = useRef(true);

  // Intercept pan/zoom and clamp region
  const handleRegionChangeComplete = (newRegion) => {
    if (!regionChangeByUserRef.current) {
      // Programmatic change, do not log
      regionChangeByUserRef.current = true;
      return;
    }
    const clamped = clampRegionToIndia(newRegion);
    const isClamped =
      clamped.latitude !== newRegion.latitude ||
      clamped.longitude !== newRegion.longitude ||
      clamped.latitudeDelta !== newRegion.latitudeDelta ||
      clamped.longitudeDelta !== newRegion.longitudeDelta;
    if (isClamped) {
      console.log('Region clamped:', clamped);
      regionChangeByUserRef.current = false;
      setRegion(clamped);
    } else {
      console.log('Region change (no clamp):', newRegion);
    }
  };

  useEffect(() => {
    if (location) {
      // Only update region if location is outside current region bounds
      const clamped = clampRegionToIndia({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: zoom,
        longitudeDelta: zoom,
      });
      const isClamped =
        clamped.latitude !== region.latitude ||
        clamped.longitude !== region.longitude ||
        clamped.latitudeDelta !== region.latitudeDelta ||
        clamped.longitudeDelta !== region.longitudeDelta;
      if (isClamped) {
        console.log('Region updated from location/zoom:', clamped);
        regionChangeByUserRef.current = false;
        setRegion(clamped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, location]);

  useEffect(() => {
    // Only update deltas if zoom changed
    if (region.latitudeDelta !== zoom || region.longitudeDelta !== zoom) {
      regionChangeByUserRef.current = false;
      setRegion((prev) => ({
        ...prev,
        latitudeDelta: zoom,
        longitudeDelta: zoom,
      }));
      console.log('Region deltas updated for zoom:', zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // Helper: Is movement valid (not duplicate, not GPS drift, not stationary)
  const isValidMovement = (last, next, threshold = MOVEMENT_THRESHOLD_METERS) => {
    if (!last) return true;
    const dist = getDistanceFromLatLonInKm(last.latitude, last.longitude, next.latitude, next.longitude);
    // Check for GPS drift, duplicate points, and stationary (speed)
    return (
      dist * 1000 >= threshold &&
      (last.latitude !== next.latitude || last.longitude !== next.longitude)
    );
  };

  const startTracking = async () => {
    console.log('Start tracking pressed');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable location permissions.');
        setHasPermission(false);
        return;
      }
      setHasPermission(true);
    } catch (err) {
      Alert.alert('Permission error', 'Could not check location permission.');
      setHasPermission(false);
      return;
    }

    // If previous session ended, reset stats for new session
    if (sessionEnded || !isTracking) {
      setPath([]);
      setDistance(0);
      setDuration(0);
      setActiveCalories(0);
      setSessionEnded(false);
    }

    setIsTracking(true);

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setPath([{ latitude: loc.coords.latitude, longitude: loc.coords.longitude }]);
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          try {
            const coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            const accuracy = typeof loc.coords.accuracy === 'number' ? loc.coords.accuracy : 1000;
            // Only update location/region if accuracy is good and coordinates changed
            if (
              accuracy <= 50 &&
              (!location ||
                location.latitude !== coords.latitude ||
                location.longitude !== coords.longitude)
            ) {
              setLocation(coords);
              const clamped = clampRegionToIndia({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: zoom,
                longitudeDelta: zoom,
              });
              setRegion(clamped);
            }

            // Only update path/distance/calories if mode is valid and movement is valid
            if (['Running', 'Cycling', 'Walking'].includes(mode)) {
              setPath((prev) => {
                const last = prev.length > 0 ? prev[prev.length - 1] : null;
                // Only update if movement is valid and speed > 0 and accuracy is good
                const speed = typeof loc.coords.speed === 'number' ? loc.coords.speed : 0;
                const accuracy = typeof loc.coords.accuracy === 'number' ? loc.coords.accuracy : 1000;
                if (
                  isValidMovement(last, coords) &&
                  speed > 0 &&
                  accuracy <= 50 // Only accept GPS points with accuracy <= 50 meters
                ) {
                  const dist = last ? getDistanceFromLatLonInKm(last.latitude, last.longitude, coords.latitude, coords.longitude) : 0;
                  if (dist > 0) {
                    const weight = 70;
                    const hours = 3 / 3600;
                    const kcal = MET_VALUES[mode] * weight * hours;
                    setActiveCalories((c) => c + kcal);
                  }
                  return [...prev, coords];
                }
                // Don't update path if not moving or duplicate/drift
                return prev;
              });
            } else {
              // Don't update path/distance/calories in other modes
              // Only update location/region
            }
          } catch (err) {
            console.log('Error in location update:', err);
          }
        }
      );
    } catch (err) {
      console.log('Error starting tracking:', err);
      Alert.alert('Error', 'Failed to start tracking.');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    console.log('Stop tracking pressed');
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
    setSessionEnded(true);
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Memoize calories and pace for performance
  const calories = React.useMemo(() => {
    console.log('Calories calculation:', { activeCalories, duration, mode, isTracking, sessionEnded });
    // Use activeCalories if tracking, else fallback to total calculation
    if (isTracking || sessionEnded) {
      return activeCalories.toFixed(0);
    }
    const weight = 70;
    const hours = duration / 3600;
    return (MET_VALUES[mode] * weight * hours).toFixed(0);
  }, [activeCalories, duration, mode, isTracking, sessionEnded]);

  const avgPace = React.useMemo(() => {
    console.log('Avg pace calculation:', { distance, duration });
    return duration > 0 ? (distance / (duration / 3600)).toFixed(2) : '0.00';
  }, [distance, duration]);

  // Clamp zoom in/out to allowed deltas (meters-level granularity)
  const handleZoomIn = () => {
    console.log('Zoom in');
    setZoom((z) => Math.max(z / 2, INDIA_BOUNDS.minDelta));
  };
  const handleZoomOut = () => {
    console.log('Zoom out');
    setZoom((z) => Math.min(z * 2, INDIA_BOUNDS.maxDelta));
  };

  // Professional: Ensure hooks cleanup and error handling
  useEffect(() => {
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        // Full-page skeleton loader
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 50
        }}>
          <View style={{ width: '75%', height: 224, backgroundColor: '#f3f4f6', borderRadius: 16, marginTop: 32, marginBottom: 24 }} />
          <View style={{ width: '75%', height: 128, backgroundColor: '#f3f4f6', borderRadius: 16, marginBottom: 16 }} />
          <View style={{ width: '75%', height: 64, backgroundColor: '#f3f4f6', borderRadius: 16, marginBottom: 8 }} />
          <View style={{ width: '50%', height: 48, backgroundColor: '#f3f4f6', borderRadius: 24, marginBottom: 8 }} />
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={true}
              customMapStyle={CLEAN_MAP_STYLE}
              mapType="standard"
              minZoomLevel={5}
              maxZoomLevel={20}
              onRegionChangeComplete={handleRegionChangeComplete}
              scrollEnabled={zoom > INDIA_BOUNDS.minDelta}
            >
              {/* Only show polyline if path has more than 1 point and mode is valid */}
              {['Running', 'Cycling', 'Walking'].includes(mode) && path.length > 1 && (
                <Polyline
                  coordinates={path}
                  strokeColor="#22c55e"
                  strokeWidth={4}
                />
              )}
              {location &&
                typeof location.latitude === 'number' &&
                typeof location.longitude === 'number' &&
                !isNaN(location.latitude) &&
                !isNaN(location.longitude) && (
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title="You"
                    pinColor="#ff3421"
                  />
                )}
            </MapView>
          </View>
          <View style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            backgroundColor: '#f8fafc',
            padding: 20,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOpacity: 0.10,
            shadowRadius: 8
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Activity</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 999,
                  backgroundColor: isTracking ? '#22c55e' : '#d1d5db',
                  marginRight: 6
                }} />
                <Text style={{
                  fontSize: 12, fontWeight: 'bold',
                  color: isTracking ? '#22c55e' : '#d1d5db'
                }}>
                  {isTracking ? 'Live Tracking' : 'Start Tracking'}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4 }}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>{formatTime(duration)}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 2 }}>Total Time</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Distance', value: `${distance.toFixed(2)} KM`, icon: '📍' },
                  { label: 'Calories', value: `${calories} KCAL`, icon: '🔥' },
                  { label: 'Avg. Pace', value: `${avgPace} KM/H`, icon: '⚡' },
                ].map((stat, idx) => (
                  <View key={stat.label} style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{stat.value}</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Mode</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['Running', 'Cycling', 'Walking'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: mode === m ? '#e0f2fe' : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: mode === m ? '#38bdf8' : '#e5e7eb'
                    }}
                    onPress={() => {
                      console.log('Mode changed:', m);
                      setMode(m);
                    }}
                    disabled={isTracking}
                    accessibilityLabel={`Select ${m} mode`}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#000',
                paddingVertical: 16,
                borderRadius: 24,
                alignItems: 'center',
                marginBottom: 4
              }}
              onPress={isTracking ? stopTracking : startTracking}
              accessibilityLabel={isTracking ? `Stop ${mode}` : `Start ${mode}`}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                {isTracking ? 'Stop' : 'Start'} {mode}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, textAlign: 'center', color: '#888', marginTop: 2 }}>
              Map data © Google Maps (India)
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default ActivityTracker;
