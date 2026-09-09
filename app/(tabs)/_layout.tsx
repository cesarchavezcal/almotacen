import React from 'react';
import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.systemBlue,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cash Flow',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'trending-up' : 'trending-up-outline'}
              size={24}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerButton}>
                {({ pressed }) => (
                  <View style={[styles.glassCircle, pressed && styles.glassCirclePressed]}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={24}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerButton}>
                {({ pressed }) => (
                  <View style={[styles.glassCircle, pressed && styles.glassCirclePressed]}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'card' : 'card-outline'}
              size={24}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerButton}>
                {({ pressed }) => (
                  <View style={[styles.glassCircle, pressed && styles.glassCirclePressed]}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.canvas,
    borderTopColor: colors.hairline,
    borderTopWidth: 0.5,
    elevation: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  header: {
    backgroundColor: colors.canvas,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    ...typography.cardIssuer,
    color: colors.textPrimary,
  },
  headerButton: {
    marginRight: 16,
  },
  glassCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCirclePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
