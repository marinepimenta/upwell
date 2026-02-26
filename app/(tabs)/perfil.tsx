import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { colors, gradients } from '@/constants/theme';
import {
  getProfile,
  getMonthlyMetrics,
  calculateStreak,
  type Profile,
} from '@/lib/database';
import { formatDateBRT } from '@/lib/utils';
import { usePressScale } from '@/hooks/useEntrance';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}


function glp1Label(status: Profile['glp1_status']): string {
  if (status === 'using') return 'Uso atualmente';
  if (status === 'used') return 'Já usei';
  if (status === 'never') return 'Não uso';
  return 'Não informado';
}

function calcularDiasAtivos(programStartDate: string | null): number {
  if (!programStartDate) return 0;
  const inicio = new Date(programStartDate + 'T12:00:00');
  const hoje = new Date();
  inicio.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  const diffMs = hoje.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias + 1);
}

type Metrics = {
  checkins: number;
  weightings: number;
  streak: number;
  trainings: number;
};

export default function PerfilScreen() {
  const router = useRouter();
  const pressSettings = usePressScale();
  const pressEdit = usePressScale();
  const pressLogout = usePressScale();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ checkins: 0, weightings: 0, streak: 0, trainings: 0 });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const p = await getProfile();
    // Fallback: nome do user_metadata se perfil ainda não tiver nome
    if (p && !p.name && user?.user_metadata?.name) {
      p.name = user.user_metadata.name;
    }
    setProfile(p ?? null);
    if (user?.email) setEmail(user.email);
  };

  const loadProfileStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { count: totalCheckins },
      { count: totalPesagens },
      streak,
      mMetrics,
    ] = await Promise.all([
      supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('weight_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      calculateStreak(),
      getMonthlyMetrics(),
    ]);

    setMetrics({
      checkins: totalCheckins ?? 0,
      weightings: totalPesagens ?? 0,
      streak: streak ?? 0,
      trainings: mMetrics?.treinos ?? 0,
    });
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadProfileStats()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const handleLogout = () => {
    setModalVisible(false);
    Alert.alert(
      'Sair',
      'Isso vai encerrar sua sessão. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sageDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <RNText style={styles.errorText}>Não foi possível carregar seu perfil.</RNText>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAll} activeOpacity={0.8}>
            <RNText style={styles.retryBtnText}>Tentar novamente</RNText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile.name?.trim() || '—';
  const initial = displayName !== '—' ? displayName[0].toUpperCase() : '?';
  const dias = calcularDiasAtivos(profile.program_start_date ?? null);

  const historyItems = [
    { icon: 'checkbox-outline' as const, value: metrics.checkins, label: 'check-ins' },
    { icon: 'scale-outline' as const, value: metrics.weightings, label: 'pesagens' },
    { icon: 'flame-outline' as const, value: metrics.streak, label: 'dias sequência' },
    { icon: 'barbell-outline' as const, value: metrics.trainings, label: 'treinos' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
        <RNText style={styles.headerTitle}>
          {getGreeting()}, {displayName} 🌿
        </RNText>
        <Animated.View style={pressSettings.animatedStyle}>
          <TouchableOpacity
            onPressIn={pressSettings.onPressIn}
            onPressOut={pressSettings.onPressOut}
            onPress={() => setModalVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color="#6B6B6B" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Card perfil */}
        <View style={styles.profileCard}>
          <LinearGradient colors={gradients.gradientSage} style={styles.avatar}>
            <RNText style={styles.avatarInitial}>{initial}</RNText>
          </LinearGradient>
          <RNText style={styles.profileName}>{displayName}</RNText>
          <RNText style={styles.profileEmail}>{email || '—'}</RNText>
          <Animated.View style={pressEdit.animatedStyle}>
            <TouchableOpacity
              onPressIn={pressEdit.onPressIn}
              onPressOut={pressEdit.onPressOut}
              onPress={() => router.push('/edit-profile')}
              style={styles.editBtn}
              activeOpacity={0.8}>
              <RNText style={styles.editBtnText}>Editar perfil</RNText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Card Seu programa */}
        <View style={styles.programCard}>
          <RNText style={styles.programTitle}>Seu programa</RNText>

          <View style={styles.programRow}>
            <RNText style={styles.programLabel}>Início</RNText>
            <RNText style={styles.programValue}>
              {profile.program_start_date ? formatDateBRT(profile.program_start_date) : '—'}
            </RNText>
          </View>
          <View style={styles.programDivider} />

          <View style={styles.programRow}>
            <RNText style={styles.programLabel}>Dias ativos</RNText>
            <RNText style={styles.programValue}>
              {profile.program_start_date ? `${dias} dias` : '—'}
            </RNText>
          </View>
          <View style={styles.programDivider} />

          <View style={styles.programRow}>
            <RNText style={styles.programLabel}>Status GLP-1</RNText>
            <RNText style={styles.programValue}>{glp1Label(profile.glp1_status)}</RNText>
          </View>
        </View>

        {/* Card Seu histórico */}
        <View style={styles.historyCard}>
          <RNText style={styles.historyTitle}>Seu histórico</RNText>
          <View style={styles.historyGrid}>
            {historyItems.map((item, idx) => (
              <View key={idx} style={styles.historyCell}>
                <Ionicons name={item.icon} size={22} color={colors.sageDark} />
                <RNText style={styles.historyCellValue}>{item.value}</RNText>
                <RNText style={styles.historyCellLabel}>{item.label}</RNText>
              </View>
            ))}
          </View>
        </View>

        {/* Relatório para consulta */}
        <TouchableOpacity
          onPress={() => router.push('/relatorio')}
          style={styles.reportCard}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color="#5C7A5C" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <RNText style={styles.reportCardTitle}>Relatório para consulta</RNText>
            <RNText style={styles.reportCardSubtitle}>Leve seu histórico para a médica</RNText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8FAF8F" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal configurações */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <RNText style={styles.modalTitle}>Configurações</RNText>
            <Animated.View style={pressLogout.animatedStyle}>
              <TouchableOpacity
                onPressIn={pressLogout.onPressIn}
                onPressOut={pressLogout.onPressOut}
                onPress={handleLogout}
                style={styles.logoutBtn}
                activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <RNText style={styles.logoutBtnText}>Sair da conta</RNText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.sageDark,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  settingsBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },
  // Card perfil
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.sageDark,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.sageDark,
  },
  // Card programa
  programCard: {
    backgroundColor: '#EBF3EB',
    borderRadius: 20,
    padding: 20,
  },
  programTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.sageDark,
    marginBottom: 16,
  },
  programRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  programDivider: {
    height: 1,
    backgroundColor: '#C8DEC8',
  },
  programLabel: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  programValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  // Card histórico
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyCell: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  historyCellValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.sageDark,
  },
  historyCellLabel: {
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reportCardSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  logoutBtn: {
    backgroundColor: '#DC3545',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
