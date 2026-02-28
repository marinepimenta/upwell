import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text as RNText,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';
import {
  saveCheckin as saveCheckinStorage,
  getShieldUsedThisWeek,
  setShieldUsedThisWeek,
  type CheckinData,
  type AdesaoAlimentar,
  type HumorCheckin,
  type ContextoAlimentar,
} from '@/utils/storage';
import { getTodayCheckin as getTodayCheckinDb, saveCheckin as saveCheckinDb, getProfile, saveGlp1Symptoms, getGlp1Symptoms, calculateStreak, getWeeklyMetrics } from '@/lib/database';
import { publishAchievement } from '@/lib/community';
import { getTodayBRT, formatDateFullBRT } from '@/lib/utils';

const CONTEXTOS: { label: string; value: ContextoAlimentar }[] = [
  { label: 'Evento social', value: 'evento_social' },
  { label: 'Ansiedade ou estresse', value: 'ansiedade_estresse' },
  { label: 'Fome fora de hora', value: 'fome_fora_de_hora' },
  { label: 'Não tive opção melhor', value: 'nao_tive_opcao_melhor' },
];

const GLP1_SYMPTOMS = [
  'Náusea 🤢',
  'Falta de apetite',
  'Cansaço 😴',
  'Constipação',
  'Refluxo',
  'Tontura',
  'Bem! Sem sintomas ✨',
];
const GLP1_BEM_SEM_SINTOMAS = 'Bem! Sem sintomas ✨';

