// Where "Open the app" buttons go. In production the Expo export is served at /app.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '/app';

// Sample entry for the Track scene. Fictional title, shaped like a real tracker entry.
export const SAMPLE = {
  title: 'Salt Moon Ronin',
  titleJa: '塩月浪人',
  volume: 12,
  total: 120,
  restProgress: 47
};

export const STATUSES = [
  // Labels match src/types.js in the app.
  { value: 'planned', label: 'Want to read', auto: true },
  { value: 'reading', label: 'Reading', auto: true },
  { value: 'completed', label: 'Completed', auto: true },
  { value: 'on_hold', label: 'On hold', auto: false },
  { value: 'dropped', label: 'Dropped', auto: false }
];

// The Track scene fills one panel per 5 chapters.
export const CELL_COUNT = 24;
