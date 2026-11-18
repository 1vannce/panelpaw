import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { isThemeMode, paletteFor, resolveScheme, THEME_STORAGE_KEY } from '../theme.js';

const Context = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => { if (alive && isThemeMode(saved)) setModeState(saved); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const setMode = useCallback((next) => {
    if (!isThemeMode(next)) return;
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);
  const value = useMemo(() => {
    const scheme = resolveScheme(mode, system);
    return { mode, scheme, isDark: scheme === 'dark', colors: paletteFor(scheme), setMode };
  }, [mode, system, setMode]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme() {
  const context = useContext(Context);
  if (!context) throw new Error('useTheme must be inside ThemeProvider.');
  return context;
}

// Styles are built once per palette (there are only two), then reused.
const caches = new WeakMap();
export function useThemed(makeStyles) {
  const theme = useTheme();
  let byPalette = caches.get(makeStyles);
  if (!byPalette) { byPalette = new Map(); caches.set(makeStyles, byPalette); }
  let styles = byPalette.get(theme.colors);
  if (!styles) { styles = makeStyles(theme.colors); byPalette.set(theme.colors, styles); }
  return { ...theme, styles };
}
