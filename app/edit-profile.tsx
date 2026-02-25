import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import {
  getProfile,
  updateProfile,
  saveWeightRecord,
  type Profile,
} from '@/lib/database';
import { colors, gradients } from '@/constants/theme';
import { usePressScale } from '@/hooks/useEntrance';

type Glp1Status = 'using' | 'used' | 'never';

const GLP1_OPTIONS: { value: Glp1Status; label: string }[] = [
  { value: 'using', label: 'Uso atualmente' },
  { value: 'used', label: 'Já usei' },
  { value: 'never', label: 'Não uso' },
];

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export default function EditProfileScreen() {
  const router = useRouter();
  const pressSave = usePressScale();
  const pressBack = usePressScale();
  const pressNewWeight = usePressScale();
  const pressAdvanced = usePressScale();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [glp1Status, setGlp1Status] = useState<Glp1Status>('never');

  const [showAdvancedWeight, setShowAdvancedWeight] = useState(false);
  const [advancedWeightValue, setAdvancedWeightValue] = useState('');
  const [advancedWeightDirty, setAdvancedWeightDirty] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setName(p.name ?? '');
        setGlp1Status((p.glp1_status as Glp1Status) ?? 'never');
        if (p.weight_initial != null) {
          setAdvancedWeightValue(String(p.weight_initial));
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      setLoading(false);
    })();
  }, []);

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToastVisible(false);
      router.back();
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name: name.trim(), glp1_status: glp1Status });
    if (advancedWeightDirty) {
      const parsed = parseFloat(advancedWeightValue.replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        await updateProfile({ weight_initial: parsed });
        await saveWeightRecord({ weight: parsed, notes: 'Correção do peso inicial' });
      }
    }
    setSaving(false);
    showToast();
  };

  const handleCancelAdvanced = () => {
    setShowAdvancedWeight(false);
    setAdvancedWeightDirty(false);
    if (profile?.weight_initial != null) {
      setAdvancedWeightValue(String(profile.weight_initial));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sageDark} />
        </View>
      </SafeAreaView>
    );
  }

  const weightInitialDisplay =
    profile?.weight_initial != null && profile.weight_initial > 0
      ? `${profile.weight_initial.toFixed(1)}`
      : '—';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedReanimated.View style={pressBack.animatedStyle}>
          <TouchableOpacity
            onPressIn={pressBack.onPressIn}
            onPressOut={pressBack.onPressOut}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </AnimatedReanimated.View>
        <RNText style={styles.headerTitle}>Editar perfil</RNText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Card campos editáveis */}
          <View style={styles.card}>
            {/* Nome */}
            <RNText style={styles.fieldLabel}>Nome</RNText>
            <TextInput
              style={[styles.input, nameFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="Seu nome"
              placeholderTextColor="#BDBDBD"
              returnKeyType="done"
            />

            <View style={styles.divider} />

            {/* GLP-1 */}
            <RNText style={styles.fieldLabel}>Status GLP-1</RNText>
            <View style={styles.chipsRow}>
              {GLP1_OPTIONS.map(opt => {
                const isSelected = glp1Status === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setGlp1Status(opt.value)}
                    activeOpacity={0.7}>
                    <RNText style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {opt.label}
                    </RNText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Email — não editável */}
            <RNText style={styles.fieldLabel}>Email</RNText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />
            <RNText style={styles.fieldHint}>Não pode ser alterado</RNText>

            <View style={styles.divider} />

            {/* Data de início — não editável */}
            <RNText style={styles.fieldLabel}>Data de início</RNText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile?.program_start_date ? formatDate(profile.program_start_date) : '—'}
              editable={false}
              selectTextOnFocus={false}
            />
            <RNText style={styles.fieldHint}>Não pode ser alterada</RNText>
          </View>

          {/* Card peso inicial */}
          <View style={styles.weightCard}>
            <RNText style={styles.weightTitle}>Peso inicial</RNText>
            <RNText style={styles.weightValue}>{weightInitialDisplay} kg</RNText>
            <RNText style={styles.weightWarning}>
              ⚠️ O peso inicial é sua referência de partida e não deve ser editado. Para registrar
              seu peso atual, use a função &apos;Registrar peso&apos; na tela inicial.
            </RNText>

            <AnimatedReanimated.View style={pressNewWeight.animatedStyle}>
              <TouchableOpacity
                onPressIn={pressNewWeight.onPressIn}
                onPressOut={pressNewWeight.onPressOut}
                onPress={() => {
                  router.back();
                  router.push('/(tabs)');
                }}
                style={styles.newWeightBtn}
                activeOpacity={0.8}>
                <RNText style={styles.newWeightBtnText}>Registrar novo peso</RNText>
              </TouchableOpacity>
            </AnimatedReanimated.View>

            {!showAdvancedWeight ? (
              <AnimatedReanimated.View style={pressAdvanced.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressAdvanced.onPressIn}
                  onPressOut={pressAdvanced.onPressOut}
                  onPress={() => setShowAdvancedWeight(true)}
                  style={styles.advancedToggle}>
                  <RNText style={styles.advancedToggleText}>
                    Editar peso inicial (avançado)
                  </RNText>
                </TouchableOpacity>
              </AnimatedReanimated.View>
            ) : (
              <View style={styles.advancedContainer}>
                <View style={styles.advancedWarningBox}>
                  <RNText style={styles.advancedWarningText}>
                    Atenção: isso recalcula toda sua evolução no gráfico. Faça isso apenas se
                    digitou o valor errado no início.
                  </RNText>
                </View>
                <TextInput
                  style={styles.advancedInput}
                  value={advancedWeightValue}
                  onChangeText={v => {
                    setAdvancedWeightValue(v);
                    setAdvancedWeightDirty(true);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 82.5"
                  placeholderTextColor="#BDBDBD"
                />
                <View style={styles.advancedBtns}>
                  <TouchableOpacity
                    style={styles.advancedCancelBtn}
                    onPress={handleCancelAdvanced}
                    activeOpacity={0.8}>
                    <RNText style={styles.advancedCancelText}>Cancelar</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.advancedConfirmBtn}
                    onPress={() => setShowAdvancedWeight(false)}
                    activeOpacity={0.8}>
                    <RNText style={styles.advancedConfirmText}>Confirmar</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Botão salvar */}
          <AnimatedReanimated.View style={[styles.saveWrapper, pressSave.animatedStyle]}>
            <TouchableOpacity
              onPressIn={pressSave.onPressIn}
              onPressOut={pressSave.onPressOut}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.9}>
              <LinearGradient colors={gradients.gradientSage} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <RNText style={styles.saveBtnText}>Salvar alterações</RNText>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedReanimated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <RNText style={styles.toastText}>Perfil atualizado ✓</RNText>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAFAF8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE8',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  // Card principal
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: colors.sageDark,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#BDBDBD',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EDE8',
    marginVertical: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#EBF3EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.sageDark,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.sageDark,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Card peso
  weightCard: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F0D4C8',
    borderRadius: 20,
    padding: 20,
  },
  weightTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.sageDark,
    marginBottom: 8,
  },
  weightWarning: {
    fontSize: 13,
    color: '#C4846A',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  newWeightBtn: {
    borderWidth: 1.5,
    borderColor: '#C4846A',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newWeightBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C4846A',
  },
  advancedToggle: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  advancedToggleText: {
    fontSize: 13,
    color: '#6B6B6B',
    textDecorationLine: 'underline',
  },
  advancedContainer: {
    marginTop: 12,
  },
  advancedWarningBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  advancedWarningText: {
    fontSize: 13,
    color: '#C0392B',
    lineHeight: 18,
  },
  advancedInput: {
    borderWidth: 1,
    borderColor: '#C4846A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  advancedBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  advancedCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  advancedCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B',
  },
  advancedConfirmBtn: {
    flex: 1,
    backgroundColor: '#C4846A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  advancedConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Salvar
  saveWrapper: {
    marginTop: 8,
  },
  saveBtn: {
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.sageDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: colors.sageDark,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
