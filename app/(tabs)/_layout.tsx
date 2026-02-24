import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { getOnboardingData } from '@/utils/storage';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  color: string;
}) {
  const { name, focused, color } = props;
  const outlineSuffix = '-outline';
  const baseName = typeof name === 'string' && name.endsWith(outlineSuffix) ? name.slice(0, -outlineSuffix.length) : name;
  const outlineName = typeof baseName === 'string' ? `${baseName}${outlineSuffix}` : baseName;
  const iconName = focused ? baseName : outlineName;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={iconName as React.ComponentProps<typeof Ionicons>['name']}
        size={22}
        color={focused ? colors.sageDark : color}
        style={{ marginBottom: focused ? 4 : 2 }}
      />
      {focused ? (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.sageDark,
          }}
        />
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
  const [showGlp1Tab, setShowGlp1Tab] = useState(false);

  useEffect(() => {
    getOnboardingData().then((data) => {
      const status = data?.glp1Status;
      setShowGlp1Tab(status === 'using' || status === 'used');
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: '#BDBDBD',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          paddingTop: 8,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          href: null,
          title: 'Check-in',
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="bar-chart" color={color} focused={focused} />,
          headerTitle: 'Seu progresso',
        }}
      />
      <Tabs.Screen
        name="glp1"
        options={{
          title: 'GLP-1',
          href: showGlp1Tab ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="medical" color={color} focused={focused} />,
          headerTitle: 'GLP-1 Companion',
        }}
      />
      <Tabs.Screen
        name="comunidade"
        options={{
          title: 'Comunidade',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="people" color={color} focused={focused} />,
          headerTitle: 'Comunidade',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" color={color} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          href: null,
          title: 'Configurações',
        }}
      />
    </Tabs>
  );
}
