import { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn, usePressScale } from '@/hooks/useEntrance';
import {
  type Glp1Application,
  type Glp1SymptomsRecord,
} from '@/utils/storage';
import {
  getGlp1Applications,
  getNextGlp1ApplicationDate,
  saveGlp1Application,
  updateGlp1Application,
  getGlp1Symptoms,
} from '@/lib/database';
import { getTodayBRT, formatDateBRT, formatDateFullBRT } from '@/lib/utils';

const MEDICATIONS = ['Ozempic', 'Mounjaro', 'Wegovy', 'Outro'];
const DOSES = ['0.25mg', '0.5mg', '1mg', '2mg', 'Outro'];

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

const DISCLAIMER_PAGE_END =
  'Este app não substitui acompanhamento médico. Use este espaço para organizar suas informações.';
const DISCLAIMER_SHORT = 'Este conteúdo não substitui orientação médica.';

function daysUntil(nextDateStr: string): number {
  const today = getTodayBRT();
  const [y, m, d] = nextDateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  next.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Shadow md do design system
const shadowMd = {
  shadowColor: '#5C7A5C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

function EducativoRow({
  item,
  onPress,
  isLast,
}: {
  item: (typeof EDUCATIVO_ITEMS)[0];
  onPress: () => void;
  isLast: boolean;
}) {
  const press = usePressScale();
  return (
    <Animated.View style={press.animatedStyle}>
      <TouchableOpacity
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={onPress}
        activeOpacity={1}
        style={[styles.educativoRow, !isLast && styles.educativoRowBorder]}
      >
        <RNText style={styles.educativoRowText} numberOfLines={2}>
          {item.title}
        </RNText>
        <Ionicons name="chevron-forward" size={18} color="#8FAF8F" />
      </TouchableOpacity>
    </Animated.View>
  );
}

function formatNextApplicationDate(dateStr: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return cap(formatDateFullBRT(dateStr));
}

export default function Glp1CompanionScreen() {
  const [applications, setApplications] = useState<Glp1Application[]>([]);
  const [symptomsRecords, setSymptomsRecords] = useState<Glp1SymptomsRecord[]>([]);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalAplicacaoVisible, setModalAplicacaoVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [medication, setMedication] = useState<string | null>(null);
  const [dose, setDose] = useState<string | null>(null);
  const [observation, setObservation] = useState('');

  const [savingApplication, setSavingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const [modalEducativoVisible, setModalEducativoVisible] = useState(false);
  const [educativoSelected, setEducativoSelected] = useState<(typeof EDUCATIVO_ITEMS)[0] | null>(null);

  const [modalRelatorioVisible, setModalRelatorioVisible] = useState(false);
  const [relatorioText, setRelatorioText] = useState('');

  const aplicacaoScrollRef = useRef<ScrollView>(null);

  const entrance0 = useFadeSlideIn(0);
  const entrance1 = useFadeSlideIn(80);
  const entrance2 = useFadeSlideIn(160);
  const entrance3 = useFadeSlideIn(240);
  const entrance4 = useFadeSlideIn(320);
  const entrance5 = useFadeSlideIn(400);
  const entrance6 = useFadeSlideIn(480);
  const pressRegistrar = usePressScale();
  const pressGerarRelatorio = usePressScale();

  const load = async () => {
    setLoading(true);
    const [apps, next, syms] = await Promise.all([
      getGlp1Applications(),
      getNextGlp1ApplicationDate(),
      getGlp1Symptoms(),
    ]);
    setApplications((apps || []).sort((a, b) => b.date.localeCompare(a.date)));
    setNextDate(next);
    setSymptomsRecords((syms || []).sort((a, b) => b.date.localeCompare(a.date)));
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

  const resetModal = () => {
    setMedication(null);
    setDose(null);
    setObservation('');
    setEditingId(null);
    setModalAplicacaoVisible(false);
    setShowConfirmModal(false);
    setApplicationError(null);
  };

  const doSaveApplication = async () => {
    if (!medication || !dose) return;
    setSavingApplication(true);
    setApplicationError(null);
    const today = getTodayBRT();
    if (editingId) {
      const { error } = await updateGlp1Application(editingId, {
        medication,
        dose,
        observation: observation.trim() || null,
      });
      if (error) {
        setApplicationError('Erro ao salvar. Tente novamente.');
        setSavingApplication(false);
        return;
      }
    } else {
      const { error } = await saveGlp1Application({
        date: today,
        medication,
        dose,
        observation: observation.trim() || undefined,
      });
      if (error) {
        setApplicationError('Erro ao salvar. Tente novamente.');
        setSavingApplication(false);
        return;
      }
    }
    const apps = await getGlp1Applications();
    setApplications((apps || []).sort((a, b) => b.date.localeCompare(a.date)));
    const next = await getNextGlp1ApplicationDate();
    setNextDate(next);
    resetModal();
    setSavingApplication(false);
  };

  const handleConfirmarAplicacao = async () => {
    if (!medication || !dose) {
      setApplicationError('Selecione o medicamento e a dose');
      return;
    }
    setApplicationError(null);
    const today = getTodayBRT();
    const todayApps = applications.filter((a) => a.date === today);

    if (editingId) {
      await doSaveApplication();
      return;
    }

    const sameMedToday = todayApps.find(
      (a) => a.medication === medication && a.id !== editingId
    );
    if (sameMedToday) {
      setApplicationError(`Você já registrou ${medication} hoje. Edite o registro existente se precisar corrigir.`);
      return;
    }

    if (todayApps.length > 0) {
      setShowConfirmModal(true);
      return;
    }

    await doSaveApplication();
  };

  const generateReport = (): string => {
    if (applications.length === 0) return 'Nenhuma aplicação registrada.';

    const periodo =
      `${formatDateBRT(applications[applications.length - 1].date)} a ${formatDateBRT(applications[0].date)}`;

    const medicamentos = [...new Set(applications.map((a) => a.medication))].join(', ');

    const doses = applications
      .map((a) => `${formatDateBRT(a.date)}: ${a.medication} ${a.dose}`)
      .join('\n');

    const allSymptoms = symptomsRecords.flatMap((s) => s.symptoms);
    const symptomCount = allSymptoms.reduce((acc: Record<string, number>, s: string) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const topSymptoms =
      Object.entries(symptomCount)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([s]) => s)
        .join(', ') || 'Nenhum sintoma registrado';

    const observacoes =
      applications
        .filter((a) => a.observation)
        .map((a) => `${formatDateBRT(a.date)}: ${a.observation}`)
        .join('\n') || 'Nenhuma observação';

    return `RELATÓRIO UPWELL\n\nPeríodo: ${periodo}\nMedicamentos: ${medicamentos}\n\nAplicações:\n${doses}\n\nSintomas mais frequentes: ${topSymptoms}\n\nObservações:\n${observacoes}`;
  };

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleGerarRelatorio = () => router.push('/relatorio');

  const handleCompartilhar = async () => {
    try {
      await Share.share({ message: generateReport() });
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
    <View style={styles.safeArea}>
      {/* Header: gradiente sage 135deg, largura total, do topo */}
      <LinearGradient
        colors={['#5C7A5C', '#8FAF8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBgAbsolute, { height: insets.top + 32 + 72 + 24 }]}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Conteúdo do header: pt-8 pb-6 px-5, ícone branco 80% + título branco, subtítulo branco 70% */}
        <View style={[styles.headerContent, { paddingTop: insets.top + 32, paddingBottom: 24 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="medical-outline" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={styles.headerTextWrap}>
              <RNText style={styles.headerTitle}>GLP-1 Companion</RNText>
              <RNText style={styles.headerSub}>Seu acompanhamento personalizado</RNText>
            </View>
          </View>
        </View>

        {/* Conteúdo abaixo do header: fundo da tela para contraste com o gradiente */}
        <View style={styles.contentWithBg}>
        <Animated.View style={[styles.cardProximaAplicacao, entrance0]}>
          {/* 2a. Linha de info */}
          <View style={styles.cardProximaTop}>
            <View style={styles.cardProximaLeft}>
              <View style={styles.cardProximaIconWrap}>
                <Ionicons name="medical-outline" size={20} color="#C4846A" />
              </View>
              <View>
                <RNText style={styles.cardProximaLabel}>Próxima aplicação</RNText>
                {applications.length > 0 ? (
                  <RNText style={styles.cardProximaMed}>
                    {applications[0].medication} {applications[0].dose}
                  </RNText>
                ) : (
                  <RNText style={styles.cardProximaMedPlaceholder}>—</RNText>
                )}
              </View>
            </View>
            {nextDate ? (
              <View style={styles.cardProximaRight}>
                <RNText style={styles.cardProximaEm}>em</RNText>
                <RNText style={styles.cardProximaDias}>{daysUntil(nextDate)} dias</RNText>
              </View>
            ) : null}
          </View>

          {nextDate ? (
            <>
              {/* 2b. Pill de data */}
              <View style={styles.cardProximaDateBox}>
                <Ionicons name="calendar-outline" size={16} color="rgba(92,122,92,0.6)" style={styles.cardProximaDateIcon} />
                <RNText style={styles.cardProximaDateText}>
                  {formatNextApplicationDate(nextDate)}
                </RNText>
              </View>
            </>
          ) : (
            <RNText style={styles.nextDatePlaceholder}>
              Registre sua primeira aplicação abaixo
            </RNText>
          )}

          {/* 2c. Botão com gradiente terracotta */}
          <Animated.View style={pressRegistrar.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressRegistrar.onPressIn}
              onPressOut={pressRegistrar.onPressOut}
              onPress={() => setModalAplicacaoVisible(true)}
              activeOpacity={1}
              style={styles.btnRegistrarWrap}
            >
              <LinearGradient
                colors={['#C4846A', '#E8A882']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnRegistrar}
              >
                <Ionicons name="medical-outline" size={20} color="#FFFFFF" style={styles.btnRegistrarIcon} />
                <RNText style={styles.btnRegistrarText}>Registrar aplicação de hoje</RNText>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Bloco 2 — Histórico aplicações */}
        <Animated.View style={[styles.card, entrance1]}>
          <ThemedText style={styles.cardTitle}>Suas aplicações</ThemedText>
          {last4Apps.length === 0 ? (
            <RNText style={styles.emptyText}>Registre sua primeira aplicação acima 🌱</RNText>
          ) : (
            <View style={styles.timeline}>
              {last4Apps.map((app, i) => (
                <View key={app.id ?? app.date + i} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  {i < last4Apps.length - 1 && <View style={styles.timelineLine} />}
                  <View style={[styles.timelineContent, styles.timelineContentWithEdit]}>
                    <View>
                      <RNText style={styles.timelineDate}>{formatDateBRT(app.date)}</RNText>
                      <RNText style={styles.timelineDetail}>
                        {app.medication} — {app.dose}
                        {app.observation ? ` • ${app.observation}` : ''}
                      </RNText>
                    </View>
                    {app.id ? (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(app.id!);
                          setMedication(app.medication);
                          setDose(app.dose);
                          setObservation(app.observation || '');
                          setModalAplicacaoVisible(true);
                        }}
                        style={styles.editBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color="#8FAF8F" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Bloco 3 — Sintomas registrados */}
        <Animated.View style={[styles.card, entrance2]}>
          <ThemedText style={styles.cardTitle}>Sintomas registrados</ThemedText>
          <RNText style={styles.sintomasRegistradosSubtitle}>
            Registrados durante seus check-ins diários.
          </RNText>
          {last4Symptoms.length === 0 ? (
            <RNText style={styles.emptyText}>Seus sintomas aparecerão aqui após o check-in diário 🌱</RNText>
          ) : (
            <View style={styles.symptomsHistory}>
              {last4Symptoms.map((r) => (
                <View key={r.date} style={styles.symptomsHistoryRow}>
                  <RNText style={styles.symptomsHistoryDate}>{formatDateBRT(r.date)}</RNText>
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

        {/* Bloco 5 — Saiba mais */}
        <Animated.View style={[styles.cardSaibaMais, entrance4]}>
          <RNText style={styles.saibaMaisTitle}>Saiba mais</RNText>
          {EDUCATIVO_ITEMS.map((item, index) => (
            <EducativoRow
              key={item.id}
              item={item}
              onPress={() => {
                setEducativoSelected(item);
                setModalEducativoVisible(true);
              }}
              isLast={index === EDUCATIVO_ITEMS.length - 1}
            />
          ))}
        </Animated.View>

        {/* Bloco 6 — Leve para sua consulta */}
        <Animated.View style={[styles.cardLeveConsulta, entrance5]}>
          <RNText style={styles.leveConsultaTitle}>Leve para sua consulta</RNText>
          <RNText style={styles.leveConsultaDesc}>
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
              <Ionicons name="document-text-outline" size={18} color="#5C7A5C" style={styles.btnGerarRelatorioIcon} />
              <RNText style={styles.btnGerarRelatorioText}>Gerar relatório</RNText>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Disclaimer no final da página */}
        <View style={styles.disclaimerEnd}>
          <RNText style={styles.disclaimerEndText}>{DISCLAIMER_PAGE_END}</RNText>
        </View>
        </View>
      </ScrollView>

      {/* Modal Registrar aplicação */}
      <Modal visible={modalAplicacaoVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable style={styles.modalOverlay} onPress={resetModal} />
          <View style={[styles.bottomSheet, { maxHeight: '85%' }]}>
            <ScrollView
              ref={aplicacaoScrollRef}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.modalTitle}>
                {editingId ? 'Editar aplicação' : 'Registrar aplicação de hoje'}
              </ThemedText>
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
                onFocus={() => {
                  setTimeout(() => {
                    aplicacaoScrollRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
              {applicationError ? (
                <RNText style={styles.errorText}>{applicationError}</RNText>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.btnConfirmar,
                  ((!medication || !dose) || savingApplication) && styles.btnConfirmarDisabled,
                  { marginTop: 24 },
                ]}
                onPress={handleConfirmarAplicacao}
                disabled={!medication || !dose || savingApplication}
                activeOpacity={0.8}
              >
                {savingApplication ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <RNText style={styles.btnConfirmarText}>
                  {editingId ? 'Salvar alterações' : 'Confirmar registro'}
                </RNText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal confirmação: segundo medicamento no mesmo dia */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowConfirmModal(false)}>
          <Pressable style={styles.confirmModalBox} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.confirmModalTitle}>Registrar outro medicamento?</RNText>
            <RNText style={styles.confirmModalText}>
              Você já tem uma aplicação registrada hoje. Deseja adicionar outra de medicamento diferente?
            </RNText>
            <View style={styles.confirmModalBtns}>
              <TouchableOpacity
                style={styles.confirmModalBtnCancel}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <RNText style={styles.confirmModalBtnCancelText}>Cancelar</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalBtnConfirmWrap}
                onPress={() => {
                  setShowConfirmModal(false);
                  doSaveApplication();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradients.gradientSage}
                  style={[StyleSheet.absoluteFill, styles.confirmModalBtnConfirm]}
                />
                <RNText style={styles.confirmModalBtnConfirmText}>Confirmar</RNText>
              </TouchableOpacity>
            </View>
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
                <RNText style={styles.disclaimerModal}>{DISCLAIMER_SHORT}</RNText>
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
            <ScrollView style={styles.relatorioModalScroll} showsVerticalScrollIndicator={false}>
              <RNText style={styles.relatorioModalText}>{relatorioText}</RNText>
            </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 100 },
  contentWithBg: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerBgAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#8FAF8F',
    paddingTop: spacing.md,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  disclaimerEnd: {
    paddingVertical: 24,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: 40,
  },
  disclaimerEndText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardProximaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardProximaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardProximaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(196,132,106,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardProximaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardProximaMed: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  cardProximaMedPlaceholder: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  cardProximaRight: {
    alignItems: 'flex-end',
  },
  cardProximaEm: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6B6B',
    marginBottom: 2,
  },
  cardProximaDias: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5C7A5C',
    lineHeight: 26,
  },
  cardProximaDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,237,232,0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 10,
  },
  cardProximaDateIcon: {
    marginRight: 0,
  },
  cardProximaDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
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
  cardProximaAplicacao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: -12,
    marginBottom: spacing.lg,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  btnRegistrarWrap: {
    width: '100%',
  },
  btnRegistrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  btnRegistrarIcon: {
    marginRight: 8,
  },
  btnRegistrarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardAplicacao: {
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  },
  cardTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.sm,
  },
  sintomasRegistradosSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: spacing.md,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardSintomas: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.lg,
    ...shadowMd,
  },
  sintomasTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sintomasSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B6B6B',
    marginTop: 4,
  },
  sintomasChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  sintomaChipTouch: {
    alignSelf: 'flex-start',
  },
  sintomaChipInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sintomaChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  sintomaChipTextSelected: {
    fontWeight: '600',
    color: '#5C7A5C',
  },
  btnSalvarSintomasWrap: {
    marginTop: 16,
  },
  btnSalvarSintomas: {
    width: '100%',
    height: 52,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#5C7A5C',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSalvarSintomasText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C7A5C',
  },
  nextDateText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.sageDark,
    marginBottom: 4,
  },
  nextMedicationText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  nextDatePlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
  timelineContentWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editBtn: {
    padding: 8,
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
  cardSaibaMais: {
    backgroundColor: '#EBF3EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.lg,
  },
  saibaMaisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C7A5C',
    marginBottom: 16,
  },
  educativoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  educativoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#C8DEC8',
  },
  educativoRowText: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  cardLeveConsulta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    ...shadowMd,
  },
  leveConsultaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  leveConsultaDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B6B6B',
    lineHeight: 22,
    marginBottom: 16,
  },
  btnGerarRelatorio: {
    width: '100%',
    height: 52,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#5C7A5C',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGerarRelatorioIcon: {
    marginRight: 8,
  },
  btnGerarRelatorioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C7A5C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    minHeight: 80,
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
  relatorioModalScroll: {
    maxHeight: 280,
    marginBottom: spacing.md,
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
  confirmModalBox: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 24,
    marginHorizontal: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  confirmModalText: {
    fontSize: 15,
    color: '#6B6B6B',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.sage,
    alignItems: 'center',
  },
  confirmModalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.sageDark,
  },
  confirmModalBtnConfirmWrap: {
    flex: 1,
    borderRadius: radius.button,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  confirmModalBtnConfirm: {
    borderRadius: radius.button,
  },
  confirmModalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  errorText: {
    fontSize: 14,
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  symptomSavedText: {
    fontSize: 14,
    color: '#5C7A5C',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
