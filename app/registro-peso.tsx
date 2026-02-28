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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import {
  saveWeightRecord,
  getLastWeightRecord,
  getWeightRecords,
  updateProfile,
  getProfile,
  type WeightRecordRow,
  type Profile,
} from '@/lib/database';
import { scheduleWeightReminder, saveNotificationToHistory } from '@/lib/notifications';
import { publishAchievement } from '@/lib/community';
import { supabase } from '@/lib/supabase';
import { formatDateBRT, formatDateShortBRT } from '@/lib/utils';
import { colors, gradients, shadows } from '@/constants/theme';
import { usePressScale, useFadeSlideIn } from '@/hooks/useEntrance';

const CONTEXT_OPTIONS = [
  '☀️ Manhã em jejum',
  '🍽️ Após refeição',
  '🏋️ Após treino',
  '🌙 À noite',
];

const FREQUENCY_OPTIONS: { value: string; title: string; subtitle: string }[] = [
  { value: 'Semanalmente', title: 'Semanalmente', subtitle: 'Todo sábado de manhã' },
  { value: 'Quinzenalmente', title: 'Quinzenalmente', subtitle: 'A cada 15 dias' },
  { value: 'Mensalmente', title: 'Mensalmente', subtitle: 'Uma vez por mês' },
];

