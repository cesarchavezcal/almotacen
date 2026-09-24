import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { colors } from '@/src/theme';
import { useOnboardingGuard } from '@/src/hooks/useOnboardingGuard';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings: { initialRouteName: string } = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function isOnboardingRoute(segments: unknown): boolean {
  return Array.isArray(segments) && segments.length > 0 && segments[0] === 'onboarding';
}

function RootLayoutNav(): React.JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  const { isOnboardingCompleted, isLoading } = useOnboardingGuard();

  useEffect(() => {
    if (isLoading || isOnboardingCompleted === null) return;

    const inOnboarding = isOnboardingRoute(segments);

    if (!isOnboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isOnboardingCompleted && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isOnboardingCompleted, isLoading, segments, router]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
