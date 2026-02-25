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
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { colors, gradients } from '@/constants/theme';
import UpWellLogoWhite from '@/components/UpWellLogoWhite';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';

function passwordStrength(pwd: string): 'weak' | 'medium' | 'strong' {
  if (pwd.length < 6) return 'weak';
  const hasNumberOrSymbol = /\d|[^a-zA-Z0-9]/.test(pwd);
  if (pwd.length >= 8 && hasNumberOrSymbol) return 'strong';
  return 'medium';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function CadastroScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const pressBack = usePressScale();
  const pressCriar = usePressScale();
  const pressEntrar = usePressScale();
  const pressTerms = usePressScale();
  const pressFazerLogin = usePressScale();

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

  const strength = passwordStrength(password);

  const handleCriarConta = async () => {
    // validações locais primeiro
    if (!name.trim()) {
      setNameError('Digite seu nome');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setGeneralError('');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Digite um email válido');
      setNameError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setGeneralError('');
      return;
    }
    if (password.length < 6) {
      setPasswordError('A senha precisa ter pelo menos 6 caracteres');
      setNameError('');
      setEmailError('');
      setConfirmPasswordError('');
      setGeneralError('');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      setNameError('');
      setEmailError('');
      setPasswordError('');
      setGeneralError('');
      return;
    }
    if (!acceptTerms) {
      setGeneralError('Aceite os termos para continuar');
      setNameError('');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      return;
    }

    setLoading(true);
    setGeneralError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered') ||
        error.message.includes('email_exists') ||
        error.status === 422
      ) {
        setEmailError('Este email já está cadastrado. Faça login ou use outro email.');
      } else if (error.message.includes('invalid email')) {
        setEmailError('Email inválido. Verifique e tente novamente.');
      } else if (error.message.includes('weak_password') || error.message.includes('Password')) {
        setPasswordError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setGeneralError('Erro ao criar conta. Tente novamente.');
      }
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setEmailError('Este email já está cadastrado. Faça login ou use outro email.');
      setLoading(false);
      return;
    }

    if (!data.user) {
      setGeneralError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
    }

    await AsyncStorage.setItem('temp_name', name.trim());
    router.replace('/(onboarding)/nome');
    setLoading(false);
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
              <Animated.View style={pressBack.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressBack.onPressIn}
                  onPressOut={pressBack.onPressOut}
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  activeOpacity={1}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
              <View style={styles.headerCenter}>
                <UpWellLogoWhite width={180} height={68} />
              </View>
              <View style={styles.backBtn} />
            </Animated.View>

            <Animated.View style={[styles.card, entrance1]}>
              <RNText style={styles.title}>Criar conta</RNText>
              <RNText style={styles.subtitle}>Sua jornada de 90 dias começa aqui 🌿</RNText>
              <View style={styles.spacer} />

              <Animated.View style={entrance2}>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={name}
                    onChangeText={(t) => { setName(t); setNameError(''); }}
                    autoCapitalize="words"
                  />
                </View>
                {nameError ? (
                  <View style={styles.inlineErrorWrap}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                    <RNText style={styles.inlineErrorText}>{nameError}</RNText>
                  </View>
                ) : null}
              </Animated.View>

              <Animated.View style={entrance3}>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu email"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailError ? (
                  <>
                    <View style={styles.inlineErrorWrap}>
                      <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                      <RNText style={styles.inlineErrorText}>{emailError}</RNText>
                    </View>
                    {emailError === 'Este email já está cadastrado. Faça login ou use outro email.' && (
                      <Animated.View style={[styles.linkFazerLoginWrap, pressFazerLogin.animatedStyle]}>
                        <TouchableOpacity
                          onPressIn={pressFazerLogin.onPressIn}
                          onPressOut={pressFazerLogin.onPressOut}
                          onPress={() => router.replace('/login')}
                          style={styles.linkFazerLogin}
                          activeOpacity={0.8}
                        >
                          <RNText style={styles.linkFazerLoginText}>Já tem conta? Fazer login</RNText>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </>
                ) : null}
              </Animated.View>

              <Animated.View style={entrance4}>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    placeholder="Sua senha"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
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
                <View style={styles.strengthWrap}>
                  <View
                    style={[
                      styles.strengthSegment,
                      strength === 'weak' && styles.strengthWeak,
                      strength === 'medium' && styles.strengthMedium,
                      strength === 'strong' && styles.strengthStrong,
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthSegment,
                      strength === 'medium' && styles.strengthMedium,
                      strength === 'strong' && styles.strengthStrong,
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthSegment,
                      strength === 'strong' && styles.strengthStrong,
                    ]}
                  />
                </View>
                {passwordError ? (
                  <View style={styles.inlineErrorWrap}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                    <RNText style={styles.inlineErrorText}>{passwordError}</RNText>
                  </View>
                ) : null}
              </Animated.View>

              <Animated.View style={entrance5}>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    placeholder="Confirme sua senha"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      setConfirmPasswordError('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.8)"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? (
                  <View style={styles.inlineErrorWrap}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                    <RNText style={styles.inlineErrorText}>{confirmPasswordError}</RNText>
                  </View>
                ) : null}
              </Animated.View>

              <Animated.View style={[styles.termsWrap, entrance6]}>
                <Animated.View style={pressTerms.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressTerms.onPressIn}
                    onPressOut={pressTerms.onPressOut}
                    onPress={() => { setAcceptTerms((v) => !v); setGeneralError(''); }}
                    style={styles.termsRow}
                    activeOpacity={1}
                  >
                    <Ionicons
                      name={acceptTerms ? 'checkbox-outline' : 'square-outline'}
                      size={22}
                      color="#FFFFFF"
                      style={styles.termsIcon}
                    />
                    <RNText style={styles.termsText}>
                      Concordo com os{' '}
                      <RNText
                        style={styles.termsLink}
                        onPress={() => setTermsModalVisible(true)}
                      >
                        Termos de Uso e Política de Privacidade
                      </RNText>
                    </RNText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {generalError ? (
                <View style={styles.generalErrorCard}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FFFFFF" style={styles.generalErrorIcon} />
                  <RNText style={styles.generalErrorText}>{generalError}</RNText>
                </View>
              ) : null}

              <Animated.View style={[styles.btnWrap, entrance7]}>
                <Animated.View style={pressCriar.animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressCriar.onPressIn}
                    onPressOut={pressCriar.onPressOut}
                    onPress={handleCriarConta}
                    style={styles.btnCriar}
                    activeOpacity={1}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.sageDark} />
                    ) : (
                      <RNText style={styles.btnCriarText}>Criar conta</RNText>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.footer, entrance8]}>
              <RNText style={styles.footerText}>Já tem conta? </RNText>
              <Animated.View style={pressEntrar.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressEntrar.onPressIn}
                  onPressOut={pressEntrar.onPressOut}
                  onPress={() => router.replace('/login')}
                  activeOpacity={1}
                >
                  <RNText style={styles.footerLink}>Entrar</RNText>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={termsModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setTermsModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalTitle}>Termos de Uso e Política de Privacidade</RNText>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <RNText style={styles.modalText}>
                Este é um texto mockado dos Termos de Uso e Política de Privacidade do UpWell.
                Ao utilizar o aplicativo, você concorda com as condições aqui descritas.
                Seus dados são tratados com segurança e utilizados apenas para melhorar sua experiência.
                Em uma versão futura, os termos completos estarão disponíveis aqui.
              </RNText>
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setTermsModalVisible(false)}>
              <RNText style={styles.modalBtnText}>Fechar</RNText>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 6,
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
  strengthWrap: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 6,
  },
  strengthWeak: { backgroundColor: 'rgba(255,99,99,0.9)' },
  strengthMedium: { backgroundColor: '#E6C229' },
  strengthStrong: { backgroundColor: colors.sageDark },
  termsWrap: { marginBottom: 20 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termsIcon: { marginRight: 10, marginTop: 2 },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  inlineErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
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
  generalErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  generalErrorIcon: {
    marginRight: 8,
  },
  generalErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  linkFazerLoginWrap: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  linkFazerLogin: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkFazerLoginText: {
    fontSize: 13,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  btnWrap: { marginTop: 8 },
  btnCriar: {
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
  btnCriarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sageDark,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  modalScroll: { maxHeight: 280, marginBottom: 16 },
  modalText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
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
