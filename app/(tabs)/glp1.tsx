import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text as ThemedText } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';
import {
  getOnboardingData,
  getGlp1Applications,
  getNextGlp1ApplicationDate,
  saveGlp1Application,
  getGlp1SymptomsRecords,
  saveGlp1SymptomsRecord,
  type Glp1Application,
  type Glp1SymptomsRecord,
} from '@/utils/storage';

const MEDICATIONS = ['Ozempic', 'Mounjaro', 'Wegovy', 'Outro'];
const DOSES = ['0.25mg', '0.5mg', '1mg', '2mg', 'Outro'];
const SYMPTOMS = [
  'Náusea',
  'Falta de apetite',
  'Cansaço',
  'Constipação',
  'Refluxo',
  'Tontura',
  'Bem! Sem sintomas',
];

const EDUCATIVO_ITEMS = [
  {
    id: 'muscle',
    title: '💪 Por que proteger sua massa muscular é essencial',
    content:
      'Durante a perda de peso, o corpo pode usar massa muscular como fonte de energia. Manter a proteína em dia e a atividade física ajuda a preservar músculos e metabolismo.\n\nO treino de força, mesmo leve, sinaliza ao corpo que aquele tecido é necessário. Combinado com ingestão proteica adequada, reduz o risco de sarcopenia.\n\nConsistência vale mais que intensidade: pequenos hábitos diários fazem a diferença a longo prazo.',
  },
  {
    id: 'protein',
    title: '🥗 Proteína e GLP-1: o que você precisa saber',
    content:
      'Medicamentos GLP-1 reduzem o apetite e podem levar a menor ingestão espontânea de proteína. Seu corpo continua precisando de aminoácidos para manter músculos, pele e funções vitais.\n\nPriorize fontes de proteína em cada refeição: ovos, frango, peixe, leguminosas, laticínios. Um alvo prático é cerca de 1,2 a 1,6 g por kg de peso ao dia, conforme orientação da sua médica.\n\nDistribuir a proteína ao longo do dia tende a ser mais eficaz do que concentrar em uma refeição.',
  },
  {
    id: 'stop',
    title: '⚖️ O que acontece quando você para o medicamento',
    content:
      'Ao interromper o uso de GLP-1, o apetite tende a voltar ao padrão anterior. Por isso o foco em hábitos sustentáveis durante o tratamento é tão importante.\n\nManter rotina de alimentação consciente, atividade física e acompanhamento profissional ajuda a consolidar o resultado. A transição deve ser feita sempre com orientação médica.\n\nO UpWell está aqui para apoiar sua rotina e seus registros, mas decisões sobre tratamento são sempre da sua médica.',
  },
];

const DISCLAIMER =
  'Este conteúdo é informativo e não substitui orientação médica. Sempre consulte sua médica antes de tomar decisões sobre seu tratamento.';