export default function CheckinScreen() {
  const router = useRouter();
  const today = getTodayBRT();

  const [existing, setExisting] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);

  const [treinou, setTreinou] = useState<boolean | null>(null);
  const [bebeuAgua, setBebeuAgua] = useState<boolean | null>(null);
  const [dormiuBem, setDormiuBem] = useState<boolean | null>(null);
  const [adesaoAlimentar, setAdesaoAlimentar] = useState<AdesaoAlimentar | null>(null);
  const [contextosAlimentar, setContextosAlimentar] = useState<ContextoAlimentar[]>([]);
  const [textoLivre, setTextoLivre] = useState('');
  const [humor, setHumor] = useState<HumorCheckin | null>(null);
  const [escudoAtivado, setEscudoAtivado] = useState(false);
  const [shieldUsedThisWeek, setShieldUsedThisWeekState] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showGlp1Block, setShowGlp1Block] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [todayGlp1Symptoms, setTodayGlp1Symptoms] = useState<string[]>([]);

  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  const goHome = () => router.replace('/(tabs)');

  useEffect(() => {
    (async () => {
      const [cDb, used, profile, symptomsList] = await Promise.all([
        getTodayCheckinDb(),
        getShieldUsedThisWeek(),
        getProfile(),
        getGlp1Symptoms(),
      ]);
      setExisting(cDb ?? null);
      setShieldUsedThisWeekState(used);
      setShowGlp1Block(profile?.glp1_status === 'using' || profile?.glp1_status === 'used');
      const todayRec = (symptomsList || []).find((r) => r.date === today);
      setTodayGlp1Symptoms(todayRec?.symptoms ?? []);
      setLoading(false);
    })();
  }, [today]);

  const showAlimentarContexto = adesaoAlimentar === 'mais_ou_menos' || adesaoAlimentar === 'nao';
  const canActivateShield =
    showAlimentarContexto &&
    !shieldUsedThisWeek &&
    !escudoAtivado;

  const allAnswered =
    treinou !== null &&
    bebeuAgua !== null &&
    dormiuBem !== null &&
    adesaoAlimentar !== null &&
    humor !== null;

  const toggleContexto = (v: ContextoAlimentar) => {
    setContextosAlimentar((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleActivateShield = async () => {
    if (!canActivateShield) return;
    setEscudoAtivado(true);
    await setShieldUsedThisWeek();
  };

  const toggleGlp1Symptom = (s: string) => {
    if (s === GLP1_BEM_SEM_SINTOMAS) {
      setSelectedSymptoms([GLP1_BEM_SEM_SINTOMAS]);
      return;
    }
    setSelectedSymptoms((prev) => {
      const withoutBem = prev.filter((x) => x !== GLP1_BEM_SEM_SINTOMAS);
      if (withoutBem.includes(s)) return withoutBem.filter((x) => x !== s);
      return [...withoutBem, s];
    });
  };

  const handleConcluir = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const payload: CheckinData = {
        date: today,
        treinou: treinou!,
        bebeuAgua: bebeuAgua!,
        dormiuBem: dormiuBem!,
        adesaoAlimentar: adesaoAlimentar!,
        contextosAlimentar,
        textoLivre: textoLivre.trim() || undefined,
        humor: humor!,
        escudoAtivado,
      };
      await saveCheckinDb(payload);
      await saveCheckinStorage(payload);
      if (showGlp1Block && selectedSymptoms.length > 0) {
        await saveGlp1Symptoms(selectedSymptoms);
      }
      await publishAchievement('checkin_done');
      const newStreak = await calculateStreak();
      if (newStreak >= 7) await publishAchievement('streak_7');
      if (newStreak >= 30) await publishAchievement('streak_30');
      if (newStreak >= 60) await publishAchievement('streak_60');
      if (newStreak >= 90) await publishAchievement('streak_90');
      if (newStreak >= 7) await publishAchievement('first_week');
      if (escudoAtivado) await publishAchievement('shield_used');
      const weekly = await getWeeklyMetrics();
      if (weekly && weekly.treinos >= 5) await publishAchievement('trained_5');
      setShowSuccess(true);
      successOpacity.value = withSpring(1, { damping: 15, stiffness: 120 });
      successScale.value = withSequence(
        withSpring(1.2, { damping: 12, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      setTimeout(() => {
        goHome();
      }, 2000);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const formatDate = () => {
    return formatDateFullBRT(getTodayBRT());
  };

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const successContentStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  const contextoEntrance = useFadeSlideIn(0);
  const pressConcluir = usePressScale();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sageDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (existing) {
    const alimentacaoLabel =
      existing.adesaoAlimentar === 'sim'
        ? { text: '✅ Sim', color: '#1A1A1A' }
        : existing.adesaoAlimentar === 'mais_ou_menos'
        ? { text: 'Mais ou menos', color: '#C4846A' }
        : { text: '❌ Não', color: '#1A1A1A' };

    const humorLabel =
      existing.humor === 'bem'
        ? '😊 Bem'
        : existing.humor === 'normal'
        ? '😐 Normal'
        : '😔 Cansada';

    const rows: { label: string; value: string; valueColor?: string }[] = [
      { label: 'Treinou', value: existing.treinou ? '✅ Sim' : '❌ Não' },
      { label: 'Bebeu água', value: existing.bebeuAgua ? '✅ Sim' : '❌ Não' },
      { label: 'Dormiu bem', value: existing.dormiuBem ? '✅ Sim' : '❌ Não' },
      { label: 'Alimentação', value: alimentacaoLabel.text, valueColor: alimentacaoLabel.color },
      { label: 'Humor', value: humorLabel },
    ];

    return (
      <LinearGradient
        colors={gradients.gradientHeader}
        style={styles.safeArea}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={styles.existingHeader}>
              <RNText style={styles.existingTitle}>Check-in de hoje</RNText>
              <RNText style={styles.existingDate}>{formatDate()}</RNText>
              <RNText style={styles.existingSubtitle}>Menos de 1 minuto. Você consegue 💚</RNText>
            </View>

            <View style={styles.existingCard}>
              <RNText style={styles.existingCardTitle}>Resumo do seu dia</RNText>
              {rows.map((row, idx) => (
                <View key={row.label}>
                  <View style={styles.existingRow}>
                    <RNText style={styles.existingRowLabel}>{row.label}</RNText>
                    <RNText style={[styles.existingRowValue, row.valueColor ? { color: row.valueColor } : null]}>
                      {row.value}
                    </RNText>
                  </View>
                  {idx < rows.length - 1 && <View style={styles.existingDivider} />}
                </View>
              ))}
            </View>

            {showGlp1Block && todayGlp1Symptoms.length > 0 && (
              <View style={styles.existingGlp1Summary}>
                <View style={styles.glp1Badge}>
                  <RNText style={styles.glp1BadgeText}>GLP-1 💉</RNText>
                </View>
                <RNText style={styles.existingRowLabel}>Sintomas</RNText>
                <View style={styles.glp1ChipsRowReadOnly}>
                  {todayGlp1Symptoms.map((s) => (
                    <View key={s} style={styles.glp1ChipReadOnly}>
                      <RNText style={styles.glp1ChipReadOnlyText}>{s}</RNText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <RNText style={styles.existingFooter}>
              Você já fez seu check-in de hoje. Volte amanhã! 🌱
            </RNText>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successIconWrap, successIconStyle]}>
            <FontAwesome name="check-circle" size={80} color={colors.sageDark} />
          </Animated.View>
          <Animated.View style={successContentStyle}>
            <RNText style={styles.successText}>Check-in feito! 🎉</RNText>
            <RNText style={styles.successSub}>Sua sequência foi atualizada</RNText>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const QuestionSimNao = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean | null;
    onChange: (v: boolean) => void;
  }) => {
    const pressSim = usePressScale();
    const pressNao = usePressScale();
    return (
      <View style={styles.card}>
        <Text style={styles.questionText}>{label}</Text>
        <View style={styles.simNaoRow}>
          <Animated.View style={pressSim.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressSim.onPressIn}
              onPressOut={pressSim.onPressOut}
              style={[
                styles.btnSimNao,
                styles.btnSim,
                value === true && styles.btnSimSelected,
              ]}
              onPress={() => onChange(true)}
              activeOpacity={1}
            >
              {value === true ? (
                <LinearGradient
                  colors={gradients.gradientSage}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <RNText style={[styles.btnSimNaoText, value === true && styles.btnSimNaoTextSelected]}>
                Sim
              </RNText>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={pressNao.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressNao.onPressIn}
              onPressOut={pressNao.onPressOut}
              style={[
                styles.btnSimNao,
                styles.btnNao,
                value === false && styles.btnNaoSelected,
              ]}
              onPress={() => onChange(false)}
              activeOpacity={1}
            >
              <RNText style={[styles.btnSimNaoText, value === false && styles.btnNaoTextSelected]}>
                Não
              </RNText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
            <Text style={styles.headerTitle}>Check-in de hoje</Text>
            <RNText style={styles.headerDate}>{formatDate()}</RNText>
            <RNText style={styles.headerSub}>Menos de 1 minuto. Você consegue 💚</RNText>
          </LinearGradient>

          <QuestionSimNao
            label="Você treinou hoje?"
            value={treinou}
            onChange={setTreinou}
          />
          <QuestionSimNao
            label="Bebeu água suficiente?"
            value={bebeuAgua}
            onChange={setBebeuAgua}
          />
          <QuestionSimNao
            label="Dormiu bem essa noite?"
            value={dormiuBem}
            onChange={setDormiuBem}
          />

          <View style={styles.card}>
            <Text style={styles.questionText}>Seguiu sua alimentação hoje?</Text>
            <View style={styles.tresOpcoesRow}>
              {(['sim', 'mais_ou_menos', 'nao'] as AdesaoAlimentar[]).map((op) => (
                <TouchableOpacity
                  key={op}
                  style={[
                    styles.btnTres,
                    adesaoAlimentar === op && op === 'sim' && styles.btnTresSimSelected,
                    adesaoAlimentar === op && op !== 'sim' && styles.btnTresNaoSelected,
                  ]}
                  onPress={() => setAdesaoAlimentar(op)}
                  activeOpacity={0.8}
                >
                  {adesaoAlimentar === op && op === 'sim' ? (
                    <LinearGradient
                      colors={gradients.gradientSage}
                      style={[StyleSheet.absoluteFill, { borderRadius: radius.button }]}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.btnTresText,
                      adesaoAlimentar === op && styles.btnTresTextSelected,
                    ]}
                  >
                    {op === 'sim' ? 'Sim' : op === 'mais_ou_menos' ? 'Mais ou menos' : 'Não'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showAlimentarContexto && (
              <Animated.View style={[styles.contextoCard, contextoEntrance]}>
                <Text style={styles.contextoTitle}>Conta pra mim o que aconteceu</Text>
                <View style={styles.contextoBtns}>
                  {CONTEXTOS.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[
                        styles.contextoBtn,
                        contextosAlimentar.includes(c.value) && styles.contextoBtnSelected,
                      ]}
                      onPress={() => toggleContexto(c.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.contextoBtnText,
                          contextosAlimentar.includes(c.value) && styles.contextoBtnTextSelected,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.inputOpcional}
                  placeholder="Quer adicionar algo? (opcional)"
                  placeholderTextColor={colors.textSecondary}
                  value={textoLivre}
                  onChangeText={setTextoLivre}
                  multiline
                />
                <Text style={styles.fraseSage}>
                  Entender o contexto é mais útil que a perfeição. Isso não quebra seu progresso.
                </Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.questionText}>Como você está se sentindo hoje?</Text>
            <View style={styles.humorRow}>
              {(
                [
                  { v: 'bem' as HumorCheckin, l: 'Bem 😊' },
                  { v: 'normal' as HumorCheckin, l: 'Normal 😐' },
                  { v: 'cansada' as HumorCheckin, l: 'Cansada 😔' },
                ] as const
              ).map(({ v, l }) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.btnHumor, humor === v && styles.btnHumorSelected]}
                  onPress={() => setHumor(v)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnHumorText, humor === v && styles.btnHumorTextSelected]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {showGlp1Block && (
            <View style={styles.cardGlp1Sintomas}>
              <View style={styles.glp1Badge}>
                <RNText style={styles.glp1BadgeText}>GLP-1 💉</RNText>
              </View>
              <RNText style={styles.glp1SintomasTitle}>Como seu corpo está reagindo?</RNText>
              <RNText style={styles.glp1SintomasSubtitle}>
                Opcional — registrar ajuda sua médica a ajustar o tratamento.
              </RNText>
              <View style={styles.glp1ChipsRow}>
                {GLP1_SYMPTOMS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => toggleGlp1Symptom(s)}
                    style={[
                      styles.glp1Chip,
                      selectedSymptoms.includes(s) && styles.glp1ChipSelected,
                    ]}
                    activeOpacity={0.8}
                  >
                    <RNText
                      style={[
                        styles.glp1ChipText,
                        selectedSymptoms.includes(s) && styles.glp1ChipTextSelected,
                      ]}
                    >
                      {s}
                    </RNText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.cardEscudo}>
            <Text style={styles.escudoText}>
              Todo mundo tem dias difíceis. Você tem 1 escudo por semana — ele protege sua sequência
              mesmo em dias imperfeitos.
            </Text>
            {escudoAtivado ? (
              <View style={styles.escudoAtivadoWrap}>
                <FontAwesome name="check-circle" size={24} color={colors.terracotta} />
                <RNText style={styles.escudoAtivado}>Escudo ativado ✓</RNText>
              </View>
            ) : canActivateShield ? (
              <TouchableOpacity
                style={[styles.btnEscudo, shadows.glowTerracotta]}
                onPress={handleActivateShield}
                activeOpacity={0.8}
              >
                <RNText style={styles.btnEscudoText}>Ativar escudo</RNText>
              </TouchableOpacity>
            ) : null}
          </View>

          <Animated.View style={pressConcluir.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressConcluir.onPressIn}
              onPressOut={pressConcluir.onPressOut}
              style={[
                styles.btnConcluirWrap,
                !allAnswered && styles.btnConcluirDisabled,
              ]}
              onPress={handleConcluir}
              disabled={!allAnswered || submitting}
              activeOpacity={1}
            >
              <LinearGradient
                colors={gradients.gradientSage}
                style={[
                  styles.btnConcluir,
                  allAnswered && !submitting && shadows.glowSage,
                ]}
              >
                <RNText style={styles.btnConcluirText}>
                  {submitting ? 'Salvando...' : 'Concluir check-in'}
                </RNText>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
    borderRadius: radius.card,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  headerSub: {
    ...typography.bodySmall,
    color: colors.sage,
    marginBottom: 0,
  },
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  simNaoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btnSimNao: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  btnSim: {
    backgroundColor: '#F2F5F2',
    borderWidth: 1,
    borderColor: '#D8E4D8',
  },
  btnSimSelected: {
    borderWidth: 0,
  },
  btnNao: {
    backgroundColor: '#F2F5F2',
    borderWidth: 1,
    borderColor: '#D8E4D8',
  },
  btnNaoSelected: {
    backgroundColor: colors.terracottaLight,
    borderWidth: 1,
    borderColor: colors.terracotta,
  },
  btnSimNaoText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  btnSimNaoTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  btnNaoTextSelected: {
    color: colors.terracotta,
    fontWeight: '600',
  },
  tresOpcoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  btnTres: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#D8E4D8',
    overflow: 'hidden',
    position: 'relative',
  },
  btnTresSimSelected: {
    borderWidth: 0,
  },
  btnTresNaoSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },
  btnTresText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  btnTresTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  contextoCard: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSage,
    backgroundColor: 'rgba(240,248,240,0.9)',
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSage,
  },
  contextoTitle: {
    ...typography.titleSmall,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  contextoBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contextoBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSage,
  },
  contextoBtnSelected: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sage,
  },
  contextoBtnText: {
    ...typography.caption,
    color: colors.text,
  },
  contextoBtnTextSelected: {
    color: colors.sageDark,
    fontWeight: '600',
  },
  inputOpcional: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    marginBottom: spacing.sm,
  },
  fraseSage: {
    ...typography.bodySmall,
    color: colors.sageDark,
    fontStyle: 'italic',
  },
  humorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  btnHumor: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#D8E4D8',
    backgroundColor: '#F2F5F2',
  },
  btnHumorSelected: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sage,
  },
  btnHumorText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  btnHumorTextSelected: {
    color: colors.sageDark,
    fontWeight: '600',
  },
  cardGlp1Sintomas: {
    backgroundColor: '#FBF0EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F0D4C8',
  },
  glp1Badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#C4846A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 10,
  },
  glp1BadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  glp1SintomasTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  glp1SintomasSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  glp1ChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  glp1Chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F0D4C8',
  },
  glp1ChipSelected: {
    backgroundColor: '#C4846A',
  },
  glp1ChipText: {
    fontSize: 15,
    color: '#C4846A',
  },
  glp1ChipTextSelected: {
    color: '#FFFFFF',
  },
  existingGlp1Summary: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FBF0EB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0D4C8',
  },
  glp1ChipsRowReadOnly: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  glp1ChipReadOnly: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F0D4C8',
  },
  glp1ChipReadOnlyText: {
    fontSize: 14,
    color: '#C4846A',
  },
  cardEscudo: {
    backgroundColor: 'rgba(240,212,200,0.5)',
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.terracottaLight,
  },
  escudoText: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  escudoAtivadoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnEscudo: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.button,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  btnEscudoText: {
    ...typography.label,
    color: colors.white,
  },
  escudoAtivado: {
    ...typography.body,
    fontWeight: '600',
    color: colors.terracotta,
  },
  btnConcluirWrap: {
    width: '100%',
    marginBottom: spacing.md,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  btnConcluirDisabled: {
    opacity: 0.4,
  },
  btnConcluir: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConcluirText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  resumoLabel: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
    color: colors.text,
  },
  resumoLine: {
    ...typography.body,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  resumoInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  existingHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  existingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  existingDate: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  existingSubtitle: {
    fontSize: 13,
    color: '#5C7A5C',
  },
  existingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    ...shadows.card,
  },
  existingCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  existingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  existingRowLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B6B6B',
  },
  existingRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  existingDivider: {
    height: 1,
    backgroundColor: '#E8EDE8',
  },
  existingFooter: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  successIconWrap: {
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successSub: {
    ...typography.body,
    color: colors.sage,
  },
});
