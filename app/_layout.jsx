import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from "../src/providers/AppProviders.jsx";
import { useTheme } from "../src/providers/ThemeProvider.jsx";
export default function RootLayout() {
  return <AppProviders><ThemedStack /></AppProviders>;
}
function ThemedStack() {
  const { colors, isDark } = useTheme();
  return <><StatusBar style={isDark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="title/[id]" />
    <Stack.Screen name="connection" options={{ presentation: 'modal' }} />
  </Stack></>;
}
