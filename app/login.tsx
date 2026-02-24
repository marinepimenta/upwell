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
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';

const USER_LOGGED_IN_KEY = '@upwell:user_logged_in';
const USER_EMAIL_KEY = '@upwell:user_email';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [appleModalVisible, setAppleModalVisible] = useState(false);

  const pressEntrar = usePressScale();
  const pressEsqueci = usePressScale();
  const pressGoogle = usePressScale();
  const pressApple = usePressScale();
  const pressCriarConta = usePressScale();

  const entrance0 = useFadeSlideIn(0);
  const entrance1 = useFadeSlideIn(80);
  const entrance2 = useFadeSlideIn(160);
  const entrance3 = useFadeSlideIn(240);
  const entrance4 = useFadeSlideIn(320);
  const entrance5 = useFadeSlideIn(400);
  const entrance6 = useFadeSlideIn(480);
  const entrance7 = useFadeSlideIn(560);
  const entrance8 = useFadeSlideIn(640);
  const entrance9 = useFadeSlideIn(720);

  const handleEntrar = async () => {
    setError('');
    if (!email.trim()) {
      setError('Preencha seu email.');
      return;
    }
    if (!password.trim()) {
      setError('Preencha sua senha.');
      return;
    }
    try {
      await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
      await AsyncStorage.setItem(USER_EMAIL_KEY, email.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError('Não foi possível entrar. Tente novamente.');
    }
  };

  return (
    <LinearGradient colors={gradients.gradientSage} style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={['top']}>
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
            <Animated.View style={[styles.header, entrance0]}>
              <Ionicons name="leaf" size={40} color="#FFFFFF" />
              <RNText style={styles.logoText}>UpWell</RNText>
            </Animated.View>

            <Animated.View style={[styles.card, entrance1]}>
              <RNText style={styles.title}>Bem-vinda de volta</RNText>
              <RNText style={styles.subtitle}>Continue sua jornada 🌿</RNText>
              <View style={styles.spacer} />

              <Animated.View style={entrance2}>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu email"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </Animated.View>

              <Animated.View style={entrance3}>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    placeholder="Sua senha"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.8)"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={[styles.esqueciWrap, entrance4]}>
                <Animated.View style={pressEsqueci.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressEsqueci.onPressIn}
                    onPressOut={pressEsqueci.onPressOut}
                    onPress={() => setForgotModalVisible(true)}
                    activeOpacity={1}
                  >
                    <RNText style={styles.esqueciText}>Esqueci minha senha</RNText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {error ? <RNText style={styles.errorText}>{error}</RNText> : null}

              <Animated.View style={[styles.btnWrap, entrance5]}>
                <Animated.View style={pressEntrar.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressEntrar.onPressIn}
                    onPressOut={pressEntrar.onPressOut}
                    onPress={handleEntrar}
                    style={styles.btnEntrar}
                    activeOpacity={1}
                  >
                    <RNText style={styles.btnEntrarText}>Entrar</RNText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <RNText style={styles.dividerText}>ou continue com</RNText>
                <View style={styles.dividerLine} />
              </View>

              <Animated.View style={[styles.socialWrap, entrance6]}>
                <Animated.View style={pressGoogle.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressGoogle.onPressIn}
                    onPressOut={pressGoogle.onPressOut}
                    onPress={() => setGoogleModalVisible(true)}
                    style={styles.btnSocial}
                    activeOpacity={1}
                  >
                    <RNText style={styles.googleIcon}>G</RNText>
                    <RNText style={styles.btnSocialText}>Continuar com Google</RNText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              <Animated.View style={[styles.socialWrap, entrance7]}>
                <Animated.View style={pressApple.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressApple.onPressIn}
                    onPressOut={pressApple.onPressOut}
                    onPress={() => setAppleModalVisible(true)}
                    style={styles.btnSocial}
                    activeOpacity={1}
                  >
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.appleIcon} />
                    <RNText style={styles.btnSocialText}>Continuar com Apple</RNText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.footer, entrance8]}>
              <RNText style={styles.footerText}>Não tem conta? </RNText>
              <Animated.View style={pressCriarConta.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressCriarConta.onPressIn}
                  onPressOut={pressCriarConta.onPressOut}
                  onPress={() => router.push('/cadastro')}
                  activeOpacity={1}
                >
                  <RNText style={styles.footerLink}>Criar conta</RNText>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setForgotModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalText}>
              Em breve você poderá redefinir sua senha por email.
            </RNText>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setForgotModalVisible(false)}>
              <RNText style={styles.modalBtnText}>OK</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={googleModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setGoogleModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalText}>Login com Google será ativado em breve.</RNText>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setGoogleModalVisible(false)}>
              <RNText style={styles.modalBtnText}>OK</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={appleModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAppleModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalText}>Login com Apple será ativado em breve.</RNText>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setAppleModalVisible(false)}>
              <RNText style={styles.modalBtnText}>OK</RNText>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  spacer: { height: 24 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputPassword: { paddingRight: 8 },
  eyeButton: { padding: 8 },
  esqueciWrap: { alignItems: 'flex-end', marginBottom: 16 },
  esqueciText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255,99,99,0.9)',
    marginBottom: 12,
  },
  btnWrap: { marginBottom: 20 },
  btnEntrar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
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
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 12,
  },
  socialWrap: { marginBottom: 12 },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    height: 52,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 10,
  },
  appleIcon: { marginRight: 10 },
  btnSocialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
