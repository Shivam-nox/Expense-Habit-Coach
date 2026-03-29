// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

// --- Premium Palette ---
const COLORS = {
  primary: '#2E7D6E',     // Deep Teal
  bg: '#FFFFFF',          // Solid White for the bottom area
  inactive: '#94A3B8',    // Slate 400
  border: '#F1F5F9',      // Slate 100
};

// Animated Icon Wrapper (This gives the "pop" effect to ALL icons)
const TabIcon = ({ name, color, focused }: { name: any, color: string, focused: boolean }) => (
  <MotiView
    animate={{ 
      scale: focused ? 1.15 : 1,
      translateY: focused ? -2 : 0 
    }}
    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
  >
    <Feather name={name} size={24} color={color} />
  </MotiView>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          // Premium subtle click on every tab change
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          // Solid background blocks content from scrolling underneath
          backgroundColor: COLORS.bg,
          borderTopWidth: 0, 
        
          // Dynamic height based on device notches
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 95, 
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12, 
          paddingTop: 12,
          
          // Soft shadow pointing upwards to separate from the screen content
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
          elevation: 10, 
        },
        tabBarActiveTintColor: COLORS.primary, 
        tabBarInactiveTintColor: COLORS.inactive, 
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 6,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => <TabIcon name="list" color={color} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="charts"
        options={{
          title: 'Charts',
          tabBarIcon: ({ color, focused }) => <TabIcon name="pie-chart" color={color} focused={focused} />,
        }}
      />

      {/* Reverted Add Button: Normal icon with pop animation */}
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add', 
          tabBarIcon: ({ color, focused }) => <TabIcon name="plus-circle" color={color} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-text" color={color} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => <TabIcon name="message-circle" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}