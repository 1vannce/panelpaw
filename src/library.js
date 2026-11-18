// Library ordering. `recent` is the default (last updated first).
export const SORTS = [
  { value: 'recent', label: 'Recent' },
  { value: 'title', label: 'A–Z' },
  { value: 'progress', label: 'Most read' }
];

const compare = {
  recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  progress: (a, b) => b.progress - a.progress || b.updatedAt.localeCompare(a.updatedAt)
};

export function sortEntries(entries, sort = 'recent') {
  return [...entries].sort(compare[sort] ?? compare.recent);
}

// Titles worth resuming: currently reading, most recently touched first.
export function continueReading(entries, limit = 8) {
  return sortEntries(entries.filter((entry) => entry.status === 'reading'), 'recent').slice(0, limit);
}
