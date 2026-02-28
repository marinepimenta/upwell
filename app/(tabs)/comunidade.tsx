import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getFeed,
  toggleReaction,
  formatTimeAgo,
  type FeedItem,
} from '@/lib/community';
import { calculateStreak } from '@/lib/database';
import { colors } from '@/constants/theme';

const REACTIONS = [
  { emoji: '💚', countKey: 'reactions_heart' as const },
  { emoji: '🔥', countKey: 'reactions_fire' as const },
  { emoji: '💪', countKey: 'reactions_muscle' as const },
];

function FeedItemRow({
  item,
  onReact,
  isLast,
}: {
  item: FeedItem;
  onReact: (feedId: string, reaction: string) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.feedItemRow, isLast && styles.feedItemRowLast]}>
      <View style={styles.feedItemEmojiWrap}>
        <RNText style={styles.feedItemEmoji}>{item.emoji}</RNText>
      </View>
      <View style={styles.feedItemContent}>
        <View style={styles.feedItemTop}>
          <RNText style={styles.feedItemMessage} numberOfLines={3}>
            {item.message}
          </RNText>
          <RNText style={styles.feedItemTime}>{formatTimeAgo(item.created_at)}</RNText>
        </View>
        <View style={styles.reactionsRow}>
          {REACTIONS.map(({ emoji, countKey }) => {
            const count = item[countKey] ?? 0;
            const isActive = item.myReactions?.includes(emoji);
            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => onReact(item.id, emoji)}
                style={[styles.reactionChip, isActive && styles.reactionChipActive]}
                activeOpacity={0.7}
              >
                <RNText style={styles.reactionEmoji}>{emoji}</RNText>
                {count > 0 && (
                  <RNText
                    style={[
                      styles.reactionCount,
                      isActive && styles.reactionCountActive,
                    ]}
                  >
                    {count}
                  </RNText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ComunidadeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadFeed = useCallback(async (reset = false) => {
    if (reset) {
      setRefreshing(true);
      setPage(0);
    } else {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
    }
    const currentPage = reset ? 0 : page;
    const data = await getFeed(currentPage, 20);
    if (reset) {
      setFeed(data);
    } else {
      setFeed((prev) => (currentPage === 0 ? data : [...prev, ...data]));
    }
    setHasMore(data.length === 20);
    setPage(currentPage + 1);
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);

    const s = await calculateStreak();
    setStreak(s);
  }, [page]);

  useFocusEffect(
    useCallback(() => {
      loadFeed(true);
    }, [])
  );

  const handleReact = useCallback(async (feedId: string, reaction: string) => {
    const column =
      reaction === '💚'
        ? 'reactions_heart'
        : reaction === '🔥'
          ? 'reactions_fire'
          : 'reactions_muscle';

    setFeed((prev) =>
      prev.map((item) => {
        if (item.id !== feedId) return item;
        const alreadyReacted = item.myReactions?.includes(reaction);
        return {
          ...item,
          [column]: Math.max(0, (item[column] ?? 0) + (alreadyReacted ? -1 : 1)),
          myReactions: alreadyReacted
            ? (item.myReactions ?? []).filter((r) => r !== reaction)
            : [...(item.myReactions ?? []), reaction],
        };
      })
    );
    await toggleReaction(feedId, reaction);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && feed.length > 0) loadFeed(false);
  }, [loadingMore, hasMore, feed.length, loadFeed]);

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <View
        style={[
          styles.feedItemWrapper,
          index === 0 && styles.feedCardFirst,
          index === feed.length - 1 && styles.feedCardLast,
        ]}
      >
        <FeedItemRow
          item={item}
          onReact={handleReact}
          isLast={index === feed.length - 1}
        />
      </View>
    ),
    [handleReact, feed.length]
  );

  const ListHeader = useCallback(
    () => (
      <>
        <View style={styles.banner}>
          <RNText style={styles.bannerText}>
            Este é um espaço seguro. As conquistas são anônimas e celebradas sem
            comparação.
          </RNText>
        </View>
        <RNText style={styles.sectionTitle}>Aconteceu hoje</RNText>
      </>
    ),
    []
  );

  const ListFooter = useCallback(() => {
    if (streak < 1) return null;
    return (
      <View style={styles.footerBanner}>
        <RNText style={styles.footerBannerTitle}>
          Você também tem uma conquista 🎉
        </RNText>
        <RNText style={styles.footerBannerBody}>
          {streak} dias consecutivos — sua jornada faz parte dessa comunidade.
        </RNText>
      </View>
    );
  }, [streak]);

  const ListEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <RNText style={styles.emptyEmoji}>🌱</RNText>
        <RNText style={styles.emptyText}>
          Seja a primeira a aparecer aqui!{'\n'}Faça seu check-in de hoje.
        </RNText>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/(tabs)/checkin')}
          activeOpacity={0.8}
        >
          <RNText style={styles.emptyBtnText}>Fazer check-in</RNText>
        </TouchableOpacity>
      </View>
    );
  }, [loading, router]);

  if (loading && feed.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sageDark} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={['#5C7A5C', '#8FAF8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBg, { height: insets.top + 32 + 72 + 24 }]}
      />
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <>
            {loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.sageDark} />
              </View>
            ) : null}
            <ListFooter />
          </>
        }
        ListEmptyComponent={ListEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            colors={[colors.sageDark]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 32 + 72 + 24 + 16,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
      {/* Header content overlay */}
      <View
        style={[styles.headerContent, { paddingTop: insets.top + 32, paddingBottom: 24 }]}
        pointerEvents="none"
      >
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAF8' },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: { paddingHorizontal: 20, position: 'absolute', left: 0, right: 0, top: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  list: { flex: 1, backgroundColor: 'transparent' },
  listContent: { paddingHorizontal: 16 },
  banner: {
    backgroundColor: '#EBF3EB',
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 16,
    padding: 14,
  },
  bannerText: {
    fontSize: 13,
    color: '#5C7A5C',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  feedItemWrapper: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  feedCardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  feedCardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  feedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8F5',
  },
  feedItemRowLast: {
    borderBottomWidth: 0,
  },
  feedItemEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedItemEmoji: { fontSize: 22 },
  feedItemContent: { flex: 1, minWidth: 0 },
  feedItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  feedItemMessage: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    flex: 1,
  },
  feedItemTime: { fontSize: 12, color: '#BDBDBD', flexShrink: 0 },
  reactionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F8F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reactionChipActive: {
    backgroundColor: '#EBF3EB',
    borderWidth: 1,
    borderColor: '#5C7A5C',
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  reactionCountActive: { color: '#5C7A5C' },
  footerBanner: {
    backgroundColor: '#C4846A',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  footerBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  footerBannerBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 15,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#5C7A5C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF8',
  },
});
