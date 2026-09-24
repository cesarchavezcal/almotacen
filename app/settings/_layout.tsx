import React from 'react';
import { Stack } from 'expo-router';
import { colors, typography } from '@/src/theme';

export default function SettingsLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { ...typography.cardIssuer, color: colors.textPrimary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Stack.Screen name="groups" options={{ title: 'Category Groups' }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
    </Stack>
  );
}
