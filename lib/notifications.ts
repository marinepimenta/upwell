import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data ?? null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
    }
    return token;
  } catch {
    // Expo Go ou ambiente sem projectId — push não disponível
    return null;
  }
}

export async function scheduleDailyCheckinReminder(hour = 20, minute = 0): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('checkin-daily').catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: 'checkin-daily',
      content: {
        title: 'Hora do check-in! 💚',
        body: 'Como foi seu dia hoje? Leva menos de 1 minuto.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Math.max(0, Math.min(23, hour)),
        minute: Math.max(0, Math.min(59, minute)),
      },
    });
  } catch {
    // ignore
  }
}

export async function scheduleStreakRiskReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('streak-risk').catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: 'streak-risk',
      content: {
        title: 'Sua sequência está em risco ⚠️',
        body: 'Você ainda não fez check-in hoje. Ainda dá tempo!',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });
  } catch {
    // ignore
  }
}

export async function cancelStreakRiskReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('streak-risk').catch(() => {});
}

export async function scheduleWeightReminder(daysFromNow: number): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('weight-reminder').catch(() => {});
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + daysFromNow);
    trigger.setHours(9, 0, 0, 0);
    if (trigger.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'weight-reminder',
      content: {
        title: 'Hora de se pesar ⚖️',
        body: 'Mantenha seu histórico atualizado. Leva 10 segundos!',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  } catch {
    // ignore
  }
}

export async function scheduleGlp1Reminder(nextDateStr: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('glp1-reminder').catch(() => {});
    const [y, m, d] = nextDateStr.split('-').map(Number);
    const trigger = new Date(y, m - 1, d, 9, 0, 0);
    if (trigger.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'glp1-reminder',
      content: {
        title: 'Aplicação GLP-1 hoje 💉',
        body: 'Não esqueça de registrar sua aplicação de hoje no UpWell.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  } catch {
    // ignore
  }
}

export async function saveNotificationToHistory(
  type: string,
  title: string,
  body: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').insert({ user_id: user.id, type, title, body });
}

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export async function getNotifications(): Promise<NotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);
  return (data ?? []) as NotificationRow[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);
}

export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);
  return count ?? 0;
}
