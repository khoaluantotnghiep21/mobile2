import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define custom tab icon components to avoid creating new components on each render
const HomeTabIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="house.fill" color={color} />
);

const AccountTabIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="person.fill" color={color} />
);

const CartTabIcon = ({ color }: { color: string }) => (
  <IconSymbol size={28} name="cart.fill" color={color} />
);

// Custom TabBarLabel component to ensure text is properly wrapped
const HomeTabLabel = ({ color }: { color: string }) => (
  <Text style={{ color }}>Trang chủ</Text>
);

const AccountTabLabel = ({ color }: { color: string }) => (
  <Text style={{ color }}>Tài khoản</Text>
);

const CartTabLabel = ({ color }: { color: string }) => (
  <Text style={{ color }}>Giỏ hàng</Text>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: HomeTabIcon,
          tabBarLabel: HomeTabLabel,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: AccountTabIcon,
          tabBarLabel: AccountTabLabel,
        }}
      />
      <Tabs.Screen
        name="cart-list"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: CartTabIcon,
          tabBarLabel: CartTabLabel,
        }}
      />
    </Tabs>
  );
}
