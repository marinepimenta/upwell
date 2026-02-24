import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text as ThemedText } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn } from '@/hooks/useEntrance';
import { getStreak } from '@/utils/storage';

const FEED_ITEMS = [
  { id: '1', icon: '🎉', text: 'Alguém completou 30 dias consecutivos', time: 'há 12 minutos' },
  { id: '2', icon: '💪', text: 'Alguém fez check-in por 7 dias seguidos pela primeira vez', time: 'há 34 minutos' },
  { id: '3', icon: '🌱', text: 'Alguém completou a primeira semana na comunidade', time: 'há 1 hora' },
  { id: '4', icon: '⚖️', text: 'Alguém registrou o peso pela quarta semana consecutiva', time: 'há 2 horas' },
  { id: '5', icon: '🛡️', text: 'Alguém usou o escudo e manteve a sequência', time: 'há 3 horas' },
  { id: '6', icon: '🏋️', text: 'Alguém treinou por 5 dias essa semana', time: 'há 5 horas' },
];

function FeedItemCard({
  item,
  delay,
}: {
  item: (typeof FEED_ITEMS)[0];
  delay: number;
}) {
  const entrance = useFadeSlideIn(delay);
  return (
    <Animated.View style={[styles.feedItem, entrance]}>
      <View style={styles.feedItemLeftBorder} />
      <RNText style={styles.feedIcon}>{item.icon}</RNText>
      <View style={styles.feedContent}>
        <ThemedText style={styles.feedText}>{item.text}</ThemedText>
        <RNText style={styles.feedTime}>{item.time}</RNText>
      </View>
    </Animated.View>
  );
}

export default function ComunidadeScreen() {
  const [streak, setStreak] = useState(0);

  const load = async () => {
    const s = await getStreak();
    setStreak(s);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.gradientHeader} style={styles.header}>
          <ThemedText style={styles.title}>Comunidade UpWell</ThemedText>
          <ThemedText style={styles.subtitle}>Você não está sozinha nessa 🤍</ThemedText>
        </LinearGradient>

        <View style={styles.contextCard}>
          <ThemedText style={styles.contextText}>
            Este é um espaço seguro. As conquistas são anônimas e celebradas sem comparação.
          </ThemedText>
        </View>

        <ThemedText style={styles.feedTitle}>Aconteceu hoje na comunidade</ThemedText>
        <View style={styles.feed}>
          {FEED_ITEMS.map((item, index) => (
            <FeedItemCard key={item.id} item={item} delay={index * 60} />
          ))}
        </View>

        {streak >= 7 ? (
          <LinearGradient
            colors={gradients.gradientTerracotta}
            style={[styles.userCard, styles.userCardConquista, shadows.glowTerracotta]}
          >
            <ThemedText style={styles.userCardTitleWhite}>Você também tem uma conquista hoje 🎉</ThemedText>
            <RNText style={styles.userCardBodyWhite}>
              {streak} dias de sequência. Sua jornada faz parte dessa comunidade.
            </RNText>
          </LinearGradient>
        ) : (
          <View style={[styles.userCard, styles.userCardEncourage]}>
            <ThemedText style={styles.userCardBody}>
              Continue fazendo check-ins — sua primeira conquista na comunidade está chegando 🌱
            </ThemedText>
          </View>
        )}
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
  header: {
    paddingTop: spacing.md,
    paddingBottom: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: 12,
    borderRadius: radius.card,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  contextCard: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.borderSage,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  contextText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  feedTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  feed: {},
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  feedItemLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.sage,
  },
  feedIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
    marginLeft: spacing.xs,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  feedTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  userCardConquista: {
    overflow: 'hidden',
  },
  userCardEncourage: {
    backgroundColor: colors.sageLight,
    opacity: 0.9,
    borderWidth: 1,
    borderColor: colors.borderSage,
  },
  userCardTitleWhite: {
    ...typography.titleSmall,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  userCardBodyWhite: {
    ...typography.body,
    color: colors.white,
  },
  userCardBody: {
    ...typography.body,
    color: colors.text,
  },
});
