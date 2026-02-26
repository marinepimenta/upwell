import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { UpWellColors } from '@/constants/Colors';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { getOnboardingData, saveOnboardingData } from '@/utils/storage';
import { supabase } from '@/lib/supabase';
import { getTodayBRT } from '@/lib/utils';

export default function PesoScreen() {
  const [weight, setWeight] = useState('');
  const router = useRouter();

  const handleWeightChange = (text: string) => {
    // Permite apenas números e ponto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Garante apenas um ponto decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      setWeight(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setWeight(cleaned);
    }
  };

  const handleComplete = async () => {
    const weightNum = parseFloat(weight);
    if (weightNum > 0 && weightNum < 500) {
      const existing = await getOnboardingData();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            name: existing?.name ?? '',
            weight_initial: weightNum,
            weight_current: weightNum,
            glp1_status: existing?.glp1Status ?? 'never',
            main_fear: existing?.mainFear ?? 'rebound',
            program_start_date: getTodayBRT(),
            onboarding_completed: true,
          })
          .eq('id', user.id);
      }
      await saveOnboardingData({
        currentWeight: weightNum,
        onboardingCompleted: true,
        onboardingDate: new Date().toISOString(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/(tabs)');
    }
  };

  const isValid = () => {
    const weightNum = parseFloat(weight);
    return weightNum > 0 && weightNum < 500;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>
          Qual seu peso hoje? Esse número é só nosso 🤍
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: 72.5"
            placeholderTextColor={UpWellColors.textMuted}
            value={weight}
            onChangeText={handleWeightChange}
            keyboardType="decimal-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleComplete}
          />
          <Text style={styles.unit}>kg</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !isValid() && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!isValid()}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Começar minha jornada</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UpWellColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: UpWellColors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    ...typography.body,
    fontSize: 20,
    color: UpWellColors.text,
  },
  unit: {
    ...typography.body,
    fontSize: 18,
    color: UpWellColors.textSecondary,
    marginLeft: spacing.xs,
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
