import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findTitle, getCatalog, getTitle } from '../api/catalog.js';
import { requestRecommendations } from '../api/recommend.js';
import { freshPicks, libraryPayload, topGenre } from '../recommend.js';

const MIN_AI_MATCHES = 3;

/** Similar titles by genre, using the genres of the most recently updated entries. Throws if Kitsu fails. */
async function genrePicks(entries, queryClient, owned) {
  const recent = [...entries].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 3);
  const genreLists = [];
  for (const entry of recent) {
    try {
      const title = await queryClient.fetchQuery({
        queryKey: ['title', 'kitsu', entry.mangaId], queryFn: ({ signal }) => getTitle(entry.mangaId, signal), staleTime: 30 * 60 * 1000
      });
      genreLists.push(title.genres);
    } catch { /* skip this entry; the other entries or popular titles still work */ }
  }
  const page = await getCatalog('', 'all', undefined, undefined, topGenre(genreLists));
  return freshPicks(page.items, owned);
}

/** AI picks first; any failure, timeout, rate limit or too few catalog matches falls back to genre picks. */
export function useRecommendations(entries) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const owned = entries.map((entry) => entry.mangaId);
      try {
        const titles = await requestRecommendations(libraryPayload(entries));
        const found = [];
        for (const term of titles) {
          const match = await findTitle(term);
          if (match) found.push(match);
        }
        const items = freshPicks(found, owned);
        if (items.length >= MIN_AI_MATCHES) return { source: 'ai', items };
      } catch { /* fall through to the genre list */ }
      return { source: 'genre', items: await genrePicks(entries, queryClient, owned) };
    }
  });
}
