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
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';
import type { CheckinData } from '@/utils/storage';
import {
  getProfile,
  getTodayCheckin as getTodayCheckinDb,
  getLastSevenDaysCheckins as getLastSevenDaysCheckinsDb,
  getCheckinsByMonth,
  getWeightRecords,
  getLastWeightRecord,
  getWeeklyMetrics,
  calculateStreak,
  type Profile,
  type WeeklyMetrics,
} from '@/lib/database';
import { getUnreadCount } from '@/lib/notifications';
import { getTodayBRT } from '@/lib/utils';

const MARCO_90 = 90;

export default function InicioScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayCheckin, setTodayCheckin] = useState<CheckinData | null>(null);
  const [last7, setLast7] = useState<{ date: string; label: string; done: boolean }[]>([]);
  const [checkinsMonth, setCheckinsMonth] = useState<CheckinData[]>([]);
  const [weightRecords, setWeightRecords] = useState<{ date: string; weight: number }[]>([]);
  const [diasDesdeUltimaPesagem, setDiasDesdeUltimaPesagem] = useState<number | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics>({ treinos: 0, agua: 0, sono: 0, alimentacao: 0, desafiosAlimentares: 0, totalCheckins: 0 });
  const [modalResumoVisible, setModalResumoVisible] = useState(false);
  const [modalConteudoVisible, setModalConteudoVisible] = useState(false);
  const [modalSequenciaVisible, setModalSequenciaVisible] = useState(false);
  const [loadingSequenciaModal, setLoadingSequenciaModal] = useState(false);
  const [shieldUsedThisWeek, setShieldUsedThisWeek] = useState(false);
  const [checkinFeito, setCheckinFeito] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

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
    const p = await getProfile();
    setProfile(p ?? null);
    if (p) {
      const [str, week, todayC, records, lastWeight, monthCheckins, wMetrics, count] = await Promise.all([
        calculateStreak(),
        getLastSevenDaysCheckinsDb(),
        getTodayCheckinDb(),
        getWeightRecords(),
        getLastWeightRecord(),
        getCheckinsByMonth(currentYear, currentMonth),
        getWeeklyMetrics(),
        getUnreadCount(),
      ]);
      setStreak(str);
      setLast7(week);
      setTodayCheckin(todayC ?? null);
      setWeightRecords(records.map((r) => ({ date: r.date, weight: r.weight })));
      setUnreadCount(count);
      if (lastWeight) {
        const dias = Math.floor(
          (new Date().getTime() - new Date(lastWeight.date + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24)
        );
        setDiasDesdeUltimaPesagem(dias);
      } else {
        setDiasDesdeUltimaPesagem(null);
      }
      setCheckinsMonth(monthCheckins);
      if (wMetrics) setWeeklyMetrics(wMetrics);
    } else {
      setStreak(0);
      setLast7([]);
      setTodayCheckin(null);
      setWeightRecords([]);
      setDiasDesdeUltimaPesagem(null);
      setCheckinsMonth([]);
    }
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

  useEffect(() => {
    if (!modalSequenciaVisible) return;
    const load = async () => {
      setLoadingSequenciaModal(true);
      const now = new Date();
      const [currentStreak, checkins, todayC] = await Promise.all([
        calculateStreak(),
        getCheckinsByMonth(now.getFullYear(), now.getMonth() + 1),
        getTodayCheckinDb(),
      ]);
      setStreak(currentStreak);
      setCheckinFeito(!!todayC);

      const hoje = new Date();
      const diaDaSemana = hoje.getDay();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - (diaDaSemana === 0 ? 6 : diaDaSemana - 1));
      inicioSemana.setHours(0, 0, 0, 0);

      const shieldThisWeek =
        checkins?.some((c) => {
          const [y, m, d] = c.date.split('-').map(Number);
          const checkinDate = new Date(y, m - 1, d);
          return c.escudoAtivado && checkinDate >= inicioSemana;
        }) ?? false;
      setShieldUsedThisWeek(shieldThisWeek);
      setLoadingSequenciaModal(false);
    };
    load();
  }, [modalSequenciaVisible]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const calcularDiaPrograma = (programStartDate: string): number => {
    const [year, month, day] = programStartDate.split('-').map(Number);
    const inicio = new Date(year, month - 1, day);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    inicio.setHours(0, 0, 0, 0);
    const diffMs = hoje.getTime() - inicio.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDias + 1);
  };

  const hasProgramStart = !!profile?.program_start_date;

  const proximoMarco = () => {
    if (dayX == null) return null;
    if (dayX < 7) return 7;
    if (dayX < 30) return 30;
    if (dayX < 60) return 60;
    return 90;
  };

  const getFraseIdentidade = (s: number): string => {
    if (s === 0) return 'Faça seu primeiro check-in hoje';
    if (s === 1) return 'Dia 1. Toda jornada começa aqui';
    if (s < 7) return `${s} dias. Você está construindo algo real`;
    if (s === 7) return 'Primeira semana completa. Isso é consistência';
    if (s < 30) return `${s} dias seguidos. Você está entre os mais consistentes`;
    if (s === 30) return 'Um mês inteiro. Você está mudando quem você é';
    if (s < 60) return `${s} dias. Você está entre os 5% que chegam aqui`;
    if (s === 60) return '60 dias. Metade da jornada. Você é incrível';
    if (s < 90) return `${s} dias. A linha de chegada está próxima`;
    return '90 dias. Você transformou sua vida';
  };

  const MARCOS_SEQUENCIA = [7, 30, 60, 90];
  const getMarcosStatus = (currentStreak: number) =>
    MARCOS_SEQUENCIA.map((dias) => {
      if (currentStreak >= dias) {
        return { dias, status: 'conquistado' as const, faltam: 0 };
      }
      return { dias, status: 'pendente' as const, faltam: dias - currentStreak };
    });

  const weekComplete = last7.filter((d) => d.done).length;
  const lastWeightRecord = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const nextWeighInDate = lastWeightRecord
    ? (() => {
        const d = new Date(lastWeightRecord.date);
        d.setDate(d.getDate() + 7);
        return d;
      })()
    : null;
  const proximaPesagemDias =
    nextWeighInDate != null
      ? Math.max(0, Math.ceil((nextWeighInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : null;
  const usaGlp1 = profile?.glp1_status === 'using';
  const proximaAplicacaoDias = usaGlp1 ? 7 : null;

  const userName = profile?.name?.trim() || 'Bem-vinda';
  const dayX = profile?.program_start_date
    ? Math.min(MARCO_90, calcularDiaPrograma(profile.program_start_date))
    : null;
  const progressPct = dayX != null ? (dayX / MARCO_90) * 100 : 0;
  const marco = proximoMarco();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

  if (profile === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyStateTitle}>Complete seu perfil para ver seu progresso</Text>
          <Text style={styles.emptyStateSub}>Faça login e complete o onboarding para acessar sua jornada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header com gradiente */}
        <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting()}, {userName}</Text>
          {hasProgramStart && dayX != null ? (
            <>
              <RNText style={styles.dayLabel}>Dia {dayX} de {MARCO_90}</RNText>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={gradients.gradientSage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progressPct}%` }]}
                />
              </View>
              <RNText style={styles.marcoText}>
                Próximo marco: {marco != null ? `${marco} dias` : '—'}
              </RNText>
            </>
          ) : (
            <RNText style={styles.dayLabel}>Configure sua data de início no perfil</RNText>
          )}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              style={styles.bellBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#5C7A5C" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge} />
              )}
            </TouchableOpacity>
          </View>
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
                <RNText style={styles.streakFrase}>{getFraseIdentidade(streak)}</RNText>
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
        <Animated.View style={[styles.weekCard, entrance2]}>
          <RNText style={styles.weekCardTitle}>Sua semana</RNText>
          <View style={styles.weekCircles}>
            {last7.map((d) => {
              const todayStr = getTodayBRT();
              const isToday = d.date === todayStr;
              const isFuture = d.date > todayStr;
              return (
                <View key={d.date} style={styles.weekCircleWrap}>
                  <RNText style={styles.weekDayLabel}>{d.label}</RNText>
                  {d.done ? (
                    <View style={styles.weekCircleDone}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  ) : isToday ? (
                    <View style={styles.weekCircleToday} />
                  ) : isFuture ? (
                    <View style={styles.weekCircleFuture} />
                  ) : (
                    <View style={styles.weekCirclePast} />
                  )}
                </View>
              );
            })}
          </View>
          <RNText style={styles.weekSummary}>{weekComplete} de 7 dias completos esta semana.</RNText>
        </Animated.View>

        {/* Card Como você está indo — grid 2x2 */}
        <Animated.View style={[styles.comoIndoWrap, entrance3]}>
          <Text style={styles.cardTitle}>Como você está indo</Text>
          <View style={styles.comoIndoGrid}>
            <View style={styles.comoIndoCard}>
              <Ionicons name="barbell-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{weeklyMetrics.treinos}</RNText>
              <RNText style={styles.comoIndoLabel}>treinos</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="water-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{weeklyMetrics.agua}</RNText>
              <RNText style={styles.comoIndoLabel}>dias com água</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="moon-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{weeklyMetrics.sono}</RNText>
              <RNText style={styles.comoIndoLabel}>noites bem dormidas</RNText>
            </View>
            <View style={styles.comoIndoCard}>
              <Ionicons name="restaurant-outline" size={28} color={colors.sageDark} style={styles.comoIndoIcon} />
              <RNText style={styles.comoIndoNum}>{weeklyMetrics.alimentacao}</RNText>
              <RNText style={styles.comoIndoLabel}>dias na alimentação</RNText>
            </View>
          </View>
          <View style={styles.comoIndoInsight}>
            <Ionicons name="bulb-outline" size={16} color={colors.sageDark} style={{ marginRight: 8 }} />
            <RNText style={styles.comoIndoInsightText}>
              {weeklyMetrics.totalCheckins === 0
                ? 'Faça seu primeiro check-in para ver suas métricas aqui 🌱'
                : weeklyMetrics.desafiosAlimentares === 0
                ? 'Semana perfeita na alimentação! 🎉'
                : weeklyMetrics.desafiosAlimentares === 1
                ? '1 dia com desafio alimentar essa semana. Totalmente normal 💚'
                : `${weeklyMetrics.desafiosAlimentares} dias com desafios essa semana — entender o contexto ajuda a melhorar 🌱`}
            </RNText>
          </View>
        </Animated.View>

        {/* Card Não esqueça */}
        <Animated.View style={entrance4}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#C4846A',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <RNText
              style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 }}
            >
              Não esqueça
            </RNText>

            {/* Item Registrar peso */}
            <TouchableOpacity
              onPress={() => router.push('/registro-peso')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FAFAF8',
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E8EDE8',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#EBF3EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="scale-outline" size={22} color="#5C7A5C" />
              </View>
              <View style={{ flex: 1 }}>
                <RNText style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>
                  Registrar peso
                </RNText>
                <RNText style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2 }}>
                  {diasDesdeUltimaPesagem === null
                    ? 'Atualize seu peso atual'
                    : diasDesdeUltimaPesagem === 0
                      ? 'Peso atualizado hoje ✓'
                      : diasDesdeUltimaPesagem === 1
                        ? 'Última atualização ontem'
                        : diasDesdeUltimaPesagem < 7
                          ? `Atualizado há ${diasDesdeUltimaPesagem} dias`
                          : `Não atualiza há ${diasDesdeUltimaPesagem} dias`}
                </RNText>
              </View>
              {diasDesdeUltimaPesagem !== null && diasDesdeUltimaPesagem >= 7 ? (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#C4846A',
                  }}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#C8DEC8" />
              )}
            </TouchableOpacity>

            {/* Item GLP-1 */}
            {usaGlp1 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/glp1')}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FAFAF8',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E8EDE8',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#EBF3EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="medical-outline" size={22} color="#5C7A5C" />
                </View>
                <View style={{ flex: 1 }}>
                  <RNText style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>
                    Próxima aplicação GLP-1
                  </RNText>
                  <RNText style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2 }}>
                    {proximaAplicacaoDias != null
                      ? `em ${proximaAplicacaoDias} dias`
                      : 'Registre sua primeira aplicação'}
                  </RNText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C8DEC8" />
              </TouchableOpacity>
            )}
          </View>
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
          <Pressable style={styles.modalResumoBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalResumoTitle}>Resumo do seu dia</RNText>
            {todayCheckin && (() => {
              const alimentacaoLabel =
                todayCheckin.adesaoAlimentar === 'sim'
                  ? { text: '✅ Sim', color: '#1A1A1A' }
                  : todayCheckin.adesaoAlimentar === 'mais_ou_menos'
                  ? { text: 'Mais ou menos', color: '#C4846A' }
                  : { text: '❌ Não', color: '#1A1A1A' };
              const humorLabel =
                todayCheckin.humor === 'bem'
                  ? '😊 Bem'
                  : todayCheckin.humor === 'normal'
                  ? '😐 Normal'
                  : '😔 Cansada';
              const rows: { label: string; value: string; valueColor?: string }[] = [
                { label: 'Treinou', value: todayCheckin.treinou ? '✅ Sim' : '❌ Não' },
                { label: 'Bebeu água', value: todayCheckin.bebeuAgua ? '✅ Sim' : '❌ Não' },
                { label: 'Dormiu bem', value: todayCheckin.dormiuBem ? '✅ Sim' : '❌ Não' },
                { label: 'Alimentação', value: alimentacaoLabel.text, valueColor: alimentacaoLabel.color },
                { label: 'Humor', value: humorLabel },
              ];
              return rows.map((row, idx) => (
                <View key={row.label}>
                  <View style={styles.modalResumoRow}>
                    <RNText style={styles.modalResumoLabel}>{row.label}</RNText>
                    <RNText style={[styles.modalResumoValue, row.valueColor ? { color: row.valueColor } : null]}>
                      {row.value}
                    </RNText>
                  </View>
                  {idx < rows.length - 1 && <View style={styles.modalResumoDivider} />}
                </View>
              ));
            })()}
            <TouchableOpacity
              onPress={() => setModalResumoVisible(false)}
              activeOpacity={0.85}
              style={styles.modalResumoBtn}
            >
              <LinearGradient
                colors={gradients.gradientSage}
                style={styles.modalResumoBtnInner}
              >
                <RNText style={styles.modalResumoBtnText}>Fechar</RNText>
              </LinearGradient>
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
      <Modal visible={modalSequenciaVisible} animationType="slide" statusBarTranslucent={false}>
        <View style={styles.modalSequenciaRoot}>
          {/* Header gradiente com streak hero */}
          <LinearGradient
            colors={['#5C7A5C', '#8FAF8F']}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: insets.top + 20,
              paddingBottom: 32,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => setModalSequenciaVisible(false)}
              style={{ position: 'absolute', top: insets.top + 16, right: 16, padding: 4 }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <RNText style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
              Sua Sequência
            </RNText>

            {loadingSequenciaModal ? (
              <View style={{ height: 90, justifyContent: 'center' }}>
                <View style={{ width: 80, height: 24, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }} />
              </View>
            ) : (
              <Animated.Text
                entering={ZoomIn.springify().damping(14)}
                style={{
                  fontSize: 80,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  lineHeight: 90,
                  textAlign: 'center',
                }}
              >
                {streak}
              </Animated.Text>
            )}

            <RNText style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
              dias seguidos
            </RNText>
            <RNText style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>
              Não precisa ser perfeito. Precisa ser consistente.
            </RNText>
          </LinearGradient>

          <ScrollView
            style={styles.modalSequenciaScroll}
            contentContainerStyle={[styles.modalSequenciaContent, { paddingTop: 0, paddingBottom: 32 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Card do Escudo simplificado */}
            <View
              style={{
                backgroundColor: shieldUsedThisWeek ? '#F5F5F5' : '#FBF0EB',
                borderRadius: 16,
                padding: 16,
                marginHorizontal: 20,
                marginTop: 20,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6,
                  gap: 10,
                }}
              >
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={shieldUsedThisWeek ? '#BDBDBD' : '#C4846A'}
                />
                <RNText
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: shieldUsedThisWeek ? '#BDBDBD' : '#1A1A1A',
                    flex: 1,
                  }}
                >
                  {shieldUsedThisWeek ? 'Escudo usado esta semana' : 'Escudo disponível esta semana'}
                </RNText>
                {!shieldUsedThisWeek && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#5C7A5C' }} />
                )}
              </View>
              <RNText style={{ fontSize: 13, color: '#6B6B6B', marginLeft: 30 }}>
                {shieldUsedThisWeek
                  ? 'Renova na próxima segunda-feira.'
                  : 'Ative no check-in para proteger sua sequência.'}
              </RNText>
            </View>

            {/* Marcos visuais horizontais */}
            <View style={{ marginHorizontal: 20, marginTop: 24 }}>
              <RNText style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 }}>
                Seus marcos
              </RNText>

              {loadingSequenciaModal ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 30 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: '#F0F0F0',
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 8,
                  }}
                >
                  {MARCOS_SEQUENCIA.flatMap((marco, index) => {
                    const conquistado = streak >= marco;
                    const circle = (
                      <View key={`c-${marco}`} style={{ alignItems: 'center' }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: conquistado ? '#5C7A5C' : '#FFFFFF',
                            borderWidth: conquistado ? 0 : 1.5,
                            borderColor: '#E8EDE8',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: conquistado ? 0.15 : 0.05,
                            shadowRadius: 3,
                            elevation: 2,
                          }}
                        >
                          {conquistado ? (
                            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                          ) : (
                            <Ionicons name="lock-closed-outline" size={16} color="#BDBDBD" />
                          )}
                        </View>
                        <RNText
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: conquistado ? '#5C7A5C' : '#BDBDBD',
                            marginTop: 8,
                          }}
                        >
                          {marco}
                        </RNText>
                        <RNText style={{ fontSize: 11, color: conquistado ? '#8FAF8F' : '#BDBDBD' }}>
                          dias
                        </RNText>
                      </View>
                    );
                    const line =
                      index < MARCOS_SEQUENCIA.length - 1 ? (
                        <View
                          key={`l-${marco}`}
                          style={{
                            flex: 1,
                            height: 2,
                            marginBottom: 30,
                            marginHorizontal: 4,
                            backgroundColor:
                              streak >= MARCOS_SEQUENCIA[index + 1] ? '#5C7A5C' : '#E8EDE8',
                          }}
                        />
                      ) : null;
                    return [circle, line].filter(Boolean);
                  })}
                </View>
              )}

              {/* Próximo marco */}
              {!loadingSequenciaModal && (() => {
                const proximo = MARCOS_SEQUENCIA.find((m) => streak < m);
                if (!proximo) {
                  return (
                    <RNText
                      style={{
                        fontSize: 14,
                        color: '#5C7A5C',
                        textAlign: 'center',
                        marginTop: 16,
                        fontWeight: '600',
                      }}
                    >
                      Todos os marcos conquistados! 🏆
                    </RNText>
                  );
                }
                return (
                  <RNText style={{ fontSize: 14, color: '#6B6B6B', textAlign: 'center', marginTop: 16 }}>
                    Faltam <RNText style={{ fontWeight: '700', color: '#5C7A5C' }}>{proximo - streak} dias</RNText> para {proximo} 🔥
                  </RNText>
                );
              })()}
            </View>

            {/* Botões finais */}
            <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 0, gap: 10 }}>
              {/* Frase de identidade */}
              <LinearGradient
                colors={['#5C7A5C', '#8FAF8F']}
                style={{
                  borderRadius: 14,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 24,
                }}
              >
                {loadingSequenciaModal ? (
                  <View style={{ width: '70%', height: 16, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 8 }} />
                ) : (
                  <RNText
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {getFraseIdentidade(streak)}
                  </RNText>
                )}
              </LinearGradient>

              {/* Check-in */}
              <TouchableOpacity
                onPress={() => {
                  setModalSequenciaVisible(false);
                  if (!checkinFeito) router.push('/(tabs)/checkin');
                }}
                style={{
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: checkinFeito ? '#EBF3EB' : '#C4846A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 24,
                }}
              >
                <RNText
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: checkinFeito ? '#5C7A5C' : '#FFFFFF',
                    textAlign: 'center',
                  }}
                >
                  {checkinFeito ? 'Check-in feito hoje ✓' : 'Fazer check-in de hoje'}
                </RNText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  emptyStateTitle: {
    ...typography.titleSmall,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  bellBtn: { padding: 4, position: 'relative' },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C4846A',
    borderWidth: 1.5,
    borderColor: colors.background,
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
  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    ...shadows.card,
  },
  weekCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  weekCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekCircleWrap: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B6B6B',
  },
  weekCircleDone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5C7A5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCircleToday: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#5C7A5C',
  },
  weekCirclePast: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C8DEC8',
    backgroundColor: '#F5F8F5',
  },
  weekCircleFuture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    backgroundColor: '#FAFAF8',
  },
  weekSummary: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 14,
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
  comoIndoInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF3EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  comoIndoInsightText: {
    flex: 1,
    fontSize: 14,
    color: '#5C7A5C',
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
  // Modal Resumo do check-in (novo design)
  modalResumoBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalResumoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalResumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalResumoDivider: {
    height: 1,
    backgroundColor: '#E8EDE8',
  },
  modalResumoLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B6B6B',
  },
  modalResumoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalResumoBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalResumoBtnInner: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResumoBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
