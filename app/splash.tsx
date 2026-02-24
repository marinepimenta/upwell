import { useEffect, useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_LOGGED_IN_KEY = '@upwell:user_logged_in';

const SPLASH_BG = '#5C7A5C';
const SPRING_CONFIG = { damping: 12, stiffness: 180 };

export default function SplashScreenView() {
  const router = useRouter();
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const leafScale = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    if (!shouldNavigate) return;
    let cancelled = false;
    AsyncStorage.getItem(USER_LOGGED_IN_KEY).then((value) => {
      if (cancelled) return;
      if (value === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shouldNavigate, router]);

  useEffect(() => {
    // Elemento 1 — Ícone folha: atraso 200ms, scale 0 → 1.1 → 1.0 (spring)
    leafScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.1, SPRING_CONFIG),
        withSpring(1.0, SPRING_CONFIG)
      )
    );

    // Elemento 2 — Nome "UpWell": inicia 400ms após o ícone (600ms total), fade + slide 500ms ease-out
    nameOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    nameTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    // Elemento 3 — Tagline: inicia 300ms após o nome (900ms total), fade 400ms
    taglineOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 400 })
    );

    // Elemento 4 — Fade out: após todos visíveis + 1200ms (900+400=1300 último termina, +1200 = 2500ms), fade out 400ms ease-in
    screenOpacity.value = withDelay(
      2500,
      withTiming(
        0,
        {
          duration: 400,
          easing: Easing.in(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(setShouldNavigate)(true);
          }
        }
      )
    );
  }, []);

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafScale.value }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar hidden />
      <View style={styles.center}>
        <Animated.View style={leafStyle}>
          <Ionicons name="leaf" size={64} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={nameStyle}>
          <RNText style={styles.name}>UpWell</RNText>
        </Animated.View>
        <Animated.View style={taglineStyle}>
          <RNText style={styles.tagline}>Sua jornada começa aqui 🌿</RNText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
  },
});