function formatDatePtBr(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Glp1CompanionScreen() {
  const [applications, setApplications] = useState<Glp1Application[]>([]);
  const [symptomsRecords, setSymptomsRecords] = useState<Glp1SymptomsRecord[]>([]);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalAplicacaoVisible, setModalAplicacaoVisible] = useState(false);
  const [medication, setMedication] = useState<string | null>(null);
  const [dose, setDose] = useState<string | null>(null);
  const [observation, setObservation] = useState('');

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const [modalEducativoVisible, setModalEducativoVisible] = useState(false);
  const [educativoSelected, setEducativoSelected] = useState<(typeof EDUCATIVO_ITEMS)[0] | null>(null);

  const [modalRelatorioVisible, setModalRelatorioVisible] = useState(false);
  const [relatorioText, setRelatorioText] = useState('');

  const entrance0 = useFadeSlideIn(0);
  const entrance1 = useFadeSlideIn(80);
  const entrance2 = useFadeSlideIn(160);
  const entrance3 = useFadeSlideIn(240);
  const entrance4 = useFadeSlideIn(320);
  const entrance5 = useFadeSlideIn(400);
  const entrance6 = useFadeSlideIn(480);
  const pressRegistrar = usePressScale();
  const pressSalvarSintomas = usePressScale();
  const pressGerarRelatorio = usePressScale();

  const load = async () => {
    const [apps, next, symptoms] = await Promise.all([
      getGlp1Applications(),
      getNextGlp1ApplicationDate(),
      getGlp1SymptomsRecords(),
    ]);
    setApplications(apps.sort((a, b) => b.date.localeCompare(a.date)));
    setNextDate(next);
    setSymptomsRecords(symptoms.sort((a, b) => b.date.localeCompare(a.date)));
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

  const handleConfirmarAplicacao = async () => {
    if (!medication || !dose) return;
    const today = new Date().toISOString().slice(0, 10);
    await saveGlp1Application({
      date: today,
      medication,
      dose,
      observation: observation.trim() || undefined,
    });
    setModalAplicacaoVisible(false);
    setMedication(null);
    setDose(null);
    setObservation('');
    load();
  };

  const toggleSymptom = (s: string) => {
    if (s === 'Bem! Sem sintomas') {
      setSelectedSymptoms(['Bem! Sem sintomas']);
      return;
    }
    setSelectedSymptoms((prev) => {
      const withoutBem = prev.filter((x) => x !== 'Bem! Sem sintomas');
      if (withoutBem.includes(s)) return withoutBem.filter((x) => x !== s);
      return [...withoutBem, s];
    });
  };

  const handleSalvarSintomas = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await saveGlp1SymptomsRecord({ date: today, symptoms: selectedSymptoms });
    setSelectedSymptoms([]);
    load();
  };

  const handleGerarRelatorio = async () => {
    const apps = await getGlp1Applications();
    const symptoms = await getGlp1SymptomsRecords();
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const periodStart = monthAgo.toLocaleDateString('pt-BR');
    const periodEnd = now.toLocaleDateString('pt-BR');

    const appsInPeriod = apps.filter((a) => a.date >= monthAgo.toISOString().slice(0, 10));
    const meds = [...new Set(appsInPeriod.map((a) => a.medication))].join(', ');
    const doses = [...new Set(appsInPeriod.map((a) => a.dose))].join(', ');

    const symptomsInPeriod = symptoms.filter((s) => s.date >= monthAgo.toISOString().slice(0, 10));
    const symptomCount: Record<string, number> = {};
    symptomsInPeriod.forEach((r) => {
      r.symptoms.forEach((s) => {
        if (s !== 'Bem! Sem sintomas') symptomCount[s] = (symptomCount[s] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, n]) => `${s} (${n}x)`)
      .join(', ') || 'Nenhum sintoma registrado';

    let text = `Relatório UpWell - GLP-1 Companion\n`;
    text += `Período: ${periodStart} a ${periodEnd}\n\n`;
    text += `Medicamentos usados: ${meds || 'Nenhum registro'}\n`;
    text += `Doses: ${doses || '-'}\n\n`;
    text += `Sintomas mais frequentes: ${topSymptoms}\n\n`;
    const withObs = appsInPeriod.filter((a) => a.observation);
    if (withObs.length > 0) {
      text += `Observações: ${withObs.map((a) => `${a.date}: ${a.observation}`).join('; ')}\n`;
    }
    setRelatorioText(text);
    setModalRelatorioVisible(true);
  };

  const handleCompartilhar = async () => {
    try {
      await Share.share({
        message: relatorioText,
        title: 'Relatório UpWell - GLP-1',
      });
    } catch (_) {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

  const last4Apps = applications.slice(0, 4);
  const last4Symptoms = symptomsRecords.slice(0, 4);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
          <ThemedText style={styles.headerTitle}>GLP-1 Companion</ThemedText>
          <RNText style={styles.headerSub}>Seu acompanhamento personalizado 💉</RNText>
        </LinearGradient>

        <View style={styles.disclaimerBanner}>
          <RNText style={styles.disclaimerText}>
            ℹ️ O UpWell não substitui acompanhamento médico. Use este espaço para organizar suas informações.
          </RNText>
        </View>

        {/* Bloco 1 — Próxima aplicação */}
        <Animated.View style={[styles.card, styles.cardAplicacao, entrance0]}>
          <ThemedText style={styles.cardTitle}>Próxima aplicação</ThemedText>
          <RNText style={styles.nextDateText}>
            {nextDate ? formatDatePtBr(nextDate) : 'Registre sua primeira aplicação abaixo'}
          </RNText>
          <Animated.View style={pressRegistrar.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressRegistrar.onPressIn}
              onPressOut={pressRegistrar.onPressOut}
              onPress={() => setModalAplicacaoVisible(true)}
              activeOpacity={1}
            >
              <LinearGradient
                colors={gradients.gradientTerracotta}
                style={[styles.btnRegistrar, shadows.glowTerracotta]}
              >
                <RNText style={styles.btnRegistrarText}>Registrar aplicação de hoje</RNText>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Bloco 2 — Sintomas */}
        <Animated.View style={[styles.card, entrance1]}>
          <ThemedText style={styles.cardTitle}>Como você está se sentindo?</ThemedText>
          <RNText style={styles.cardSubtitle}>
            Registrar sintomas ajuda sua médica a ajustar o tratamento.
          </RNText>
          <View style={styles.chipsRow}>
            {SYMPTOMS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSymptoms.includes(s) && styles.chipSelected]}
                onPress={() => toggleSymptom(s)}
                activeOpacity={0.8}
              >
                <RNText style={[styles.chipText, selectedSymptoms.includes(s) && styles.chipTextSelected]}>
                  {s}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View style={pressSalvarSintomas.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressSalvarSintomas.onPressIn}
              onPressOut={pressSalvarSintomas.onPressOut}
              onPress={handleSalvarSintomas}
              style={styles.btnSalvarSintomas}
              activeOpacity={1}
            >
              <RNText style={styles.btnSalvarSintomasText}>Salvar sintomas de hoje</RNText>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Bloco 3 — Histórico aplicações */}
        <Animated.View style={[styles.card, entrance2]}>
          <ThemedText style={styles.cardTitle}>Suas aplicações</ThemedText>
          {last4Apps.length === 0 ? (
            <RNText style={styles.emptyText}>Registre sua primeira aplicação acima 🌱</RNText>
          ) : (
            <View style={styles.timeline}>
              {last4Apps.map((app, i) => (
                <View key={app.date + i} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  {i < last4Apps.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineContent}>
                    <RNText style={styles.timelineDate}>{formatDatePtBr(app.date)}</RNText>
                    <RNText style={styles.timelineDetail}>
                      {app.medication} — {app.dose}
                      {app.observation ? ` • ${app.observation}` : ''}
                    </RNText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Bloco 4 — Histórico sintomas */}
        <Animated.View style={[styles.card, entrance3]}>
          <ThemedText style={styles.cardTitle}>Padrão de sintomas</ThemedText>
          {last4Symptoms.length === 0 ? (
            <RNText style={styles.emptyText}>Seus sintomas aparecem aqui após o primeiro registro.</RNText>
          ) : (
            <View style={styles.symptomsHistory}>
              {last4Symptoms.map((r) => (
                <View key={r.date} style={styles.symptomsHistoryRow}>
                  <RNText style={styles.symptomsHistoryDate}>{formatDatePtBr(r.date)}</RNText>
                  <View style={styles.symptomsChipsWrap}>
                    {r.symptoms.map((s) => (
                      <View key={s} style={styles.chipSmall}>
                        <RNText style={styles.chipSmallText}>{s}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Bloco 5 — Conteúdo educativo */}
        <Animated.View style={[styles.cardEducativo, entrance4]}>
          <ThemedText style={styles.cardTitle}>Saiba mais</ThemedText>
          {EDUCATIVO_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.educativoItem}
              onPress={() => {
                setEducativoSelected(item);
                setModalEducativoVisible(true);
              }}
              activeOpacity={0.8}
            >
              <RNText style={styles.educativoItemText}>{item.title}</RNText>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Bloco 6 — Relatório */}
        <Animated.View style={[styles.cardRelatorio, entrance5]}>
          <ThemedText style={styles.cardTitle}>Leve para sua consulta</ThemedText>
          <RNText style={styles.relatorioDesc}>
            Resumo das suas aplicações e sintomas do último mês, pronto para mostrar para sua médica.
          </RNText>
          <Animated.View style={pressGerarRelatorio.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressGerarRelatorio.onPressIn}
              onPressOut={pressGerarRelatorio.onPressOut}
              onPress={handleGerarRelatorio}
              style={styles.btnGerarRelatorio}
              activeOpacity={1}
            >
              <RNText style={styles.btnGerarRelatorioText}>Gerar relatório</RNText>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Modal Registrar aplicação */}
      <Modal visible={modalAplicacaoVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setModalAplicacaoVisible(false)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>Registrar aplicação de hoje</ThemedText>
            <RNText style={styles.modalLabel}>Medicamento</RNText>
            <View style={styles.chipsRow}>
              {MEDICATIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, medication === m && styles.chipSelected]}
                  onPress={() => setMedication(m)}
                  activeOpacity={0.8}
                >
                  <RNText style={[styles.chipText, medication === m && styles.chipTextSelected]}>{m}</RNText>
                </TouchableOpacity>
              ))}
            </View>
            <RNText style={styles.modalLabel}>Dose</RNText>
            <View style={styles.chipsRow}>
              {DOSES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, dose === d && styles.chipSelected]}
                  onPress={() => setDose(d)}
                  activeOpacity={0.8}
                >
                  <RNText style={[styles.chipText, dose === d && styles.chipTextSelected]}>{d}</RNText>
                </TouchableOpacity>
              ))}
            </View>
            <RNText style={styles.modalLabel}>Alguma observação? (opcional)</RNText>
            <TextInput
              style={styles.inputObs}
              placeholder="Ex: local de aplicação, reação"
              placeholderTextColor={colors.textSecondary}
              value={observation}
              onChangeText={setObservation}
              multiline
            />
            <TouchableOpacity
              style={[styles.btnConfirmar, (!medication || !dose) && styles.btnConfirmarDisabled]}
              onPress={handleConfirmarAplicacao}
              disabled={!medication || !dose}
              activeOpacity={0.8}
            >
              <RNText style={styles.btnConfirmarText}>Confirmar registro</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Educativo */}
      <Modal visible={modalEducativoVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalEducativoVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            {educativoSelected && (
              <>
                <ThemedText style={styles.modalTitle}>{educativoSelected.title}</ThemedText>
                <RNText style={styles.modalParagraph}>{educativoSelected.content}</RNText>
                <RNText style={styles.disclaimerModal}>{DISCLAIMER}</RNText>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setModalEducativoVisible(false)}
                  activeOpacity={0.8}
                >
                  <RNText style={styles.modalBtnText}>Fechar</RNText>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Relatório */}
      <Modal visible={modalRelatorioVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalRelatorioVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>Resumo para sua médica</ThemedText>
            <RNText style={styles.relatorioModalText}>{relatorioText}</RNText>
            <TouchableOpacity style={styles.btnCompartilhar} onPress={handleCompartilhar} activeOpacity={0.8}>
              <RNText style={styles.btnCompartilharText}>Compartilhar</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setModalRelatorioVisible(false)}
              activeOpacity={0.8}
            >
              <RNText style={styles.modalBtnText}>Fechar</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
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
    marginBottom: 8,
    borderRadius: radius.card,
  },
  headerTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSub: {
    ...typography.bodySmall,
    color: colors.sage,
  },
  disclaimerBanner: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: colors.terracottaLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.terracotta,
  },
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  cardAplicacao: {
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  },
  cardTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  nextDateText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  btnRegistrar: {
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  btnRegistrarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.borderSage,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  btnSalvarSintomas: {
    backgroundColor: colors.sage,
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  btnSalvarSintomasText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timeline: {},
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.sage,
    marginTop: 4,
    marginRight: spacing.sm,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 18,
    bottom: -spacing.sm,
    width: 2,
    backgroundColor: colors.sageLight,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  timelineDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  symptomsHistory: {},
  symptomsHistoryRow: {
    marginBottom: spacing.md,
  },
  symptomsHistoryDate: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  symptomsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chipSmall: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.sageLight,
  },
  chipSmallText: {
    fontSize: 12,
    color: colors.sageDark,
  },
  cardEducativo: {
    backgroundColor: colors.sageLight,
    opacity: 0.95,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  educativoItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSage,
  },
  educativoItemText: {
    ...typography.body,
    color: colors.text,
  },
  cardRelatorio: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  relatorioDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  btnGerarRelatorio: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.sage,
    alignSelf: 'flex-start',
  },
  btnGerarRelatorioText: {
    ...typography.label,
    color: colors.sageDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    margin: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
  },
  modalLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  inputObs: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 60,
    marginBottom: spacing.md,
  },
  btnConfirmar: {
    backgroundColor: colors.sage,
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  btnConfirmarDisabled: {
    opacity: 0.5,
  },
  btnConfirmarText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  modalParagraph: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    color: colors.text,
  },
  disclaimerModal: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  modalBtn: {
    backgroundColor: colors.sageDark,
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  modalBtnText: {
    ...typography.label,
    color: colors.white,
  },
  relatorioModalText: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.md,
    maxHeight: 300,
  },
  btnCompartilhar: {
    backgroundColor: colors.sage,
    padding: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnCompartilharText: {
    ...typography.label,
    color: colors.white,
  },
});
