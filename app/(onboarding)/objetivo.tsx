import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { UpWellColors } from '@/constants/Colors';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { saveOnboardingData } from '@/utils/storage';

type MainFear = 'rebound' | 'muscle' | 'nutrition' | 'loneliness';

export default function ObjetivoScreen() {
  const [selected, setSelected] = useState<MainFear | null>(null);
  const router = useRouter();

  const options = [
    { label: 'Efeito rebote', value: 'rebound' as MainFear },
    { label: 'Perder massa muscular', value: 'muscle' as MainFear },
    { label: 'Não saber o que comer', value: 'nutrition' as MainFear },
    { label: 'Ficar sozinha nessa', value: 'loneliness' as MainFear },
  ];

  const handleContinue = async () => {
    if (selected) {
      await saveOnboardingData({ mainFear: selected });
      router.push('/(onboarding)/peso');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
      <Text style={styles.question}>Qual é seu maior medo agora?</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selected === option.value && styles.optionButtonSelected,
              index < options.length - 1 && { marginBottom: spacing.md },
            ]}
            onPress={() => setSelected(option.value)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.optionTextSelected,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected}
        activeOpacity={0.8}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UpWellColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: UpWellColors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  question: {
    ...typography.title,
    fontSize: 24,
    color: UpWellColors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: spacing.xl,
  },
  optionButton: {
    backgroundColor: UpWellColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: UpWellColors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  optionButtonSelected: {
    borderColor: UpWellColors.sageDark,
    backgroundColor: UpWellColors.sageLight40,
  },
  optionText: {
    ...typography.body,
    fontSize: 16,
    color: UpWellColors.text,
  },
  optionTextSelected: {
    color: UpWellColors.sageDark,
    fontWeight: '600',
  },
  button: {
    backgroundColor: UpWellColors.sageDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '600',
    color: UpWellColors.surface,
  },
});
