import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';

import { UpWellColors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/database';
import {
  registerForPushNotifications,
  scheduleDailyCheckinReminder,
  scheduleStreakRiskReminder,
} from '@/lib/notifications';

const UpWellTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: UpWellColors.tint,
    background: UpWellColors.background,
    card: UpWellColors.surface,
    text: UpWellColors.text,
    border: UpWellColors.borderLight,
  },
};

export { ErrorBoundary } from 'expo-router';

function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      console.log('Deep link recebido:', url);

      try {
        // Caso 1: token como query param ?code=xxx
        if (url.includes('code=')) {
          const code = url.split('code=')[1]?.split('&')[0];
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session) {
              router.replace('/reset-password');
              return;
            }
          }
        }

        // Caso 2: token como hash fragment #access_token=xxx
        if (url.includes('access_token=')) {
          const hashPart = url.split('#')[1] || url.split('?')[1] || '';
          const params = new URLSearchParams(hashPart);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const type = params.get('type');
          if (access_token && type === 'recovery') {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token ?? '',
            });
            if (data?.session) {
              router.replace('/reset-password');
              return;
            }
          }
        }

        // Caso 3: URL contém /reset-password (redirect direto)
        if (url.includes('reset-password') && url.includes('type=recovery')) {
          router.replace('/reset-password');
        }
      } catch (_) {
        // ignore
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}

function NotificationInit() {
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const profile = await getProfile();
      await registerForPushNotifications();
      if (profile?.notifications_checkin !== false) {
        await scheduleDailyCheckinReminder(
          profile?.checkin_reminder_hour ?? 20,
          profile?.checkin_reminder_minute ?? 0
        );
      }
      if (profile?.notifications_streak !== false) {
        await scheduleStreakRiskReminder();
      }
    };
    init();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={UpWellTheme}>
      <StatusBar style="dark" />
      <DeepLinkHandler />
      <NotificationInit />
      <Stack screenOptions={{ headerShown: false }} >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="relatorio" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="registro-peso" options={{ headerShown: false }} />
        <Stack.Screen name="notificacoes" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