export default function RegistroPesoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [weight, setWeight] = useState('');
  const [context, setContext] = useState('☀️ Manhã em jejum');
  const [frequency, setFrequency] = useState('Semanalmente');
  const [notes, setNotes] = useState('');
  const [lastRecord, setLastRecord] = useState<WeightRecordRow | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecordRow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuccessBtn, setShowSuccessBtn] = useState(false);

  const entranceSuccess = useFadeSlideIn(150);
  const pressChip0 = usePressScale();
  const pressChip1 = usePressScale();
  const pressChip2 = usePressScale();
  const pressChip3 = usePressScale();
  const pressFreq0 = usePressScale();
  const pressFreq1 = usePressScale();
  const pressFreq2 = usePressScale();
  const pressChips = [pressChip0, pressChip1, pressChip2, pressChip3];
  const pressFreqs = [pressFreq0, pressFreq1, pressFreq2];

  useEffect(() => {
    Promise.all([getLastWeightRecord(), getWeightRecords(), getProfile()]).then(([last, all, p]) => {
      setLastRecord(last ?? null);
      setWeightRecords((all || []).slice().reverse());
      setProfile(p ?? null);
    });
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setShowSuccessBtn(true), 1000);
    return () => clearTimeout(t);
  }, [success]);

  const variacao =
    lastRecord && weight && !Number.isNaN(parseFloat(weight))
      ? (parseFloat(weight) - parseFloat(String(lastRecord.weight))).toFixed(1)
      : null;
  const diasDesdeUltima = lastRecord
    ? Math.floor(
        (new Date().getTime() - new Date(lastRecord.date + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const variacaoInicio =
    profile?.weight_initial != null &&
    weight &&
    !Number.isNaN(parseFloat(weight))
      ? (parseFloat(weight) - parseFloat(String(profile.weight_initial))).toFixed(1)
      : null;

  const handleSave = async () => {
    if (!weight || parseFloat(weight) <= 0) return;
    if (parseFloat(weight) < 30 || parseFloat(weight) > 300) {
      Alert.alert('Peso inválido', 'Digite um peso entre 30 e 300 kg.');
      return;
    }

    setLoading(true);

    const { error } = await saveWeightRecord({
      weight: parseFloat(weight),
      context,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (error) {
      console.log('Tentando salvar peso:', {
        weight: parseFloat(weight),
        context,
        notes: notes.trim() || null,
        user: (await supabase.auth.getUser()).data.user?.id,
      });
      Alert.alert('Erro ao salvar', 'Não foi possível salvar seu peso. Tente novamente.');
      console.error(error);
      return;
    }

    await updateProfile({ weigh_frequency: frequency });
    const days = frequency === 'Semanalmente' ? 7 : frequency === 'Quinzenalmente' ? 15 : 30;
    await scheduleWeightReminder(days);
    await saveNotificationToHistory('peso', 'Peso registrado ✓', `${parseFloat(weight)} kg registrado hoje.`);
    await publishAchievement('weight_registered');
    setSuccess(true);
  };

  const handleSelectFrequency = (value: string) => {
    setFrequency(value);
    updateProfile({ weigh_frequency: value });
  };

  if (success) {
    const variacaoNum = variacaoInicio != null ? parseFloat(variacaoInicio) : null;
    return (
      <LinearGradient colors={gradients.gradientSage} style={styles.gradientSuccess}>
        <View style={[styles.successInner, { paddingTop: insets.top + 60 }]}>
          <Animated.View style={[styles.successCircle, entranceSuccess]}>
            <View style={styles.successCircleInner}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
          </Animated.View>
          <RNText style={styles.successTitle}>Pesagem registrada! 🎉</RNText>
          {variacaoNum != null && variacaoNum < 0 && (
            <RNText style={styles.successSubtitle}>
              ▼ {Math.abs(variacaoNum)} kg desde o início do programa 🌿
            </RNText>
          )}
          {variacaoNum != null && variacaoNum >= 0 && (
            <RNText style={styles.successSubtitle}>
              Lembre-se: variações são normais 💚
            </RNText>
          )}
          {variacaoNum == null && (
            <RNText style={styles.successSubtitle}>Seu histórico está sendo construído 🌱</RNText>
          )}
          {showSuccessBtn && (
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/progresso')}
              style={styles.successBtn}
              activeOpacity={0.8}
            >
              <RNText style={styles.successBtnText}>Ver meu progresso</RNText>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.gradientSage}
        style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 16 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <RNText style={styles.headerTitle}>Registrar peso</RNText>
        <View style={styles.headerRight} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card peso */}
          <View style={styles.cardMain}>
            <RNText style={styles.cardMainLabel}>Seu peso hoje</RNText>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                placeholderTextColor="#BDBDBD"
                keyboardType="decimal-pad"
                maxLength={6}
              />
              <RNText style={styles.weightUnit}>kg</RNText>
            </View>
            {variacao != null && parseFloat(variacao) < 0 && (
              <RNText style={styles.variacaoDown}>▼ {Math.abs(parseFloat(variacao))} kg desde a última pesagem</RNText>
            )}
            {variacao != null && parseFloat(variacao) > 0 && (
              <RNText style={styles.variacaoUp}>▲ {variacao} kg</RNText>
            )}
            {variacao != null && parseFloat(variacao) === 0 && (
              <RNText style={styles.variacaoDown}>Peso estável desde a última pesagem</RNText>
            )}
            {lastRecord && (
              <RNText style={styles.lastWeighText}>
                Última pesagem: {String(lastRecord.weight)} kg · há {diasDesdeUltima} {diasDesdeUltima === 1 ? 'dia' : 'dias'}
              </RNText>
            )}
          </View>

          {/* Card contexto */}
          <View style={styles.card}>
            <RNText style={styles.cardTitle}>Quando você se pesou?</RNText>
            <View style={styles.chipsRow}>
              {CONTEXT_OPTIONS.map((opt, i) => (
                <Animated.View key={opt} style={pressChips[i].animatedStyle}>
                  <TouchableOpacity
                    onPressIn={pressChips[i].onPressIn}
                    onPressOut={pressChips[i].onPressOut}
                    onPress={() => setContext(opt)}
                    style={[styles.chip, context === opt && styles.chipSelected]}
                    activeOpacity={1}
                  >
                    <RNText style={[styles.chipText, context === opt && styles.chipTextSelected]}>
                      {opt}
                    </RNText>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Card frequência */}
          <View style={styles.card}>
            <RNText style={styles.cardTitle}>Com que frequência quer se pesar?</RNText>
            <RNText style={styles.cardSubtitle}>Vamos te lembrar no momento certo 💚</RNText>
            {FREQUENCY_OPTIONS.map((opt, i) => (
              <Animated.View key={opt.value} style={[pressFreqs[i].animatedStyle, { marginBottom: i < FREQUENCY_OPTIONS.length - 1 ? 10 : 0 }]}>
                <TouchableOpacity
                  onPressIn={pressFreqs[i].onPressIn}
                  onPressOut={pressFreqs[i].onPressOut}
                  onPress={() => handleSelectFrequency(opt.value)}
                  style={[
                    styles.freqRow,
                    frequency === opt.value && styles.freqRowSelected,
                  ]}
                  activeOpacity={1}
                >
                  <View style={styles.freqRowLeft}>
                    <RNText style={styles.freqRowTitle}>{opt.title}</RNText>
                    <RNText style={styles.freqRowSubtitle}>{opt.subtitle}</RNText>
                  </View>
                  <View style={[styles.radioOuter, frequency === opt.value && styles.radioOuterSelected]}>
                    {frequency === opt.value && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Card observação */}
          <View style={styles.card}>
            <RNText style={styles.cardTitle}>Quer registrar algo?</RNText>
            <RNText style={styles.cardSubtitle}>Opcional — contexto ajuda a entender variações</RNText>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex: viajei esse fim de semana, ciclo menstrual..."
              placeholderTextColor="#8FAF8F"
              multiline
              onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
            />
          </View>

          {/* Histórico recente */}
          <View style={styles.card}>
            <RNText style={styles.historyTitle}>Histórico recente</RNText>
            {weightRecords.length === 0 ? (
              <RNText style={styles.historyEmpty}>Nenhuma pesagem registrada ainda 🌱</RNText>
            ) : (
              weightRecords.slice(0, 5).map((record, index) => {
                const prev = weightRecords[index + 1];
                const diff =
                  prev
                    ? (parseFloat(String(record.weight)) - parseFloat(String(prev.weight))).toFixed(1)
                    : null;
                return (
                  <View key={record.id} style={styles.timelineRow}>
                    <View style={styles.timelineDotLine}>
                      <View style={styles.timelineDot} />
                      {index < Math.min(5, weightRecords.length) - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <RNText style={styles.timelineDate}>{formatDateShortBRT(record.date)}</RNText>
                      <View style={styles.timelineRow2}>
                        <RNText style={styles.timelineWeight}>{record.weight} kg</RNText>
                        {record.context && (
                          <View style={styles.timelineChip}>
                            <RNText style={styles.timelineChipText}>{record.context}</RNText>
                          </View>
                        )}
                      </View>
                      {diff != null && (
                        <RNText
                          style={
                            parseFloat(diff) <= 0 ? styles.timelineDiffDown : styles.timelineDiffUp
                          }
                        >
                          {parseFloat(diff) <= 0 ? '▼' : '▲'} {Math.abs(parseFloat(diff))} kg
                        </RNText>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Bottom bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={!weight || loading}
            style={[styles.saveBtnWrap, (!weight || loading) && styles.saveBtnDisabled]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.gradientSage}
              style={[StyleSheet.absoluteFill, styles.saveBtnGradient]}
            />
            {loading ? (
              <RNText style={styles.saveBtnText}>Salvando...</RNText>
            ) : (
              <>
                <Ionicons name="scale-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <RNText style={styles.saveBtnText}>Salvar pesagem</RNText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBack: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  cardMain: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    ...shadows.card,
  },
  cardMainLabel: {
    fontSize: 15,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 12,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  weightInput: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingVertical: 0,
    minWidth: 80,
    textAlign: 'center',
  },
  weightUnit: { fontSize: 24, color: '#6B6B6B', marginLeft: 4 },
  variacaoDown: { fontSize: 14, fontWeight: '700', color: '#5C7A5C', textAlign: 'center' },
  variacaoUp: { fontSize: 14, fontWeight: '700', color: '#C4846A', textAlign: 'center' },
  lastWeighText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  cardSubtitle: { fontSize: 13, color: '#6B6B6B', marginBottom: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#EBF3EB',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: { backgroundColor: '#5C7A5C' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#5C7A5C' },
  chipTextSelected: { color: '#FFFFFF' },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  freqRowSelected: {
    borderWidth: 1.5,
    borderColor: '#5C7A5C',
    backgroundColor: '#F5F8F5',
  },
  freqRowLeft: { flex: 1 },
  freqRowTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  freqRowSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8DEC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#5C7A5C' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C7A5C',
  },
  notesInput: {
    minHeight: 80,
    backgroundColor: '#EBF3EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  historyTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  historyEmpty: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', paddingVertical: 24 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineDotLine: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5C7A5C',
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    width: 2,
    flex: 1,
    height: 40,
    backgroundColor: '#C8DEC8',
  },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 16 },
  timelineDate: { fontSize: 13, color: '#6B6B6B', marginBottom: 2 },
  timelineRow2: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  timelineWeight: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  timelineChip: {
    backgroundColor: '#EBF3EB',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  timelineChipText: { fontSize: 12, color: '#5C7A5C' },
  timelineDiffDown: { fontSize: 13, color: '#5C7A5C', marginTop: 2 },
  timelineDiffUp: { fontSize: 13, color: '#C4846A', marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE8',
  },
  saveBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGradient: { borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  gradientSuccess: { flex: 1 },
  successInner: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCircleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  successSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 24 },
  successBtn: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  successBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
