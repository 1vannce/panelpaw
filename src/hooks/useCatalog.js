import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCatalog, getTitle } from "../api/catalog.js";

export function useCatalog(query, format, genre = '') {
  const search = query.trim();
  return useInfiniteQuery({
    queryKey: ['catalog', 'kitsu', search, format, genre],
    initialPageParam: { manga: 1, manhwa: 1 },
    queryFn: ({ pageParam, signal }) => getCatalog(search, format, pageParam, signal, genre),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false
  });
}

const titleQuery = (id) => ({ queryKey: ['title', 'kitsu', id], queryFn: ({ signal }) => getTitle(id, signal) });

/** Chapter total straight from the catalog (null when unknown); staleTime 0 skips the cached title. */
export async function fetchFreshTotal(queryClient, id) {
  return (await queryClient.fetchQuery({ ...titleQuery(id), staleTime: 0 })).chapters || null;
}

export function useTitle(id) {
  return useQuery({
    ...titleQuery(id),
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false
  });
}
