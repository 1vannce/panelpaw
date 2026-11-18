// Where "Open the app" buttons go. In production the Expo export is served at /app.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '/app';

// All titles on this page are fictional samples, shaped like real tracker entries.
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

// Discover strip, in reading order (panel 1 sits on the right).
// `art` picks a CSS-only cover texture.
export const DISCOVER = [
  { title: 'Salt Moon Ronin', type: 'Manga', chapters: 120, art: 'speed' },
  { title: 'Ninth Gutter', type: 'Manhwa', chapters: 88, art: 'ink' },
  { title: 'Paper Shrine', type: 'Manga', chapters: 64, art: 'hatch' },
  { title: 'Hollow Lantern', type: 'Manga', chapters: 210, art: 'tone' },
  { title: 'Ashfall Courier', type: 'Manhwa', chapters: 45, art: 'grid' },
  { title: 'Tidewater Kitchen', type: 'Manga', chapters: 32, art: 'speed' }
];

export const SEARCH_QUERY = 'ronin';

// Custom lists. A title belongs to at most one list (same rule as the app).
export const LISTS = [
  { name: 'Weekend binge', entries: [
    { title: 'Hollow Lantern', status: 'Reading', art: 'tone' },
    { title: 'Tidewater Kitchen', status: 'Want to read', art: 'speed' },
    { title: 'Ninth Gutter', status: 'Reading', art: 'ink' }
  ] },
  { name: 'Caught up', entries: [
    { title: 'Salt Moon Ronin', status: 'Completed', art: 'speed' },
    { title: 'Paper Shrine', status: 'Completed', art: 'hatch' }
  ] },
  { name: 'Waiting on new chapters', entries: [
    { title: 'Ashfall Courier', status: 'On hold', art: 'grid' },
    { title: 'Ink Bell Alley', status: 'Reading', art: 'tone' }
  ] }
];

export const MANIFESTO = 'Somewhere between chapter 46 and 47, you lost your place. PanelPaw remembers it, so you can get back to the story.';
