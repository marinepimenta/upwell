import { Stack } from 'expo-router';
import { UpWellColors } from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: UpWellColors.background,
        },
      }}>
      <Stack.Screen name="nome" />
      <Stack.Screen name="glp1" />
      <Stack.Screen name="objetivo" />
      <Stack.Screen name="peso" />
    </Stack>
  );
}
