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
  Modal,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients, spacing } from '@/constants/theme';

const USER_LOGGED_IN_KEY = '@upwell:user_logged_in';
const USER_EMAIL_KEY = '@upwell:user_email';

const CARD_MARGIN_H = 24;
const GAP_24 = 24;
const GAP_12 = 12;
const ON_DARK = '#FFFFFF';
const ON_DARK_SUBTLE = 'rgba(255,255,255,0.8)';
const INPUT_PLACEHOLDER = 'rgba(255,255,255,0.6)';
const DIVIDER_LINE = 'rgba(255,255,255,0.25)';
const FOOTER_HINT = 'rgba(255,255,255,0.7)';
const ERROR_COLOR = 'rgba(255,99,99,0.9)';
const CARD_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.3)',
  borderRadius: 24,
  padding: 28,
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);

  const handleEntrar = async () => {
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('Preencha seu email.');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Preencha sua senha.');
      return;
    }
    try {
      await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
      await AsyncStorage.setItem(USER_EMAIL_KEY, email.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setPasswordError('Não foi possível entrar. Tente novamente.');
    }
  };

  return (
    <LinearGradient colors={gradients.gradientSage} style={styles.gradient as ViewStyle}>
      <SafeAreaView style={styles.safe as ViewStyle} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboard as ViewStyle}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent as ViewStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.branding as ViewStyle}>
              <View>
                <Ionicons name="leaf" size={44} color={ON_DARK} />
              </View>
              <View>
                <RNText style={styles.logoText as TextStyle}>UpWell</RNText>
              </View>
              <View>
                <RNText style={styles.tagline as TextStyle}>Sua jornada de 90 dias</RNText>
              </View>
            </View>

            <View style={styles.card as ViewStyle}>
              <View>
                <RNText style={styles.title as TextStyle}>Bem-vinda de volta</RNText>
              </View>
              <View>
                <RNText style={styles.subtitle as TextStyle}>Continue sua jornada 🍃</RNText>
              </View>
              <View style={styles.titleGap as ViewStyle} />

              <View>
                <View style={styles.inputWrap as ViewStyle}>
                  <Ionicons name="mail-outline" size={18} color={ON_DARK} style={styles.inputIcon as TextStyle} />
                  <TextInput
                    style={styles.input as TextStyle}
                    placeholder="Email"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {emailError ? (
                  <View style={styles.inlineErrorWrap as ViewStyle}>
                    <Ionicons name="alert-circle-outline" size={14} color={ERROR_COLOR} />
                    <RNText style={styles.inlineErrorText as TextStyle}>{emailError}</RNText>
                  </View>
                ) : null}
              </View>

              <View style={styles.inputGap as ViewStyle} />

              <View>
                <View style={styles.inputWrap as ViewStyle}>
                  <Ionicons name="lock-closed-outline" size={18} color={ON_DARK} style={styles.inputIcon as TextStyle} />
                  <TextInput
                    style={[styles.input, styles.inputPassword] as StyleProp<TextStyle>}
                    placeholder="Senha"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeButton as ViewStyle}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={ON_DARK_SUBTLE} />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <View style={styles.inlineErrorWrap as ViewStyle}>
                    <Ionicons name="alert-circle-outline" size={14} color={ERROR_COLOR} />
                    <RNText style={styles.inlineErrorText as TextStyle}>{passwordError}</RNText>
                  </View>
                ) : null}
              </View>

              <View style={[styles.esqueciWrap as ViewStyle]}>
                <TouchableOpacity onPress={() => setForgotModalVisible(true)} activeOpacity={0.8}>
                  <RNText style={styles.esqueciText as TextStyle}>Esqueci minha senha</RNText>
                </TouchableOpacity>
              </View>

              <View style={[styles.btnWrap as ViewStyle]}>
                <TouchableOpacity onPress={handleEntrar} style={styles.btnEntrar as ViewStyle} activeOpacity={0.8}>
                  <RNText style={styles.btnEntrarText as TextStyle}>Entrar</RNText>
                </TouchableOpacity>
              </View>

              <View style={[styles.dividerWrap as ViewStyle]}>
                <View style={styles.dividerLine as ViewStyle} />
                <RNText style={styles.dividerText as TextStyle}>ou continue com</RNText>
                <View style={styles.dividerLine as ViewStyle} />
              </View>

              <View style={[styles.socialRow as ViewStyle]}>
                <View style={[styles.socialButtonWrap as ViewStyle]}>
                  <TouchableOpacity onPress={() => setSocialModalVisible(true)} style={styles.btnSocial as ViewStyle} activeOpacity={0.8}>
                    <RNText style={styles.googleLetter as TextStyle}>G</RNText>
                    <RNText style={styles.btnSocialText as TextStyle}>Google</RNText>
                  </TouchableOpacity>
                </View>
                <View style={styles.socialGap as ViewStyle} />
                <View style={[styles.socialButtonWrap as ViewStyle]}>
                  <TouchableOpacity onPress={() => setSocialModalVisible(true)} style={styles.btnSocial as ViewStyle} activeOpacity={0.8}>
                    <Ionicons name="logo-apple" size={20} color={ON_DARK} style={styles.appleIcon as TextStyle} />
                    <RNText style={styles.btnSocialText as TextStyle}>Apple</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.footer as ViewStyle]}>
              <RNText style={styles.footerText as TextStyle}>Não tem conta? </RNText>
              <TouchableOpacity onPress={() => router.push('/cadastro')} activeOpacity={0.8}>
                <RNText style={styles.footerLink as TextStyle}>Criar conta</RNText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay as ViewStyle} onPress={() => setForgotModalVisible(false)}>
          <Pressable style={styles.modalBox as ViewStyle} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalText as TextStyle}>Em breve você poderá redefinir sua senha por email.</RNText>
            <TouchableOpacity style={styles.modalBtn as ViewStyle} onPress={() => setForgotModalVisible(false)}>
              <RNText style={styles.modalBtnText as TextStyle}>OK</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={socialModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay as ViewStyle} onPress={() => setSocialModalVisible(false)}>
          <Pressable style={styles.modalBox as ViewStyle} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalText as TextStyle}>Em breve 🌿</RNText>
            <TouchableOpacity style={styles.modalBtn as ViewStyle} onPress={() => setSocialModalVisible(false)}>
              <RNText style={styles.modalBtnText as TextStyle}>OK</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: CARD_MARGIN_H,
    paddingTop: 48,
    paddingBottom: 40,
  },
  branding: {
    alignItems: 'center',
    marginBottom: GAP_24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    color: ON_DARK,
    letterSpacing: 2,
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: ON_DARK_SUBTLE,
    marginTop: 4,
  },
  card: {
    ...CARD_GLASS,
    marginHorizontal: 0,
    marginBottom: GAP_24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: ON_DARK,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: ON_DARK_SUBTLE,
    marginTop: 4,
  },
  titleGap: { height: GAP_24 },
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
  inputPassword: { paddingRight: 8 },
  eyeButton: { padding: 8 },
  inputGap: { height: GAP_12 },
  inlineErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  inlineErrorText: {
    fontSize: 13,
    color: ERROR_COLOR,
  },
  esqueciWrap: { alignItems: 'flex-end', marginBottom: spacing.md },
  esqueciText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: ON_DARK_SUBTLE,
  },
  btnWrap: { marginBottom: spacing.lg },
  btnEntrar: {
    backgroundColor: colors.white,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnEntrarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sageDark,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER_LINE,
  },
  dividerText: {
    fontSize: 13,
    color: ON_DARK_SUBTLE,
    marginHorizontal: 12,
  },
  socialRow: { flexDirection: 'row', alignItems: 'center' },
  socialButtonWrap: { flex: 1 },
  socialGap: { width: GAP_12 },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    height: 48,
  },
  googleLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: ON_DARK,
    marginRight: 8,
  },
  appleIcon: { marginRight: 8 },
  btnSocialText: {
    fontSize: 15,
    fontWeight: '600',
    color: ON_DARK,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  footerText: {
    fontSize: 15,
    color: FOOTER_HINT,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: ON_DARK,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalBtn: {
    backgroundColor: colors.sageDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
