import { useState, useCallback, Fragment } from 'react';
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
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '@/components/Themed';
import { colors, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn } from '@/hooks/useEntrance';
import type { CheckinData } from '@/utils/storage';
import {
  getProfile,
  getCheckinsByMonth,
  getWeightRecords,
  getMonthlyMetrics,
  type MonthlyMetrics,
} from '@/lib/database';
import { getTodayBRT } from '@/lib/utils';

const emptyMessageCheckins = 'Faça seu primeiro check-in para começar a ver seu progresso aqui 🌱';
const emptyMessagePeso = 'Registre seu primeiro peso para ver sua evolução aqui 🌱';

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

const CONTEXTOS_MAP: Record<string, string> = {
  'evento_social': 'eventos sociais',
  'ansiedade_estresse': 'ansiedade ou estresse',
  'fome_fora_de_hora': 'fome fora de hora',
  'nao_tive_opcao_melhor': 'falta de opção',
};

function WeightChart({
  records,
  initialWeight,
}: {
  records: { date: string; weight: number }[];
  initialWeight?: number | null;
}) {
  const safeRecords = (records ?? [])
    .filter((r) => r && r.date != null && !Number.isNaN(Number(r.weight)))
    .map((r) => ({ date: String(r.date), weight: Number(r.weight) }));

  const sorted = [...safeRecords].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Inclui peso inicial do perfil como primeiro ponto quando existe e é diferente do primeiro registro (para desenhar a linha 60 → 55)
  const initial = initialWeight != null && !Number.isNaN(Number(initialWeight)) ? Number(initialWeight) : null;
  const needInitialPoint =
    initial != null && sorted.length >= 1 && initial !== sorted[0].weight;
  const points = needInitialPoint
    ? [{ date: sorted[0].date, weight: initial }, ...sorted]
    : sorted;

  const screenWidth = Dimensions.get('window').width;
  const width = screenWidth - 48 - 40;
  const height = 160;
  const paddingLeft = 36;
  const paddingRight = 52;
  const paddingTop = 12;
  const paddingBottom = 24;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (points.length < 1) {
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F8F5',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 14, color: '#6B6B6B', textAlign: 'center' }}>
          Registre sua primeira pesagem{'\n'}para ver seu gráfico
        </Text>
      </View>
    );
  }

  const weights = points.map((r) => Number(r.weight));
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const margin = Math.max((maxW - minW) * 0.3, 2);
  const yMin = minW - margin;
  const yMax = maxW + margin;
  const yRange = yMax - yMin;

  const toY = (w: number) =>
    paddingTop + chartHeight - ((w - yMin) / yRange) * chartHeight;

  const toX = (i: number) =>
    points.length === 1
      ? paddingLeft + chartWidth / 2
      : paddingLeft + (i / Math.max(points.length - 1, 1)) * chartWidth;

  const pathD =
    points.length >= 2
      ? points
          .map((r, i) => {
            const x = toX(i);
            const y = toY(Number(r.weight));
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ')
      : '';

  const yLabels = [
    Math.round(yMax),
    Math.round(yMin + yRange / 2),
    Math.round(yMin),
  ];

  return (
    <Svg width={width} height={height}>
      {yLabels.map((label, i) => {
        const y = toY(label);
        return (
          <Fragment key={i}>
            <Line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="#F0F0F0"
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 4}
              y={y + 4}
              fontSize={10}
              fill="#BDBDBD"
              textAnchor="end"
            >
              {label}
            </SvgText>
          </Fragment>
        );
      })}

      {pathD ? (
        <Path
          d={pathD}
          stroke="#5C7A5C"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {points.map((r, i) => (
        <Circle
          key={i}
          cx={toX(i)}
          cy={toY(Number(r.weight))}
          r={4}
          fill="#5C7A5C"
        />
      ))}

      <SvgText
        x={toX(points.length - 1) - 8}
        y={toY(Number(points[points.length - 1].weight)) - 10}
        fontSize={11}
        fill="#5C7A5C"
        fontWeight="700"
        textAnchor="end"
      >
        {points[points.length - 1].weight}kg
      </SvgText>

      <SvgText
        x={toX(0)}
        y={height - 4}
        fontSize={11}
        fill="#BDBDBD"
        textAnchor="middle"
      >
        Início
      </SvgText>
      <SvgText
        x={toX(points.length - 1)}
        y={height - 4}
        fontSize={11}
        fill="#BDBDBD"
        textAnchor="middle"
      >
        Hoje
      </SvgText>
    </Svg>
  );
}

export default function ProgressoScreen() {
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [weightRecords, setWeightRecords] = useState<{ date: string; weight: number }[]>([]);
  const [profile, setProfile] = useState<{ weight_initial: number | null; weight_current: number | null } | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayStr = getTodayBRT();

  const sortedByDate = [...weightRecords].sort(
    (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
  );

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const [p, records, list, m] = await Promise.all([
            getProfile(),
            getWeightRecords(),
            getCheckinsByMonth(year, month),
            getMonthlyMetrics(),
          ]);
          setProfile(p ? { weight_initial: p.weight_initial ?? null, weight_current: p.weight_current ?? null } : null);
          const normalized = (records || []).map((r) => ({
            date: String(r?.date ?? ''),
            weight: Number(r?.weight),
          })).filter((r) => r.date && !Number.isNaN(r.weight));
          setWeightRecords(normalized);
          if (__DEV__) {
            console.log('Progresso: records carregados', records?.length, '→ normalized', normalized.length, normalized);
          }
          setCheckins(list ?? []);
          setMonthlyMetrics(m ?? null);
        } catch (e) {
          if (__DEV__) console.warn('Progresso load error:', e);
          setWeightRecords([]);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [year, month])
  );

  // Calendário construído a partir dos dates reais (sem parsear timezone)
  const checkinDates = new Set(checkins.map((c) => c.date));
  const shieldDates = new Set(checkins.filter((c) => c.escudoAtivado).map((c) => c.date));
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthCalendar = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      dateStr,
      dayOfMonth: day,
      done: checkinDates.has(dateStr) && !shieldDates.has(dateStr),
      shield: shieldDates.has(dateStr),
    };
  });
  const calendarGrid = getCalendarGrid(monthCalendar, year, month);

  // Melhor sequência calculada a partir das datas ordenadas
  const sortedDates = [...checkinDates].sort();
  let bestStreakMonth = 0;
  let cur = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      cur = 1;
    } else {
      const prevMs = new Date(sortedDates[i - 1] + 'T12:00:00').getTime();
      const currMs = new Date(sortedDates[i] + 'T12:00:00').getTime();
      const diffDays = Math.round((currMs - prevMs) / 86400000);
      cur = diffDays === 1 ? cur + 1 : 1;
    }
    bestStreakMonth = Math.max(bestStreakMonth, cur);
  }

  const hasAnyCheckin = checkins.length > 0;

  // Peso
  const hasWeightData = weightRecords.length > 0 || (profile?.weight_initial != null && profile.weight_initial > 0) || (profile?.weight_current != null && profile.weight_current > 0);
  const pesoIni = weightRecords.length > 0 ? weightRecords[0].weight : (profile?.weight_initial ?? profile?.weight_current ?? null);
  const pesoCur = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : (profile?.weight_current ?? profile?.weight_initial ?? null);
  const variacao = pesoIni != null && pesoCur != null ? pesoCur - pesoIni : null;

  // Insight alimentar
  const topContextoKey = monthlyMetrics
    ? Object.entries(monthlyMetrics.contextos || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]
    : undefined;
  const insightText =
    !monthlyMetrics || monthlyMetrics.totalCheckins === 0
      ? 'Continue fazendo check-ins para ver seus padrões aqui.'
      : monthlyMetrics.desafiosAlimentares === 0
      ? 'Nenhum desafio alimentar esse mês! Continue assim 🎉'
      : topContextoKey
      ? `Seus momentos de desafio alimentar mais frequentes foram em ${CONTEXTOS_MAP[topContextoKey] ?? topContextoKey} 🌱`
      : 'Continue fazendo check-ins para ver seus padrões aqui.';

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

  console.log('weightRecords:', weightRecords);
  console.log('weightRecords.length:', weightRecords?.length);

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
          {hasWeightData ? (
            <>
              <View style={{ marginTop: 8, overflow: 'hidden', borderRadius: 12 }}>
                <WeightChart
                records={weightRecords ?? []}
                initialWeight={profile?.weight_initial}
              />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EDE8',
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, color: '#6B6B6B' }}>Peso inicial</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginTop: 2 }}>
                    {profile?.weight_initial != null ? `${profile.weight_initial} kg` : '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, color: '#6B6B6B' }}>Peso atual</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginTop: 2 }}>
                    {weightRecords.length > 0
                      ? `${weightRecords[weightRecords.length - 1].weight} kg`
                      : profile?.weight_initial != null
                        ? `${profile.weight_initial} kg`
                        : '—'}
                  </Text>
                </View>
              </View>

              {weightRecords.length > 0 && profile?.weight_initial != null && (() => {
                const variacaoTotal = weightRecords[weightRecords.length - 1].weight - Number(profile.weight_initial);
                const variacaoAbs = Math.abs(variacaoTotal).toFixed(1);
                if (Math.abs(variacaoTotal) < 0.1) return null;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: variacaoTotal < 0 ? '#5C7A5C' : '#C4846A',
                      }}
                    >
                      {variacaoTotal < 0 ? '▼' : '▲'} {variacaoAbs} kg desde o início
                    </Text>
                    {variacaoTotal < 0 && <Text style={{ fontSize: 15 }}>🎉</Text>}
                  </View>
                );
              })()}
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessagePeso}</ThemedText>
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
                    {row.map((cell, colIndex) => {
                      const isToday = cell !== null && cell.dateStr === todayStr;
                      return (
                        <View key={`${rowIndex}-${colIndex}`} style={styles.calendarDayWrap}>
                          {cell === null ? (
                            <View style={[styles.calendarDay, styles.calendarDayEmpty]} />
                          ) : cell.done ? (
                            <View style={[styles.calendarDay, styles.calendarDayDone]}>
                              <Text style={styles.calendarDayNumFilled}>{cell.dayOfMonth}</Text>
                            </View>
                          ) : cell.shield ? (
                            <View style={[styles.calendarDay, styles.calendarDayShield]}>
                              <Text style={styles.calendarDayNumFilled}>{cell.dayOfMonth}</Text>
                            </View>
                          ) : isToday ? (
                            <View style={[styles.calendarDay, styles.calendarDayToday]}>
                              <Text style={styles.calendarDayNum}>{cell.dayOfMonth}</Text>
                            </View>
                          ) : (
                            <View style={[styles.calendarDay, styles.calendarDayEmpty]}>
                              <Text style={styles.calendarDayNum}>{cell.dayOfMonth}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={styles.calendarSummaryRow}>
                <ThemedText style={styles.calendarSummaryLeft}>
                  {checkins.length} check-ins esse mês
                </ThemedText>
                <ThemedText style={styles.calendarSummaryRight}>
                  Melhor sequência: {bestStreakMonth} dias
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessageCheckins}</ThemedText>
          )}
        </Animated.View>

        {/* Bloco 3 — Seus hábitos esse mês */}
        <Animated.View style={[styles.card, entrance2]}>
          <ThemedText style={styles.cardTitle}>Seus hábitos esse mês</ThemedText>
          {monthlyMetrics && monthlyMetrics.totalCheckins > 0 ? (
            <>
              <View style={styles.habitsGrid}>
                <View style={styles.habitCard}>
                  <Ionicons name="barbell-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{monthlyMetrics.treinos}</ThemedText>
                  <ThemedText style={styles.habitLabel}>treinos</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="water-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{monthlyMetrics.agua}</ThemedText>
                  <ThemedText style={styles.habitLabel}>dias com água</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="moon-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{monthlyMetrics.sono}</ThemedText>
                  <ThemedText style={styles.habitLabel}>noites bem dormidas</ThemedText>
                </View>
                <View style={styles.habitCard}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.sage} style={styles.habitIcon} />
                  <ThemedText style={styles.habitNumber}>{monthlyMetrics.alimentacao}</ThemedText>
                  <ThemedText style={styles.habitLabel}>dias na alimentação</ThemedText>
                </View>
              </View>
              <View style={styles.insightBox}>
                <Ionicons name="bulb-outline" size={24} color={colors.sageDark} style={styles.insightIcon} />
                <ThemedText style={styles.insightText}>{insightText}</ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>{emptyMessageCheckins}</ThemedText>
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
    ...shadows.card,
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
  calendarDayToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5C7A5C',
    borderStyle: 'dashed',
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
