import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Text as RNText,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';
import {
  getOnboardingData,
  OnboardingData,
  getCheckinByDate,
  getStreak,
  getLast7DaysCheckins,
  getLast7DaysCheckinsFull,
  CheckinData,
} from '@/utils/storage';

const MARCO_90 = 90;

export default function InicioScreen() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayCheckin, setTodayCheckin] = useState<CheckinData | null>(null);
  const [last7, setLast7] = useState<{ date: string; label: string; done: boolean }[]>([]);
  const [last7Full, setLast7Full] = useState<CheckinData[]>([]);
  const [modalResumoVisible, setModalResumoVisible] = useState(false);
  const [modalConteudoVisible, setModalConteudoVisible] = useState(false);
  const [modalSequenciaVisible, setModalSequenciaVisible] = useState(false);
  const router = useRouter();

  const entrance0 = useFadeSlideIn(0);
  const entrance1 = useFadeSlideIn(80);
  const entrance2 = useFadeSlideIn(160);
  const entrance3 = useFadeSlideIn(240);
  const entrance4 = useFadeSlideIn(320);
  const entrance5 = useFadeSlideIn(400);
  const entrance6 = useFadeSlideIn(480);
  const entrance7 = useFadeSlideIn(560);
  const pressCheckin = usePressScale();
  const pressVerDia = usePressScale();
  const pressLer = usePressScale();
  const pressSequencia = usePressScale();
  const pressCheckinSequenciaModal = usePressScale();

  const loadData = async () => {
    const [onb, str, week, weekFull] = await Promise.all([
      getOnboardingData(),
      getStreak(),
      getLast7DaysCheckins(),
      getLast7DaysCheckinsFull(),
    ]);
    setOnboardingData(onb ?? null);
    setStreak(str);
    setLast7(week);
    setLast7Full(weekFull);
    const today = new Date().toISOString().slice(0, 10);
    const todayC = await getCheckinByDate(today);
    setTodayCheckin(todayC ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const dayXOf90 = () => {
    if (!onboardingData?.onboardingDate) return 1;
    const start = new Date(onboardingData.onboardingDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(MARCO_90, Math.max(1, diff + 1));
  };

  const proximoMarco = () => {
    const x = dayXOf90();
    if (x < 7) return 7;
    if (x < 30) return 30;
    if (x < 60) return 60;
    return 90;
  };

  const streakFrase = () => {
    if (streak <= 1) return 'Dia 1. Toda jornada começa aqui 🌱';
    if (streak <= 6) return 'Você está construindo algo real.';
    if (streak <= 29) return 'Você está entre os 10% que chegam aqui.';
    return 'Você está entre os 3% que mantêm consistência. Sério.';
  };

  const weekComplete = last7.filter((d) => d.done).length;
  const treinosWeek = last7Full.filter((c) => c.treinou).length;
  const aguaWeek = last7Full.filter((c) => c.bebeuAgua).length;
  const sonoWeek = last7Full.filter((c) => c.dormiuBem).length;
  const alimentacaoWeek = last7Full.filter((c) => c.adesaoAlimentar === 'sim').length;
  const diasDesafioAlimentar = last7Full.filter(
    (c) => c.adesaoAlimentar === 'mais_ou_menos' || c.adesaoAlimentar === 'nao'
  ).length;
  const proximaPesagemDias = 7;
  const proximaAplicacaoDias = onboardingData?.glp1Status === 'using' ? 7 : null;
  const usaGlp1 = onboardingData?.glp1Status === 'using';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

  const userName = onboardingData?.name || 'Bem-vinda';
  const dayX = dayXOf90();
  const progressPct = (dayX / MARCO_90) * 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header com gradiente */}
        <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
          <Text style={styles.greeting}>{greeting()}, {userName}</Text>
          <RNText style={styles.dayLabel}>Dia {dayX} de {MARCO_90}</RNText>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={gradients.gradientSage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPct}%` }]}
            />
          </View>
          <RNText style={styles.marcoText}>Próximo marco: {proximoMarco()} dias</RNText>
        </LinearGradient>

        {/* Card Sequência */}
        <Animated.View style={[styles.cardStreakWrap, entrance0]}>
          <LinearGradient
            colors={gradients.gradientSage}
            style={[styles.cardStreak, shadows.glowSage]}
          >
            <View style={styles.cardStreakCircle} />
            <Animated.View style={pressSequencia.animatedStyle}>
              <TouchableOpacity
                onPressIn={pressSequencia.onPressIn}
                onPressOut={pressSequencia.onPressOut}
                onPress={() => setModalSequenciaVisible(true)}
                activeOpacity={1}
                style={styles.cardSequenciaTouch}
              >
                <RNText style={styles.streakNumber}>{streak}</RNText>
                <RNText style={styles.streakLabel}>dias de sequência</RNText>
                <RNText style={styles.streakFrase}>{streakFrase()}</RNText>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Card Check-in */}
        <Animated.View style={entrance1}>
          {!todayCheckin ? (
            <Animated.View style={pressCheckin.animatedStyle}>
              <TouchableOpacity
                onPressIn={pressCheckin.onPressIn}
                onPressOut={pressCheckin.onPressOut}
                onPress={() => router.push('/(tabs)/checkin')}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={gradients.gradientTerracotta}
                  style={[styles.btnCheckin, shadows.glowTerracotta]}
                >
                  <RNText style={styles.btnCheckinText}>Fazer check-in de hoje</RNText>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.cardCheckinDone}>
              <View style={styles.checkinDoneRow}>
                <FontAwesome name="check-circle" size={24} color={colors.sageDark} />
                <Text style={styles.checkinDoneText}>Check-in de hoje concluído ✓</Text>
              </View>
              <Animated.View style={pressVerDia.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressVerDia.onPressIn}
                  onPressOut={pressVerDia.onPressOut}
                  onPress={() => setModalResumoVisible(true)}
                  style={styles.btnVerDia}
                  activeOpacity={1}
                >
                  <Text style={styles.btnVerDiaText}>Ver meu dia</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </Animated.View>

        {/* Card Progresso Semanal */}
        <Animated.View style={[styles.card, entrance2]}>
          <Text style={styles.cardTitle}>Sua semana</Text>
          <View style={styles.weekCircles}>
            {last7.map((d) => (
              <View key={d.date} style={styles.weekCircleWrap}>
                {d.done ? (
                  <LinearGradient
                    colors={gradients.gradientSage}
                    style={[styles.weekCircle, styles.weekCircleFilled, shadows.glowSage]}
                  />
                ) : (
                  <View style={styles.weekCircleEmpty} />
                )}
                <RNText style={styles.weekCircleLabel}>{d.label}</RNText>
              </View>
            ))}
          </View>
          <RNText style={styles.weekSummary}>{weekComplete} de 7 dias completos esta semana.</RNText>
        </Animated.View>

        {/* Card Como você está indo — grid 2x2 */}
        <Animated.View style={[styles.comoIndoWrap, entrance3]}>
          <Text style={styles.cardTitle}>Como você está indo</Text>
          <View style={styles.comoIndoGrid}>
            <View style={styles.comoIndoCard}>
              <Ionicons name="barbell-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{treinosWeek}</RNText>
              <RNText style={styles.comoIndoLabel}>treinos</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="water-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{aguaWeek}</RNText>
              <RNText style={styles.comoIndoLabel}>dias com água</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="moon-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{sonoWeek}</RNText>
              <RNText style={styles.comoIndoLabel}>noites bem dormidas</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="restaurant-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{alimentacaoWeek}</RNText>
              <RNText style={styles.comoIndoLabel}>dias na alimentação</RNText>
            </View>
          </View>
        </Animated.View>

        {/* Card Próximos Eventos */}
        <Animated.View style={[styles.card, styles.cardEventos, entrance4]}>
          <Text style={styles.cardTitle}>Não esqueça</Text>
          <View style={styles.eventItem}>
            <RNText style={styles.eventIcon}>⚖️</RNText>
            <View>
              <RNText style={styles.eventTitle}>Próxima pesagem</RNText>
              <RNText style={styles.eventSub}>em {proximaPesagemDias} dias</RNText>
            </View>
          </View>
          {usaGlp1 && (
            <View style={styles.eventItem}>
              <RNText style={styles.eventIcon}>💉</RNText>
              <View>
                <RNText style={styles.eventTitle}>Próxima aplicação GLP-1</RNText>
                <RNText style={styles.eventSub}>em {proximaAplicacaoDias} dias</RNText>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Card Conteúdo do Dia */}
        <Animated.View style={[styles.cardConteudoWrap, entrance5]}>
          <LinearGradient
            colors={[colors.contentCardFrom, colors.contentCardTo]}
            style={[styles.cardConteudo, { borderWidth: 1, borderColor: colors.contentCardBorder }]}
          >
            <Text style={styles.cardTitle}>Para você hoje</Text>
            <Text style={styles.conteudoTitulo}>Por que proteína é sua melhor aliada agora</Text>
            <Animated.View style={pressLer.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressLer.onPressIn}
              onPressOut={pressLer.onPressOut}
              onPress={() => setModalConteudoVisible(true)}
              style={styles.btnLer}
              activeOpacity={1}
            >
              <Text style={styles.btnLerText}>Ler</Text>
            </TouchableOpacity>
          </Animated.View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Modal Resumo do check-in */}
      <Modal visible={modalResumoVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalResumoVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Seu dia</Text>
            {todayCheckin && (
              <>
                <Text style={styles.modalLine}>Treinou: {todayCheckin.treinou ? 'Sim' : 'Não'}</Text>
                <Text style={styles.modalLine}>Água: {todayCheckin.bebeuAgua ? 'Sim' : 'Não'}</Text>
                <Text style={styles.modalLine}>Dormiu bem: {todayCheckin.dormiuBem ? 'Sim' : 'Não'}</Text>
                <Text style={styles.modalLine}>Alimentação: {todayCheckin.adesaoAlimentar}</Text>
                <Text style={styles.modalLine}>Humor: {todayCheckin.humor}</Text>
                {todayCheckin.textoLivre ? (
                  <Text style={styles.modalLine}>Observação: {todayCheckin.textoLivre}</Text>
                ) : null}
              </>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setModalResumoVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Conteúdo do dia */}
      <Modal visible={modalConteudoVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalConteudoVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Por que proteína é sua melhor aliada agora</Text>
            <Text style={styles.modalParagraph}>
              A proteína ajuda a preservar massa muscular durante a perda de peso e mantém a saciedade.
              Incluir uma fonte em cada refeição — ovos, frango, peixe, leguminosas ou iogurte —
              faz diferença no resultado e no bem-estar. Pequenos ajustes sustentáveis valem mais que dietas radicais.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setModalConteudoVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Sua Sequência — tela cheia */}
      <Modal visible={modalSequenciaVisible} animationType="slide">
        <SafeAreaView style={styles.modalSequenciaRoot} edges={['top']}>
          <LinearGradient colors={gradients.gradientSage} style={styles.modalSequenciaHeader}>
            <View style={styles.modalSequenciaHeaderBg}>
              <Ionicons name="leaf-outline" size={140} color="rgba(255,255,255,0.18)" />
            </View>
            <View style={styles.modalSequenciaClosePlaceholder} />
            <View style={styles.modalSequenciaHeaderCenter}>
              <RNText style={styles.modalSequenciaTitle}>Sua Sequência</RNText>
            </View>
            <TouchableOpacity
              onPress={() => setModalSequenciaVisible(false)}
              style={styles.modalSequenciaClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView
            style={styles.modalSequenciaScroll}
            contentContainerStyle={styles.modalSequenciaContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalSequenciaCard}>
              <RNText style={styles.modalSequenciaExplainer}>
                Sua sequência conta quantos dias seguidos você fez check-in no UpWell. Cada dia que você registra como foi — treino, alimentação, água, sono — conta como um dia na sua sequência. Não precisa ser perfeito. Precisa ser consistente.
              </RNText>
            </View>
            <View style={styles.modalSequenciaEscudo}>
              <Ionicons name="shield-outline" size={32} color={colors.terracotta} />
              <RNText style={styles.modalSequenciaEscudoTitle}>O Escudo</RNText>
              <RNText style={styles.modalSequenciaEscudoText}>
                Uma vez por semana você pode ativar o Escudo. Ele protege sua sequência em dias mais difíceis — mas você precisa ativá-lo conscientemente no check-in. Isso transforma um deslize em uma decisão.
              </RNText>
            </View>
            <RNText style={styles.modalSequenciaMarcosTitle}>Seus próximos marcos</RNText>
            {[7, 30, 60, 90].map((marco) => {
              const atingido = streak >= marco;
              const diasFaltam = Math.max(0, marco - streak);
              return (
                <View key={marco} style={styles.modalSequenciaMarcoRow}>
                  {atingido ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.sageDark} />
                  ) : (
                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
                  )}
                  <RNText style={styles.modalSequenciaMarcoLabel}>
                    {marco} dias{atingido ? ' — atingido' : ` — faltam ${diasFaltam} dias`}
                  </RNText>
                </View>
              );
            })}
            <View style={styles.modalSequenciaIdentidade}>
              <RNText style={styles.modalSequenciaIdentidadeText}>{streakFrase()}</RNText>
            </View>
            {!todayCheckin && (
              <Animated.View style={pressCheckinSequenciaModal.animatedStyle}>
                <TouchableOpacity
                  onPressIn={pressCheckinSequenciaModal.onPressIn}
                  onPressOut={pressCheckinSequenciaModal.onPressOut}
                  onPress={() => {
                    setModalSequenciaVisible(false);
                    router.push('/(tabs)/checkin');
                  }}
                  activeOpacity={1}
                  style={styles.modalSequenciaBtnWrap}
                >
                  <LinearGradient
                    colors={gradients.gradientTerracotta}
                    style={[styles.modalSequenciaBtn, shadows.glowTerracotta]}
                  >
                    <RNText style={styles.modalSequenciaBtnText}>Fazer check-in de hoje</RNText>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.card,
  },
  greeting: {
    ...typography.greeting,
    marginBottom: spacing.xs,
  },
  dayLabel: {
    ...typography.dayLabel,
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  marcoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardStreakWrap: {
    marginBottom: spacing.md,
  },
  cardStreak: {
    borderRadius: radius.card,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cardStreakCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  streakFrase: {
    ...typography.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  cardSequenciaTouch: {
    paddingVertical: spacing.xs,
  },
  cardCheckinDone: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  checkinDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkinDoneText: {
    ...typography.body,
    color: colors.sageDark,
    fontWeight: '600',
  },
  btnCheckin: {
    borderRadius: radius.button,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: spacing.md,
  },
  btnCheckinText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  btnVerDia: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  btnVerDiaText: {
    ...typography.label,
    color: colors.sageDark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
  },
  weekCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weekCircleWrap: {
    alignItems: 'center',
  },
  weekCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: spacing.xs,
  },
  weekCircleFilled: {},
  weekCircleEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    marginBottom: spacing.xs,
  },
  weekCircleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  weekSummary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  comoIndoWrap: {
    marginBottom: spacing.md,
  },
  comoIndoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.sm,
  },
  comoIndoCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.card,
  },
  comoIndoIcon: {
    marginBottom: 10,
  },
  comoIndoNum: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.sageDark,
    marginBottom: 4,
  },
  comoIndoLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardEventos: {
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  eventIcon: {
    fontSize: 22,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  eventSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardConteudoWrap: {
    marginBottom: spacing.md,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardConteudo: {
    borderRadius: radius.card,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  conteudoTitulo: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  btnLer: {
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.sage,
    alignSelf: 'flex-start',
  },
  btnLerText: {
    ...typography.label,
    color: colors.sageDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
  },
  modalLine: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  modalParagraph: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    backgroundColor: colors.sageDark,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalBtnText: {
    ...typography.label,
    color: colors.white,
  },
  // Modal Sua Sequência
  modalSequenciaRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalSequenciaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  modalSequenciaHeaderBg: {
    position: 'absolute',
    right: -20,
    top: '50%',
    marginTop: -70,
    opacity: 1,
  },
  modalSequenciaHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSequenciaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  modalSequenciaClosePlaceholder: {
    width: 40,
  },
  modalSequenciaClose: {
    zIndex: 1,
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalSequenciaScroll: {
    flex: 1,
  },
  modalSequenciaContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  modalSequenciaCard: {
    backgroundColor: colors.glassBg,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  modalSequenciaExplainer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
  },
  modalSequenciaEscudo: {
    backgroundColor: colors.terracottaLight,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalSequenciaEscudoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalSequenciaEscudoText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  modalSequenciaMarcosTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalSequenciaMarcoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalSequenciaMarcoLabel: {
    ...typography.body,
    color: colors.text,
  },
  modalSequenciaIdentidade: {
    backgroundColor: colors.sage,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSequenciaIdentidadeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  modalSequenciaBtnWrap: {
    marginTop: spacing.sm,
  },
  modalSequenciaBtn: {
    borderRadius: radius.button,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  modalSequenciaBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
