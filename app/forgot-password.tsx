import { useState } from 'react';
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
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, gradients } from '@/constants/theme';
import { usePressScale } from '@/hooks/useEntrance';

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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pressSend = usePressScale();
  const pressBack = usePressScale();
  const pressTryAgain = usePressScale();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: Linking.createURL('/reset-password'),
    });
    if (err) {
      setError('Não foi possível enviar o email. Verifique o endereço digitado.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={gradients.gradientSage} style={styles.gradient}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
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
          {!sent ? (
            <>
              <RNText style={styles.title}>Recuperar senha</RNText>
              <RNText style={styles.subtitle}>
                Digite seu email e enviaremos um link para criar uma nova senha.
              </RNText>

              <View style={styles.card}>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={ON_DARK} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
                {error ? (
                  <View style={styles.inlineErrorWrap}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                    <RNText style={styles.inlineErrorText}>{error}</RNText>
                  </View>
                ) : null}

                <Animated.View style={[styles.btnWrap, pressSend.animatedStyle]}>
                  <TouchableOpacity
                    onPressIn={pressSend.onPressIn}
                    onPressOut={pressSend.onPressOut}
                    onPress={handleForgotPassword}
                    style={styles.btnSend}
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
                      <RNText style={styles.btnSendText}>Enviar link de recuperação</RNText>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          ) : (
            <>
              <Animated.View
                entering={ZoomIn.springify().damping(15).stiffness(120)}
                style={styles.confirmIconCircle}
              >
                <Ionicons name="checkmark" size={46} color="#FFFFFF" />
              </Animated.View>
              <RNText style={styles.confirmTitle}>Email enviado!</RNText>
              <RNText style={styles.confirmTextLine1}>
                Verifique sua caixa de entrada em{'\n'}
                <RNText style={{ fontWeight: '700' }}>{email}</RNText>
              </RNText>
              <RNText style={styles.confirmTextLine2}>O link expira em 1 hora.</RNText>

              <Animated.View style={pressBack.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressBack.onPressIn}
                  onPressOut={pressBack.onPressOut}
                  onPress={() => router.replace('/login')}
                  style={styles.btnBackLogin}
                  activeOpacity={1}
                >
                  <RNText style={styles.btnBackLoginText}>Voltar para o login</RNText>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.tryAgainWrap}>
                <RNText style={styles.tryAgainLabel}>Não recebeu? Verifique o spam ou </RNText>
                <Animated.View style={pressTryAgain.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressTryAgain.onPressIn}
                    onPressOut={pressTryAgain.onPressOut}
                    onPress={() => setSent(false)}
                    activeOpacity={1}
                  >
                    <RNText style={styles.tryAgainLink}>tente novamente</RNText>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}
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
  inlineErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
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
  btnSend: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnSendText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sageDark,
  },
  confirmIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 28,
    alignSelf: 'center',
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: ON_DARK,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmTextLine1: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmTextLine2: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  btnBackLogin: {
    borderWidth: 1.5,
    borderColor: ON_DARK,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBackLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_DARK,
  },
  tryAgainWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  tryAgainLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  tryAgainLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
});
