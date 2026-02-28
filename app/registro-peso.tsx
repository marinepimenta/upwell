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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(RNText);
import {
  saveWeightRecord,
  getLastWeightRecord,
  getWeightRecords,
  updateProfile,
  getProfile,
  type WeightRecordRow,
  type Profile,
} from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { publishAchievement } from '@/lib/community';
import { colors } from '@/constants/theme';

const contextOptions = [
  { id: 'jejum', label: 'Manhã em jejum', icon: 'sunny-outline' as const },
  { id: 'refeicao', label: 'Após refeição', icon: 'restaurant-outline' as const },
  { id: 'treino', label: 'Após treino', icon: 'barbell-outline' as const },
  { id: 'noite', label: 'À noite', icon: 'moon-outline' as const },
];

const frequencyOptions = [
  { id: 'Semanalmente', label: 'Semanalmente', subtitle: 'Todo sábado de manhã' },
  { id: 'Quinzenalmente', label: 'Quinzenalmente', subtitle: 'A cada 15 dias' },
  { id: 'Mensalmente', label: 'Mensalmente', subtitle: 'Uma vez por mês' },
];

const cardStyle = {
  backgroundColor: '#FFFFFF' as const,
  borderRadius: 20,
  padding: 20,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export default function RegistroPesoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [weight, setWeight] = useState('');
  const [context, setContext] = useState<'jejum' | 'refeicao' | 'treino' | 'noite'>('jejum');
  const [frequency, setFrequency] = useState('Semanalmente');
  const [notes, setNotes] = useState('');
  const [lastRecord, setLastRecord] = useState<WeightRecordRow | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecordRow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getLastWeightRecord(), getWeightRecords(), getProfile()]).then(([last, all, p]) => {
      setLastRecord(last ?? null);
      setWeightRecords((all || []).slice().reverse());
      setProfile(p ?? null);
    });
  }, []);

  const lastWeight = lastRecord;
  const diasDesdeUltimaPesagem = lastRecord
    ? Math.floor(
        (new Date().getTime() - new Date(lastRecord.date + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const handleSave = async () => {
    if (!weight || parseFloat(weight) <= 0) return;
    if (parseFloat(weight) < 30 || parseFloat(weight) > 300) {
      Alert.alert('Peso inválido', 'Digite um peso entre 30 e 300 kg.');
      return;
    }

    setLoading(true);
    const contextLabel = contextOptions.find((o) => o.id === context)?.label ?? context;

    const { error } = await saveWeightRecord({
      weight: parseFloat(weight),
      context: contextLabel,
      notes: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      console.log('Tentando salvar peso:', {
        weight: parseFloat(weight),
        context: contextLabel,
        notes: notes.trim() || null,
        user: (await supabase.auth.getUser()).data.user?.id,
      });
      Alert.alert('Erro ao salvar', 'Não foi possível salvar seu peso. Tente novamente.');
      console.error(error);
      return;
    }

    await updateProfile({ weigh_frequency: frequency });
    await publishAchievement('weight_registered');
    setSuccess(true);
  };

  const handleSelectFrequency = (value: string) => {
    setFrequency(value);
    updateProfile({ weigh_frequency: value });
  };

  if (success) {
    const variacaoTotal = profile?.weight_initial
      ? (parseFloat(weight) - parseFloat(String(profile.weight_initial))).toFixed(1)
      : null;

    return (
      <LinearGradient
        colors={['#5C7A5C', '#8FAF8F']}
        style={styles.gradientSuccess}
      >
        <View style={styles.successInner}>
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={styles.successCircle}
          >
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </Animated.View>

          <AnimatedText
            entering={FadeInDown.delay(200)}
            style={styles.successTitle}
          >
            Pesagem registrada
          </AnimatedText>

          {variacaoTotal != null && parseFloat(variacaoTotal) < 0 && (
            <Animated.View
              entering={FadeInDown.delay(350)}
              style={styles.successVariacaoCard}
            >
              <Ionicons name="trending-down" size={22} color="#FFFFFF" />
              <View>
                <RNText style={styles.successVariacaoValue}>
                  {Math.abs(parseFloat(variacaoTotal)).toFixed(1)} kg
                </RNText>
                <RNText style={styles.successVariacaoLabel}>
                  perdidos desde o início
                </RNText>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500)} style={styles.successActions}>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/progresso')}
              style={styles.successBtnOutline}
              activeOpacity={0.8}
            >
              <RNText style={styles.successBtnText}>Ver meu progresso</RNText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.successBtnGhost}
              activeOpacity={0.8}
            >
              <RNText style={styles.successBtnGhostText}>Voltar para o início</RNText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5C7A5C', '#8FAF8F']}
        style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <RNText style={styles.headerTitle}>Registrar peso</RNText>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Seção 1: Input de peso */}
          <Animated.View entering={FadeInDown.delay(0).duration(350)} style={cardStyle}>
            <RNText style={styles.sectionLabel}>Seu peso hoje</RNText>
            <View style={styles.weightRow}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor="#BDBDBD"
                style={styles.weightInput}
                maxLength={6}
              />
              <RNText style={styles.weightUnit}>kg</RNText>
            </View>
            {lastWeight && (
              <RNText style={styles.lastWeighText}>
                Última pesagem: {lastWeight.weight} kg · há {diasDesdeUltimaPesagem} dias
              </RNText>
            )}
            {weight && lastWeight && (() => {
              const diff = parseFloat(weight) - Number(lastWeight.weight);
              if (Math.abs(diff) < 0.05) return null;
              const isDown = diff < 0;
              return (
                <View style={styles.variacaoRow}>
                  <Ionicons
                    name={isDown ? 'trending-down' : 'trending-up'}
                    size={18}
                    color={isDown ? '#5C7A5C' : '#C4846A'}
                  />
                  <RNText style={[styles.variacaoText, { color: isDown ? '#5C7A5C' : '#C4846A' }]}>
                    {Math.abs(diff).toFixed(1)} kg desde a última pesagem
                  </RNText>
                </View>
              );
            })()}
          </Animated.View>

          {/* Seção 2: Contexto */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)} style={cardStyle}>
            <RNText style={styles.sectionTitle}>Quando você se pesou?</RNText>
            <View style={styles.chipsRow}>
              {contextOptions.map((opt) => {
                const selected = context === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setContext(opt.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={opt.icon} size={16} color={selected ? '#FFFFFF' : '#5C7A5C'} />
                    <RNText style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {opt.label}
                    </RNText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Seção 3: Frequência */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)} style={cardStyle}>
            <RNText style={styles.sectionTitle}>Com que frequência quer se pesar?</RNText>
            <RNText style={styles.sectionSubtitle}>Vamos te lembrar no momento certo</RNText>
            <View style={styles.freqList}>
              {frequencyOptions.map((opt) => {
                const selected = frequency === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleSelectFrequency(opt.id)}
                    style={[styles.freqRow, selected && styles.freqRowSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.freqRowLeft}>
                      <RNText style={styles.freqRowTitle}>{opt.label}</RNText>
                      <RNText style={styles.freqRowSubtitle}>{opt.subtitle}</RNText>
                    </View>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Seção 4: Observação */}
          <Animated.View entering={FadeInDown.delay(240).duration(350)} style={cardStyle}>
            <RNText style={styles.sectionTitle}>Quer registrar algo?</RNText>
            <RNText style={styles.sectionSubtitle}>Opcional — contexto ajuda a entender variações</RNText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Ex: viajei esse fim de semana, ciclo menstrual..."
              placeholderTextColor="#8FAF8F"
              style={styles.notesInput}
              textAlignVertical="top"
              onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
            />
          </Animated.View>

          {/* Seção 5: Histórico recente */}
          <Animated.View entering={FadeInDown.delay(320).duration(350)} style={cardStyle}>
            <RNText style={styles.historyTitle}>Histórico recente</RNText>
            {weightRecords.length === 0 ? (
              <RNText style={styles.historyEmpty}>Nenhuma pesagem registrada ainda.</RNText>
            ) : (
              weightRecords.slice(0, 5).reverse().map((record, index, arr) => {
                const prev = arr[index + 1];
                const diff = prev ? Number(record.weight) - Number(prev.weight) : null;
                const [y, m, d] = record.date.split('-').map(Number);
                const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                const dateLabel = `${d} ${meses[m - 1]}`;

                return (
                  <View key={record.id} style={styles.timelineRow}>
                    <View style={styles.timelineDotWrap}>
                      <View style={styles.timelineDot} />
                      {index < arr.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineRow2}>
                        <RNText style={styles.timelineDate}>{dateLabel}</RNText>
                        <RNText style={styles.timelineWeight}>{record.weight} kg</RNText>
                        {record.context && (
                          <View style={styles.timelineChip}>
                            <RNText style={styles.timelineChipText}>{record.context}</RNText>
                          </View>
                        )}
                      </View>
                      {diff !== null && (
                        <View style={styles.timelineDiffRow}>
                          <Ionicons
                            name={diff <= 0 ? 'trending-down' : 'trending-up'}
                            size={14}
                            color={diff <= 0 ? '#5C7A5C' : '#C4846A'}
                          />
                          <RNText style={[styles.timelineDiffText, { color: diff <= 0 ? '#5C7A5C' : '#C4846A' }]}>
                            {Math.abs(diff).toFixed(1)} kg
                          </RNText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom action bar fixo */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!weight || loading}
            style={{ opacity: !weight ? 0.4 : 1 }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#5C7A5C', '#8FAF8F']}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="scale-outline" size={20} color="#FFFFFF" />
              <RNText style={styles.saveBtnText}>
                {loading ? 'Salvando...' : 'Salvar pesagem'}
              </RNText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  keyboard: { flex: 1 },
  header: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: { position: 'absolute', left: 0, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 15,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  weightInput: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1A1A1A',
    minWidth: 100,
    textAlign: 'center',
    paddingVertical: 0,
  },
  weightUnit: { fontSize: 24, color: '#6B6B6B', marginBottom: 8 },
  lastWeighText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
  },
  variacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  variacaoText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 },
  sectionSubtitle: { fontSize: 13, color: '#6B6B6B', marginBottom: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EBF3EB',
  },
  chipSelected: { backgroundColor: '#5C7A5C' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#5C7A5C' },
  chipTextSelected: { color: '#FFFFFF' },
  freqList: { gap: 10 },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#BDBDBD',
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
    backgroundColor: '#EBF3EB',
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    fontSize: 15,
    color: '#1A1A1A',
  },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  historyEmpty: { fontSize: 14, color: '#6B6B6B', fontStyle: 'italic' },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineDotWrap: { alignItems: 'center', paddingTop: 4 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5C7A5C',
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(92,122,92,0.3)',
    marginTop: 4,
  },
  timelineContent: { flex: 1, paddingBottom: 10 },
  timelineRow2: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timelineDate: { fontSize: 13, color: '#6B6B6B' },
  timelineWeight: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  timelineChip: {
    backgroundColor: '#EBF3EB',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timelineChipText: { fontSize: 11, color: '#5C7A5C' },
  timelineDiffRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timelineDiffText: { fontSize: 13, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtnGradient: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  gradientSuccess: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successInner: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  successVariacaoCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    width: '100%',
  },
  successVariacaoValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  successVariacaoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  successActions: { width: '100%', gap: 12 },
  successBtnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successBtnGhost: { alignItems: 'center', padding: 12 },
  successBtnGhostText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
});
