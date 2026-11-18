export const STATUS_LABELS = {
  reading: 'Reading', planned: 'Want to read', completed: 'Completed', on_hold: 'On hold', dropped: 'Dropped'
};
export const READING_STATUSES = Object.keys(STATUS_LABELS);

// Result of reading one more chapter. A planned title has now been started, and reaching
// the known last chapter completes it. Progress never passes a known total.
export function nextChapter({ progress, totalChapters, status }) {
  const known = totalChapters !== null && totalChapters !== undefined;
  const next = known ? Math.min(progress + 1, totalChapters) : progress + 1;
  if (known && next >= totalChapters) return { progress: next, status: 'completed' };
  return { progress: next, status: status === 'planned' ? 'reading' : status };
}
