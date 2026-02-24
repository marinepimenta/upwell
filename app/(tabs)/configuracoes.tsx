import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Themed';
import { UpWellColors } from '@/constants/Colors';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { getOnboardingData, OnboardingData } from '@/utils/storage';

export default function ConfiguracoesScreen() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getOnboardingData();
    setOnboardingData(data);
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Resetar app',
      'Isso vai limpar todos os dados e voltar para o onboarding. Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpar todo o AsyncStorage
              await AsyncStorage.clear();
              // Redirecionar para onboarding
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
          <ActivityIndicator size="large" color={UpWellColors.sageDark} />
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
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus dados</Text>
          
          {onboardingData?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>{onboardingData.name}</Text>
            </View>
          )}

          {onboardingData?.currentWeight && onboardingData.currentWeight > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso atual:</Text>
              <Text style={styles.infoValue}>
                {onboardingData.currentWeight.toFixed(1)} kg
              </Text>
            </View>
          )}

          {onboardingData?.glp1Status && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GLP-1:</Text>
              <Text style={styles.infoValue}>
                {onboardingData.glp1Status === 'using' && 'Uso atualmente'}
                {onboardingData.glp1Status === 'used' && 'Já usei'}
                {onboardingData.glp1Status === 'never' && 'Nunca usei'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.warningText}>
            Esta é uma tela temporária para desenvolvimento. Use o botão abaixo para resetar o app e testar o onboarding novamente.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Sair (resetar app)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UpWellColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: UpWellColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100, // Espaço para tab bar + home indicator
  },
  title: {
    ...typography.title,
    fontSize: 28,
    color: UpWellColors.text,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: UpWellColors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UpWellColors.borderLight,
  },
  infoLabel: {
    ...typography.body,
    color: UpWellColors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    color: UpWellColors.text,
  },
  warningText: {
    ...typography.bodySmall,
    color: UpWellColors.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#DC3545', // Vermelho para ação destrutiva
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '600',
    color: UpWellColors.surface,
  },
});
