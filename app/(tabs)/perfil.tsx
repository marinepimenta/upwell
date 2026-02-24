import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import { colors, gradients, spacing, borderRadius, typography } from '@/constants/theme';
import { getOnboardingData, OnboardingData } from '@/utils/storage';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export default function PerfilScreen() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getOnboardingData();
    setOnboardingData(data);
    setLoading(false);
  };

  const handleLogout = () => {
    setConfigModalVisible(false);
    Alert.alert(
      'Resetar app',
      'Isso vai limpar todos os dados e voltar para o onboarding. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/login');
            } catch (error) {
              console.error('Error clearing storage:', error);
              Alert.alert('Erro', 'Não foi possível resetar o app. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sageDark} />
        </View>
      </SafeAreaView>
    );
  }

  const greeting = getGreeting();
  const displayName = onboardingData?.name?.trim() || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
        <Text style={styles.headerTitle}>
          {greeting}, {displayName}
        </Text>
        <TouchableOpacity
          onPress={() => setConfigModalVisible(true)}
          style={styles.settingsButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus dados</Text>

          {(onboardingData?.initialWeight != null && onboardingData.initialWeight > 0) ||
          (onboardingData?.currentWeight != null && onboardingData.currentWeight > 0) ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso inicial:</Text>
              <Text style={styles.infoValue}>
                {(onboardingData?.initialWeight ?? onboardingData?.currentWeight ?? 0).toFixed(1)} kg
              </Text>
            </View>
          ) : null}

          {onboardingData?.onboardingDate ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de início:</Text>
              <Text style={styles.infoValue}>{formatDate(onboardingData.onboardingDate)}</Text>
            </View>
          ) : null}

          {onboardingData?.glp1Status ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GLP-1:</Text>
              <Text style={styles.infoValue}>
                {onboardingData.glp1Status === 'using' && 'Uso atualmente'}
                {onboardingData.glp1Status === 'used' && 'Já usei'}
                {onboardingData.glp1Status === 'never' && 'Nunca usei'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.warningText}>
            Esta é uma tela temporária para desenvolvimento. Use o botão abaixo para resetar o app e
            testar o onboarding novamente.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Sair (resetar app)</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={configModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setConfigModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: Math.min(width - spacing.lg * 2, 400) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações</Text>
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seus dados</Text>
                {onboardingData?.name ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nome:</Text>
                    <Text style={styles.infoValue}>{onboardingData.name}</Text>
                  </View>
                ) : null}
                {onboardingData?.currentWeight != null && onboardingData.currentWeight > 0 ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Peso atual:</Text>
                    <Text style={styles.infoValue}>
                      {onboardingData.currentWeight.toFixed(1)} kg
                    </Text>
                  </View>
                ) : null}
                {onboardingData?.glp1Status ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>GLP-1:</Text>
                    <Text style={styles.infoValue}>
                      {onboardingData.glp1Status === 'using' && 'Uso atualmente'}
                      {onboardingData.glp1Status === 'used' && 'Já usei'}
                      {onboardingData.glp1Status === 'never' && 'Nunca usei'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}>
                <Text style={styles.logoutButtonText}>Sair (resetar app)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  settingsButton: {
    padding: spacing.xs,
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
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.titleSmall,
    color: colors.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
