import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectionProvider } from "./ConnectionProvider.jsx";
import { ThemeProvider, useTheme } from './ThemeProvider.jsx';
export function AppProviders({ children }) {
  return <ThemeProvider><Providers>{children}</Providers></ThemeProvider>;
}
function Providers({ children }) {
  const { colors, ready: themeReady } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.ttf'),
  });
  const [client] = useState(() => new QueryClient({ defaultOptions: {
      queries: { staleTime: 60_000, gcTime: 15 * 60_000, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false }
    } }));
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const listener = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => listener.remove();
  }, []);
  // Wait for the saved theme too, so a chosen Light/Dark never flashes the system palette.
  if (!themeReady || (!fontsLoaded && !fontError)) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Loading PanelPaw" color={colors.ink} />
    </View>;
  }
  return <SafeAreaProvider><QueryClientProvider client={client}><ConnectionProvider>{children}</ConnectionProvider></QueryClientProvider></SafeAreaProvider>;
}
