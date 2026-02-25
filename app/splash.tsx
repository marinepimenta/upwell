import { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import UpWellLogoWhite from '@/components/UpWellLogoWhite';

const SPLASH_BG = '#5C7A5C';

export default function SplashScreenView() {
  const router = useRouter();

  // Step 1 — Logo
  const logoScale = useSharedValue(0.75);
  const logoOpacity = useSharedValue(0);

  // Step 2 — Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(16);

  // Step 3 — Shimmer
  const shimmerX = useSharedValue(-200);
  const shimmerOpacity = useSharedValue(0);

  // Step 4 — Screen fade out
  const screenOpacity = useSharedValue(1);

  const navigateAfterSplash = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();
    if (profile?.onboarding_completed) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)/nome');
    }
  }, [router]);

  useEffect(() => {
    // Step 1 — Logo (0ms)
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 18, stiffness: 120 });

    // Step 2 — Tagline (400ms)
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    taglineY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));

    // Step 3 — Shimmer (700ms)
    shimmerOpacity.value = withDelay(700, withTiming(0.25, { duration: 100 }));
    shimmerX.value = withDelay(700, withTiming(320, { duration: 600, easing: Easing.inOut(Easing.ease) }));
    shimmerOpacity.value = withDelay(1300, withTiming(0, { duration: 200 }));

    // Step 4 — Fade out (2000ms) + navigate
    screenOpacity.value = withDelay(2000, withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }));
    const navTimer = setTimeout(navigateAfterSplash, 2500);

    return () => clearTimeout(navTimer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
    transform: [{ translateX: shimmerX.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar hidden />
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <UpWellLogoWhite width={280} height={106} />
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
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
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ skewX: '-20deg' }],
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    textAlign: 'center',
  },
});
