import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Text as ThemedText } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn } from '@/hooks/useEntrance';
import {
  getOnboardingData,
  getCheckins,
  getStreak,
  getCheckinsForMonth,
  getMonthCalendar,
  getBestStreakInMonth,
  getMonthMetrics,
  getContextosFrequentes,
} from '@/utils/storage';

const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - 32;

// Dados mockados para o gráfico (8 pontos semanais)
const MOCK_WEIGHT_DATA = [82, 81.5, 81.2, 80.8, 80.9, 80.5, 80.2, 80.0];

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  decimalPlaces: 1,
  color: () => colors.sageDark,
  labelColor: () => colors.textSecondary,
  propsForDots: { r: '4' },
  fillShadowGradient: colors.sageLight,
  fillShadowGradientOpacity: 0.3,
};

const emptyMessage = 'Faça seu primeiro check-in para começar a ver seu progresso aqui 🌱';

export default function ProgressoScreen() {
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Awaited<ReturnType<typeof getCheckins>>>([]);
  const [streak, setStreak] = useState(0);
  const [pesoInicial, setPesoInicial] = useState<number | null>(null);
  const [pesoAtual, setPesoAtual] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthCalendar = getMonthCalendar(checkins, year, month);
  const checkinsNoMes = getCheckinsForMonth(checkins, year, month);
  const bestStreakMonth = getBestStreakInMonth(checkins, year, month);
  const metrics = getMonthMetrics(checkins, year, month);
  const contextosFreq = getContextosFrequentes(checkins);
  const hasAnyCheckin = checkins.length > 0;

  const load = async () => {
    const [list, str, onboarding] = await Promise.all([
      getCheckins(),
      getStreak(),
      getOnboardingData(),
    ]);
    setCheckins(list);
    setStreak(str);
    setPesoInicial(onboarding?.initialWeight ?? null);
    setPesoAtual(onboarding?.currentWeight ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const pesoIni = pesoInicial ?? pesoAtual ?? MOCK_WEIGHT_DATA[0];
  const pesoCur = pesoAtual ?? pesoInicial ?? MOCK_WEIGHT_DATA[MOCK_WEIGHT_DATA.length - 1];
  const variacao = pesoCur - pesoIni;

  const entrance0 = useFadeSlideIn(0);
  const entrance1 = useFadeSlideIn(80);
  const entrance2 = useFadeSlideIn(160);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
          <ThemedText style={styles.title}>Seu progresso</ThemedText>
          <ThemedText style={styles.subtitle}>Tudo que você construiu até aqui 💚</ThemedText>
        </LinearGradient>

        {/* Bloco 1 — Gráfico de peso */}
        <Animated.View style={[styles.card, entrance0]}>
          <ThemedText style={styles.cardTitle}>Evolução do peso</ThemedText>
          {hasAnyCheckin ? (
            <>
              <LineChart
                data={{
                  labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
                  datasets: [{ data: MOCK_WEIGHT_DATA }],
                }}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                fromZero={false}
                yAxisSuffix=" kg"
              />
              <View style={styles.pesoRow}>
                <ThemedText style={styles.pesoLabel}>Peso inicial: {pesoIni.toFixed(1)} kg</ThemedText>
                <ThemedText style={styles.pesoLabel}>Peso atual: {pesoCur.toFixed(1)} kg</ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.variacao,
                  variacao <= 0 ? styles.variacaoNegativa : styles.variacaoPositiva,
                ]}>
                {variacao <= 0
                  ? `▼ ${Math.abs(variacao).toFixed(1)} kg desde o início 🎉`
                  : `▲ ${variacao.toFixed(1)} kg desde o início`}
              </ThemedText>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
          )}
        </Animated.View>

        {/* Bloco 2 — Calendário de check-ins */}
        <Animated.View style={[styles.card, entrance1]}>
          <ThemedText style={styles.cardTitle}>Seus check-ins</ThemedText>
          {hasAnyCheckin ? (
            <>
              <View style={styles.calendar}>
                {monthCalendar.map((d) => (
                  <View key={d.dateStr} style={styles.calendarDayWrap}>
                    {d.done && !d.shield ? (
                      <LinearGradient
                        colors={gradients.gradientSage}
                        style={[styles.calendarDay, styles.calendarDayDone]}
                      >
                        <Text style={styles.calendarDayNumFilled}>{d.dayOfMonth}</Text>
                      </LinearGradient>
                    ) : d.shield ? (
                      <LinearGradient
                        colors={gradients.gradientTerracotta}
                        style={[styles.calendarDay, styles.calendarDayShield]}
                      >
                        <Text style={styles.calendarDayNumFilled}>{d.dayOfMonth}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.calendarDay, styles.calendarDayEmpty]}>
                        <Text style={styles.calendarDayNum}>{d.dayOfMonth}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              <ThemedText style={styles.calendarSummary}>
                {checkinsNoMes.length} check-ins esse mês
              </ThemedText>
              <ThemedText style={styles.calendarSummary}>
                Sua melhor sequência: {bestStreakMonth} dias
              </ThemedText>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
          )}
        </Animated.View>

        {/* Bloco 3 — Métricas resumidas */}
        <Animated.View style={[styles.card, entrance2]}>
          <ThemedText style={styles.cardTitle}>Seus hábitos esse mês</ThemedText>
          {hasAnyCheckin ? (
            <>
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricIcon}>🏋️</Text>
                  <ThemedText style={styles.metricNumber}>{metrics.treinos}</ThemedText>
                  <ThemedText style={styles.metricLabel}>treinos</ThemedText>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricIcon}>💧</Text>
                  <ThemedText style={styles.metricNumber}>{metrics.agua}</ThemedText>
                  <ThemedText style={styles.metricLabel}>dias com água</ThemedText>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricIcon}>😴</Text>
                  <ThemedText style={styles.metricNumber}>{metrics.dormiuBem}</ThemedText>
                  <ThemedText style={styles.metricLabel}>noites bem dormidas</ThemedText>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricIcon}>🍽️</Text>
                  <ThemedText style={styles.metricNumber}>{metrics.alimentacao}</ThemedText>
                  <ThemedText style={styles.metricLabel}>dias na alimentação</ThemedText>
                </View>
              </View>
              <View style={styles.contextoCard}>
                <ThemedText style={styles.contextoText}>
                  {contextosFreq.length >= 2
                    ? `Contexto alimentar: os momentos mais frequentes foram ${contextosFreq[0]} e ${contextosFreq[1]}.`
                    : contextosFreq.length === 1
                      ? `Contexto alimentar: o momento mais frequente foi ${contextosFreq[0]}.`
                      : 'Continue fazendo check-ins para ver seus padrões aqui.'}
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: 12,
    borderRadius: radius.card,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: radius.card,
  },
  pesoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  pesoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  variacao: {
    ...typography.label,
    marginTop: spacing.xs,
  },
  variacaoNegativa: {
    color: colors.sageDark,
  },
  variacaoPositiva: {
    color: colors.terracotta,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDayWrap: {
    width: 38,
    height: 38,
  },
  calendarDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayDone: {},
  calendarDayShield: {},
  calendarDayEmpty: {
    backgroundColor: '#F0F0F0',
  },
  calendarDayNum: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  calendarDayNumFilled: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  calendarSummary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricBox: {
    width: '47%',
    backgroundColor: colors.glassBg,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.sageDark,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  contextoCard: {
    backgroundColor: colors.sageLight,
    opacity: 0.9,
    borderRadius: radius.button,
    padding: spacing.md,
  },
  contextoText: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
