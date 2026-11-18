// Black, white and one red. `highlight` is the hanko red: hover/press, progress, active markers,
// labels, links, errors and the 完 stamp. Primary surfaces stay ink and paper.
export const lightColors = {
  background: '#FFFFFF', paper: '#FFFFFF', ink: '#000000', muted: '#666666',
  accent: '#000000', surface: '#F5F5F5', border: '#E5E5E5',
  highlight: '#D7262E', onHighlight: '#FFFFFF', danger: '#D7262E',
  onInk: '#FFFFFF', scrim: '#00000066', stampBack: 'rgba(255,255,255,0.88)', toneTint: undefined
};

export const darkColors = {
  background: '#0B0B0B', paper: '#0B0B0B', ink: '#F3F3F1', muted: '#A6A6A6',
  accent: '#F3F3F1', surface: '#1A1A1A', border: '#2E2E2E',
  // Lighter red so small red text still reads on near-black.
  highlight: '#F04A52', onHighlight: '#0B0B0B', danger: '#F04A52',
  onInk: '#0B0B0B', scrim: '#000000B3', stampBack: 'rgba(11,11,11,0.88)', toneTint: '#F3F3F1'
};

export const THEME_MODES = ['system', 'light', 'dark'];
export const THEME_STORAGE_KEY = '@panelpaw/theme-mode';

export const isThemeMode = (value) => THEME_MODES.includes(value);

// The mode is the user's choice; the scheme is what actually renders.
export function resolveScheme(mode, systemScheme) {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export const paletteFor = (scheme) => (scheme === 'dark' ? darkColors : lightColors);

// Separate static faces render consistently on web, Android, and iOS.
export const fonts = {
  regular: 'Geist-Regular', medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold', bold: 'Geist-Bold'
};
