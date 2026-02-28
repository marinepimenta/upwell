import { supabase } from './supabase';

export const ACHIEVEMENT_TYPES = {
  checkin_done: {
    messages: [
      'Alguém fez seu check-in de hoje',
      'Alguém registrou mais um dia',
      'Alguém completou o check-in diário',
    ],
    emoji: '✅',
  },
  streak_7: {
    messages: ['Alguém fez check-in por 7 dias seguidos'],
    emoji: '💪',
  },
  streak_30: {
    messages: ['Alguém completou 30 dias consecutivos'],
    emoji: '🎉',
  },
  streak_60: {
    messages: ['Alguém chegou a 60 dias seguidos'],
    emoji: '🏆',
  },
  streak_90: {
    messages: ['Alguém completou 90 dias! A jornada inteira!'],
    emoji: '🌟',
  },
  first_week: {
    messages: ['Alguém completou a primeira semana'],
    emoji: '🌱',
  },
  weight_registered: {
    messages: [
      'Alguém registrou o peso pela 1ª vez',
      'Alguém registrou o peso essa semana',
      'Alguém mantém seu histórico atualizado',
    ],
    emoji: '⚖️',
  },
  trained_5: {
    messages: ['Alguém treinou 5 dias essa semana'],
    emoji: '🏋️',
  },
  shield_used: {
    messages: ['Alguém usou o escudo e manteve a sequência'],
    emoji: '🛡️',
  },
  glp1_registered: {
    messages: ['Alguém registrou sua aplicação GLP-1'],
    emoji: '💉',
  },
} as const;

export type AchievementType = keyof typeof ACHIEVEMENT_TYPES;

export type FeedItem = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  emoji: string;
  reactions_heart: number;
  reactions_fire: number;
  reactions_muscle: number;
  created_at: string;
  myReactions?: string[];
};

export const publishAchievement = async (type: AchievementType): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const achievement = ACHIEVEMENT_TYPES[type];
  const message = achievement.messages[Math.floor(Math.random() * achievement.messages.length)];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  const { data: existing } = await supabase
    .from('community_feed')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', type)
    .gte('created_at', today.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .maybeSingle();

  if (existing) return;

  await supabase.from('community_feed').insert({
    user_id: user.id,
    type,
    message,
    emoji: achievement.emoji,
  });
};

export const getFeed = async (page = 0, limit = 20): Promise<FeedItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  const from = page * limit;
  const to = from + limit - 1;
  const { data } = await supabase
    .from('community_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!data || data.length === 0) return [];

  const feedWithReactions = await Promise.all(
    data.map(async (item) => {
      const { data: myReactions } = user
        ? await supabase
            .from('community_reactions')
            .select('reaction')
            .eq('feed_id', item.id)
            .eq('user_id', user.id)
        : { data: [] };
      return {
        ...item,
        reactions_heart: item.reactions_heart ?? 0,
        reactions_fire: item.reactions_fire ?? 0,
        reactions_muscle: item.reactions_muscle ?? 0,
        myReactions: (myReactions?.map((r: { reaction: string }) => r.reaction) ?? []) as string[],
      };
    })
  );

  return feedWithReactions as FeedItem[];
};

const reactionToColumn: Record<string, string> = {
  '💚': 'reactions_heart',
  '🔥': 'reactions_fire',
  '💪': 'reactions_muscle',
};

export const toggleReaction = async (feedId: string, reaction: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const column = reactionToColumn[reaction];
  if (!column) return;

  const { data: existing } = await supabase
    .from('community_reactions')
    .select('id')
    .eq('feed_id', feedId)
    .eq('user_id', user.id)
    .eq('reaction', reaction)
    .maybeSingle();

  if (existing) {
    await supabase.from('community_reactions').delete().eq('id', existing.id);
    await supabase.rpc('decrement_reaction', {
      p_feed_id: feedId,
      p_column_name: column,
    });
  } else {
    await supabase.from('community_reactions').insert({
      user_id: user.id,
      feed_id: feedId,
      reaction,
    });
    await supabase.rpc('increment_reaction', {
      p_feed_id: feedId,
      p_column_name: column,
    });
  }
};

export const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
};
