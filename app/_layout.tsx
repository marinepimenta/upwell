import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { UpWellColors } from '@/constants/Colors';

const UpWellTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: UpWellColors.tint,
    background: UpWellColors.background,
    card: UpWellColors.surface,
    text: UpWellColors.text,
    border: UpWellColors.borderLight,
  },
};

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider value={UpWellTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
