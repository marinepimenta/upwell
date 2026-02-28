import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '@/components/Themed';
import { colors, gradients, shadows, radius, spacing, typography } from '@/constants/theme';
import { useFadeSlideIn } from '@/hooks/useEntrance';
import { getStreak } from '@/utils/storage';
import { calculateStreak } from '@/lib/database';

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
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const load = async () => {
    const s = await calculateStreak();
    if (s > 0) setStreak(s);
    else setStreak(await getStreak());
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

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
        {/* Conteúdo do header: pt-8 pb-6 px-5, título e subtítulo brancos */}
        <View style={[styles.headerContent, { paddingTop: insets.top + 32, paddingBottom: 24 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={styles.headerTextWrap}>
              <RNText style={styles.headerTitle}>Comunidade UpWell</RNText>
              <RNText style={styles.headerSub}>Você não está sozinha nessa 🤍</RNText>
            </View>
          </View>
        </View>

        {/* Conteúdo abaixo do header: fundo da tela para contraste com o gradiente */}
        <View style={styles.contentWithBg}>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 100,
  },
  contentWithBg: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
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
  contextCard: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.borderSage,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
