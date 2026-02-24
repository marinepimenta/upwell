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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '@/components/Themed';
import { colors, shadows, radius, spacing, typography } from '@/constants/theme';
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

const chartWidth = Dimensions.get('window').width - 80;

// Dados mockados: 8 pontos S1–S8
const MOCK_WEIGHT_DATA = [82, 81.5, 81.2, 80.8, 80.9, 80.5, 80.2, 80.0];
const CHART_LABELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

// Sombra md do design system
const shadowMd = {
  shadowColor: '#5C7A5C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 1,
  color: () => '#5C7A5C',
  labelColor: () => '#6B6B6B',
  strokeWidth: 2,
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#5C7A5C', fill: '#5C7A5C' },
  propsForBackgroundLines: { stroke: 'transparent' },
  fillShadowGradient: '#8FAF8F',
  fillShadowGradientOpacity: 0.12,
};

const emptyMessage = 'Faça seu primeiro check-in para começar a ver seu progresso aqui 🌱';

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function getCalendarGrid(
  monthCalendar: { dateStr: string; dayOfMonth: number; done: boolean; shield: boolean }[],
  year: number,
  month: number
): (typeof monthCalendar[0] | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7; // 0 = Monday
  const slots: (typeof monthCalendar[0] | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...monthCalendar,
  ];
  const rows: (typeof monthCalendar[0] | null)[][] = [];
  for (let i = 0; i < slots.length; i += 7) {
    const row = slots.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

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
  const calendarGrid = getCalendarGrid(monthCalendar, year, month);
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
        <View style={styles.header}>
          <ThemedText style={styles.title}>Seu progresso</ThemedText>
          <ThemedText style={styles.subtitle}>Tudo que você construiu até aqui 💚</ThemedText>
        </View>

        {/* Card Evolução do peso */}
        <Animated.View style={[styles.cardPeso, entrance0]}>
          <Text style={styles.cardPesoTitle}>Evolução do peso</Text>
          {hasAnyCheckin ? (
            <>
              <LineChart
                data={{
                  labels: CHART_LABELS,
                  datasets: [{ data: MOCK_WEIGHT_DATA }],
                }}
                width={chartWidth}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={false}
                withVerticalLabels={true}
                withHorizontalLabels={false}
                fromZero={false}
                yAxisSuffix=" kg"
              />
              <View style={styles.pesoRow}>
                <Text style={styles.pesoLabel}>Peso inicial: {pesoIni.toFixed(pesoIni % 1 === 0 ? 0 : 1)} kg</Text>
                <Text style={styles.pesoLabel}>Peso atual: {pesoCur.toFixed(1)} kg</Text>
              </View>
              <Text
                style={[
                  styles.variacao,
                  variacao <= 0 ? styles.variacaoNegativa : styles.variacaoPositiva,
                ]}
              >
                {variacao <= 0
                  ? `▼ ${Math.abs(variacao).toFixed(1)} kg desde o início 🎉`
                  : `▲ ${variacao.toFixed(1)} kg desde o início`}
              </Text>
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
              <View style={styles.calendarHeader}>
                {WEEKDAY_LABELS.map((l, i) => (
                  <ThemedText key={i} style={styles.calendarWeekdayLabel}>{l}</ThemedText>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.calendarRow}>
                    {row.map((cell, colIndex) => (
                      <View key={`${rowIndex}-${colIndex}`} style={styles.calendarDayWrap}>
                        {cell === null ? (
                          <View style={[styles.calendarDay, styles.calendarDayEmpty]} />
                        ) : cell.done && !cell.shield ? (
                          <View style={[styles.calendarDay, styles.calendarDayDone]}>
                            <Text style={styles.calendarDayNumFilled}>{cell.dayOfMonth}</Text>
                          </View>
                        ) : cell.shield ? (
                          <View style={[styles.calendarDay, styles.calendarDayShield]}>
                            <Text style={styles.calendarDayNumFilled}>{cell.dayOfMonth}</Text>
                          </View>
                        ) : (
                          <View style={[styles.calendarDay, styles.calendarDayEmpty]}>
                            <Text style={styles.calendarDayNum}>{cell.dayOfMonth}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.calendarSummaryRow}>
                <ThemedText style={styles.calendarSummaryLeft}>
                  {checkinsNoMes.length} check-ins esse mês
                </ThemedText>
                <ThemedText style={styles.calendarSummaryRight}>
                  Melhor sequência: {bestStreakMonth} dias
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
          )}
        </Animated.View>

        {/* Bloco 3 — Seus hábitos esse mês */}
        <Animated.View style={[styles.card, entrance2]}>
          <ThemedText style={styles.cardTitle}>Seus hábitos esse mês</ThemedText>
          {hasAnyCheckin ? (
            <>
              <View style={styles.habitsGrid}>
                <View style={styles.habitCard}>
                  <Ionicons name="barbell-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{metrics.treinos}</ThemedText>
                  <ThemedText style={styles.habitLabel}>treinos</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="water-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{metrics.agua}</ThemedText>
                  <ThemedText style={styles.habitLabel}>dias com água</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="moon-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{metrics.dormiuBem}</ThemedText>
                  <ThemedText style={styles.habitLabel}>noites bem dormidas</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{metrics.alimentacao}</ThemedText>
                  <ThemedText style={styles.habitLabel}>dias na alimentação</ThemedText>
                </View>
              </View>
              <View style={styles.insightBox}>
                <Ionicons name="bulb-outline" size={24} color={colors.sageDark} style={styles.insightIcon} />
                <ThemedText style={styles.insightText}>
                  {contextosFreq.length >= 2
                    ? `Seus momentos de desafio alimentar mais frequentes foram em ${contextosFreq[0]} e ${contextosFreq[1]}.`
                    : contextosFreq.length === 1
                      ? `Seus momentos de desafio alimentar mais frequentes foram em ${contextosFreq[0]}.`
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardPeso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    ...shadowMd,
  },
  cardPesoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: 0,
    borderRadius: radius.sm,
  },
  pesoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  pesoLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B6B6B',
  },
  variacao: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  variacaoNegativa: {
    color: '#5C7A5C',
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
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  calendarGrid: {
    marginBottom: spacing.md,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  calendarDayWrap: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayDone: {
    backgroundColor: colors.sageDark,
  },
  calendarDayShield: {
    backgroundColor: colors.terracottaLight,
  },
  calendarDayEmpty: {
    backgroundColor: '#F0F0F0',
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  calendarDayNumFilled: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  calendarSummaryRow: {
    flexDirection: 'column',
    marginTop: spacing.sm,
    gap: 6,
  },
  calendarSummaryLeft: {
    fontSize: 14,
    color: colors.text,
  },
  calendarSummaryRight: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sageDark,
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
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.md,
  },
  habitCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  habitIcon: {
    marginBottom: 10,
  },
  habitNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.sageDark,
    marginBottom: 4,
  },
  habitLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.sageLight,
    borderRadius: 16,
    padding: spacing.md,
    gap: 12,
  },
  insightIcon: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.sageDark,
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
