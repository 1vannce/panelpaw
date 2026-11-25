import { fetchFreshTotal } from "./hooks/useCatalog.js";
import { nextChapterChecked } from "./types.js";

// Kept apart from useTracker.js so tests can run it without the native haptics module.
export async function incrementChapterWith(updateEntry, entry, queryClient, { tick, stampThud }) {
  const next = await nextChapterChecked(entry, () => fetchFreshTotal(queryClient, entry.mangaId));
  await updateEntry.mutateAsync({ entry, changes: next });
  const finished = next.status === 'completed' && entry.status !== 'completed';
  if (finished) stampThud();else tick();
  return { finished, started: entry.status === 'planned' };
}
