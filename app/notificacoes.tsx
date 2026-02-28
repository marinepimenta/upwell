import { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { colors, gradients, shadows } from '@/constants/theme';
import { getProfile, updateProfile } from '@/lib/database';
import {
  getNotifications,
  markAllNotificationsRead,
  scheduleDailyCheckinReminder,
  scheduleStreakRiskReminder,
  type NotificationRow,
} from '@/lib/notifications';

const toggleItems = [
  { key: 'notifications_checkin', icon: 'notifications-outline', title: 'Check-in diário', subtitle: 'Lembrete para registrar seu dia' },
  { key: 'notifications_peso', icon: 'scale-outline', title: 'Atualizar peso', subtitle: 'Na frequência que você escolheu' },
  { key: 'notifications_glp1', icon: 'medical-outline', title: 'Aplicação GLP-1', subtitle: 'No dia da sua próxima dose' },
  { key: 'notifications_streak', icon: 'shield-outline', title: 'Sequência em risco', subtitle: 'Se você ainda não fez check-in às 21h' },
  { key: 'notifications_marcos', icon: 'trophy-outline', title: 'Marcos conquistados', subtitle: 'Ao atingir 7, 30, 60 e 90 dias' },
] as const;

type Prefs = {
  notifications_checkin: boolean;
  notifications_peso: boolean;
  notifications_glp1: boolean;
  notifications_streak: boolean;
  notifications_marcos: boolean;
  checkin_reminder_hour: number;
  checkin_reminder_minute: number;
};

const defaultPrefs: Prefs = {
  notifications_checkin: true,
  notifications_peso: true,
  notifications_glp1: true,
  notifications_streak: true,
  notifications_marcos: true,
  checkin_reminder_hour: 20,
  checkin_reminder_minute: 0,
};

function getTypeConfig(type: string): { color: string; icon: 'notifications-outline' | 'medical-outline' | 'scale-outline' | 'shield-outline' | 'trophy-outline' } {
  const map: Record<string, { color: string; icon: 'notifications-outline' | 'medical-outline' | 'scale-outline' | 'shield-outline' | 'trophy-outline' }> = {
    checkin: { color: '#5C7A5C', icon: 'notifications-outline' },
    glp1: { color: '#C4846A', icon: 'medical-outline' },
    peso: { color: '#7B9EC4', icon: 'scale-outline' },
    streak: { color: '#C4846A', icon: 'shield-outline' },
    marco: { color: '#5C7A5C', icon: 'trophy-outline' },
  };
  return map[type] ?? { color: '#8FAF8F', icon: 'notifications-outline' };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'agora mesmo';
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [notificationsList, setNotificationsList] = useState<NotificationRow[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const profile = await getProfile();
        if (profile) {
          setPrefs({
            notifications_checkin: profile.notifications_checkin ?? true,
            notifications_peso: profile.notifications_peso ?? true,
            notifications_glp1: profile.notifications_glp1 ?? true,
            notifications_streak: profile.notifications_streak ?? true,
            notifications_marcos: profile.notifications_marcos ?? true,
            checkin_reminder_hour: profile.checkin_reminder_hour ?? 20,
            checkin_reminder_minute: profile.checkin_reminder_minute ?? 0,
          });
        }
        const notifs = await getNotifications();
        setNotificationsList(notifs);
        setTimeout(() => markAllNotificationsRead(), 2000);
      };
      load();
    }, [])
  );

  const handleToggle = async (key: keyof Prefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await updateProfile({ [key]: value });
    if (key === 'notifications_checkin') {
      if (value) await scheduleDailyCheckinReminder(prefs.checkin_reminder_hour, prefs.checkin_reminder_minute);
      else await Notifications.cancelScheduledNotificationAsync('checkin-daily').catch(() => {});
    }
    if (key === 'notifications_streak') {
      if (value) await scheduleStreakRiskReminder();
      else await Notifications.cancelScheduledNotificationAsync('streak-risk').catch(() => {});
    }
  };

  const timePickerDate = new Date();
  timePickerDate.setHours(prefs.checkin_reminder_hour, prefs.checkin_reminder_minute, 0, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header gradiente sage */}
      <LinearGradient colors={gradients.gradientSage} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <RNText style={styles.headerTitle}>Notificações</RNText>
        <View style={styles.headerPlaceholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lembretes ativos */}
        <RNText style={styles.sectionTitle}>Lembretes ativos</RNText>
        {toggleItems.map((item) => (
          <View key={item.key} style={styles.toggleCard}>
            <View style={styles.toggleIconBox}>
              <Ionicons name={item.icon} size={22} color={colors.sageDark} />
            </View>
            <View style={styles.toggleTextWrap}>
              <RNText style={styles.toggleTitle}>{item.title}</RNText>
              <RNText style={styles.toggleSubtitle}>{item.subtitle}</RNText>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(v) => handleToggle(item.key, v)}
              trackColor={{ true: '#5C7A5C', false: undefined }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}

        {/* Horário do check-in */}
        <TouchableOpacity
          style={styles.toggleCard}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleIconBox}>
            <Ionicons name="time-outline" size={22} color={colors.sageDark} />
          </View>
          <View style={styles.toggleTextWrap}>
            <RNText style={styles.toggleTitle}>Horário do check-in</RNText>
            <RNText style={styles.timeValue}>
              {formatTime(prefs.checkin_reminder_hour, prefs.checkin_reminder_minute)}
            </RNText>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.sageDark} />
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={timePickerDate}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={async (event, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) {
                const h = date.getHours();
                const m = date.getMinutes();
                setPrefs((prev) => ({ ...prev, checkin_reminder_hour: h, checkin_reminder_minute: m }));
                await updateProfile({ checkin_reminder_hour: h, checkin_reminder_minute: m });
                if (prefs.notifications_checkin) await scheduleDailyCheckinReminder(h, m);
              }
            }}
          />
        )}

        {/* Recentes */}
        <RNText style={[styles.sectionTitle, { marginTop: 24 }]}>Recentes</RNText>
        {notificationsList.length === 0 ? (
          <RNText style={styles.emptyText}>Nenhuma notificação ainda 🔔</RNText>
        ) : (
          notificationsList.map((n) => {
            const config = getTypeConfig(n.type);
            return (
              <View key={n.id} style={styles.notifCard}>
                <View style={[styles.notifCircle, { backgroundColor: config.color }]}>
                  <Ionicons name={config.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.notifContent}>
                  <RNText style={styles.notifTitle}>{n.title}</RNText>
                  <RNText style={styles.notifBody}>{n.body}</RNText>
                  <RNText style={styles.notifTime}>{formatTimeAgo(n.created_at)}</RNText>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerPlaceholder: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    ...shadows.card,
  },
  toggleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleTextWrap: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  toggleSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#5C7A5C', marginTop: 2 },
  emptyText: { fontSize: 15, color: '#6B6B6B', textAlign: 'center', marginTop: 32 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    ...shadows.card,
  },
  notifCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  notifBody: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  notifTime: { fontSize: 12, color: '#BDBDBD', marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4846A',
    marginLeft: 8,
  },
});
