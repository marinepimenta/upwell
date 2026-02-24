import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { UpWellColors } from '@/constants/Colors';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { saveOnboardingData } from '@/utils/storage';

export default function NomeScreen() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    if (name.trim()) {
      await saveOnboardingData({ name: name.trim() });
      router.push('/(onboarding)/glp1');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.greeting}>Oi! Eu sou a Well, sua coach pessoal 🌿</Text>
          <Text style={styles.question}>Como posso te chamar?</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={UpWellColors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UpWellColors.sageLight40,
  },
  container: {
    flex: 1,
    backgroundColor: UpWellColors.sageLight40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoImage: {
    width: 180,
    height: 80,
  },
  textContainer: {
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.title,
    fontSize: 28,
    color: UpWellColors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  question: {
    ...typography.titleSmall,
    fontSize: 20,
    color: UpWellColors.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: UpWellColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: UpWellColors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...typography.body,
    fontSize: 18,
    color: UpWellColors.text,
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
