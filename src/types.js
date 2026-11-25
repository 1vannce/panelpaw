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

// Like nextChapter, but a +1 that would reach the saved total first asks the catalog for the
// current total, since a series may have grown since it was saved. Only that case needs the
// lookup. The result then carries the fresh totalChapters (null when the catalog no longer knows it).
export async function nextChapterChecked(entry, fetchTotal) {
  const known = entry.totalChapters !== null && entry.totalChapters !== undefined;
  if (!known || entry.progress + 1 < entry.totalChapters) return nextChapter(entry);
  let total;
  try {total = await fetchTotal();} catch {
    throw new Error('This title has ' + entry.totalChapters + ' saved chapters, and the catalog could not be checked for more. Try again in a moment.');
  }
  // Never let a lower catalog total drag saved progress down; ask for a manual fix instead.
  if (total !== null && total < entry.progress) {
    throw new Error('The catalog now lists ' + total + ' chapters, fewer than your saved progress of ' + entry.progress + '. Fix the progress from the Library screen.');
  }
  return { ...nextChapter({ ...entry, totalChapters: total }), totalChapters: total };
}
