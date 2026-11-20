export const STATUS_LABELS = {
  reading: 'Reading', planned: 'Want to read', completed: 'Completed', on_hold: 'On hold', dropped: 'Dropped'
};
export const READING_STATUSES = Object.keys(STATUS_LABELS);

// Keeps status and progress in step when a title is saved by hand: Completed means the last
// chapter, and reaching the last chapter completes a Reading or Want to read title (On hold and
// Dropped stay as chosen). Unknown totals are left alone.
export function settleProgress({ progress, status, total }) {
  if (total === null || total === undefined) return { progress, status };
  if (status === 'completed') return { progress: total, status };
  return { progress, status: progress === total && (status === 'reading' || status === 'planned') ? 'completed' : status };
}

// Result of reading one more chapter. A planned title has now been started, and reaching
// the known last chapter completes it. Progress never passes a known total.
export function nextChapter({ progress, totalChapters, status }) {
  const known = totalChapters !== null && totalChapters !== undefined;
  const next = known ? Math.min(progress + 1, totalChapters) : progress + 1;
  if (known && next >= totalChapters) return { progress: next, status: 'completed' };
  return { progress: next, status: status === 'planned' ? 'reading' : status };
}
