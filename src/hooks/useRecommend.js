import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findTitle, getCatalog, getTitle } from '../api/catalog.js';
import { isAbortError } from '../api/http.js';
import { requestRecommendations } from '../api/recommend.js';
import { freshPicks, libraryPayload, topGenre } from '../recommend.js';

const MIN_AI_MATCHES = 3;

/** Similar titles by genre (or popular titles when no genre is known). Throws if Kitsu fails. */
async function genrePicks(entries, queryClient, owned, signal) {
  const recent = [...entries].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 3);
  const genreLists = [];
  for (const entry of recent) {
    try {
      const title = await queryClient.fetchQuery({
        queryKey: ['title', 'kitsu', entry.mangaId], queryFn: ({ signal: s }) => getTitle(entry.mangaId, s), staleTime: 30 * 60 * 1000
      });
      genreLists.push(title.genres);
    } catch (error) {
      if (signal.aborted) throw error;
      /* skip this entry; the other entries or popular titles still work */
    }
  }
  const genre = topGenre(genreLists);
  const page = await getCatalog('', 'all', undefined, signal, genre);
  return { genre, items: freshPicks(page.items, owned) };
}

/**
 * AI picks first; any failure, timeout, rate limit or too few catalog matches falls back to genre picks.
 * The result says which one it is (`source`) and whether the AI was tried and failed (`aiFailed`),
 * so the screen can say so. Leaving the screen aborts the Kitsu requests.
 */
export function useRecommendations(entries) {
  const queryClient = useQueryClient();
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  return useMutation({
    mutationFn: async () => {
      controller.current?.abort();
      const { signal } = (controller.current = new AbortController());
      const owned = entries.map((entry) => entry.mangaId);
      try {
        const titles = await requestRecommendations(libraryPayload(entries), signal);
        const found = [];
        for (const term of titles) {
          const match = await findTitle(term, signal);
          if (match) found.push(match);
        }
        const items = freshPicks(found, owned);
        if (items.length >= MIN_AI_MATCHES) return { source: 'ai', items };
      } catch (error) {
        if (isAbortError(error)) throw error;
        /* fall through to the genre list; the result is marked aiFailed */
      }
      const { genre, items } = await genrePicks(entries, queryClient, owned, signal);
      return { source: genre ? 'genre' : 'popular', items, aiFailed: true };
    }
  });
}
