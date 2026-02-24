import { useEffect, useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_LOGGED_IN_KEY = '@upwell:user_logged_in';

const SPLASH_BG = '#5C7A5C';
const SPLASH_DURATION_MS = 2900;

export default function SplashScreenView() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.getItem(USER_LOGGED_IN_KEY).then((value) => {
        if (value === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.center}>
        <View>
          <Ionicons name="leaf" size={64} color="#FFFFFF" />
        </View>
        <View>
          <RNText style={styles.name}>UpWell</RNText>
        </View>
        <View>
          <RNText style={styles.tagline}>Sua jornada começa aqui 🌿</RNText>
        </View>
      </View>
    </View>
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
