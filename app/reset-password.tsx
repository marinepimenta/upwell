import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, gradients } from '@/constants/theme';
import { usePressScale, useFadeSlideIn } from '@/hooks/useEntrance';

const ON_DARK = '#FFFFFF';
const ON_DARK_SUBTLE = 'rgba(255,255,255,0.8)';
const INPUT_PLACEHOLDER = 'rgba(255,255,255,0.6)';
const CARD_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.25)',
  borderRadius: 20,
  padding: 24,
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pressSubmit = usePressScale();
  const entranceCheck = useFadeSlideIn(100);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log('Sessão no reset-password:', data.session?.user?.email);
      if (!data.session) {
        router.replace('/forgot-password');
      }
    });
  }, [router]);

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError('Erro ao atualizar senha. O link pode ter expirado.');
    } else {
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2500);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <LinearGradient colors={gradients.gradientSage} style={styles.gradient}>
        <View style={[styles.successWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View style={entranceCheck}>
            <Ionicons name="checkmark-circle" size={64} color="#5C7A5C" />
          </Animated.View>
          <RNText style={styles.successTitle}>Senha atualizada! 🎉</RNText>
          <RNText style={styles.successSubtitle}>Redirecionando para o login...</RNText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.gradientSage} style={styles.gradient}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.replace('/login')}
          style={styles.backBtn}
          hitSlop={12}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={ON_DARK} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <RNText style={styles.title}>Nova senha</RNText>
          <RNText style={styles.subtitle}>Escolha uma senha segura para sua conta.</RNText>

          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={ON_DARK} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithEye]}
                placeholder="Nova senha"
                placeholderTextColor={INPUT_PLACEHOLDER}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={12}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={ON_DARK_SUBTLE}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={ON_DARK} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithEye]}
                placeholder="Confirmar nova senha"
                placeholderTextColor={INPUT_PLACEHOLDER}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError('');
                }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={12}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={ON_DARK_SUBTLE}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.inlineErrorWrap}>
                <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                <RNText style={styles.inlineErrorText}>{error}</RNText>
              </View>
            ) : null}

            <Animated.View style={[styles.btnWrap, pressSubmit.animatedStyle]}>
              <TouchableOpacity
                onPressIn={pressSubmit.onPressIn}
                onPressOut={pressSubmit.onPressOut}
                onPress={handleResetPassword}
                style={styles.btnSubmit}
                activeOpacity={1}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.white, 'rgba(255,255,255,0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? (
                  <ActivityIndicator color={colors.sageDark} />
                ) : (
                  <RNText style={styles.btnSubmitText}>Atualizar senha</RNText>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: ON_DARK,
  },
  subtitle: {
    fontSize: 15,
    color: ON_DARK_SUBTLE,
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    ...CARD_GLASS,
    marginTop: 32,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: ON_DARK,
  },
  inputWithEye: { paddingRight: 8 },
  eyeBtn: { padding: 8 },
  inlineErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  btnWrap: { marginTop: 24 },
  btnSubmit: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sageDark,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ON_DARK,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
