// Pure helpers for the "What to read next" feature.

/** Kitsu category slug for a category title: "Slice of Life" -> "slice-of-life". */
export function genreSlug(title) {
  return title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Most common genre across lists of genre titles, as a slug; '' when there are none. Ties keep first seen. */
export function topGenre(genreLists) {
  const counts = new Map();
  for (const list of genreLists) {
    for (const title of new Set(list)) {
      const slug = genreSlug(title);
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  let best = '';
  let bestCount = 0;
  for (const [slug, count] of counts) if (count > bestCount) { best = slug; bestCount = count; }
  return best;
}

/** Drops titles already in the library and repeats, then keeps at most `limit`. */
export function freshPicks(items, ownedIds, limit = 5) {
  const seen = new Set(ownedIds);
  const picks = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picks.push(item);
    if (picks.length >= limit) break;
  }
  return picks;
}

/** What the AI endpoint receives: title, status and format of the most recently updated entries only. */
export function libraryPayload(entries, limit = 40) {
  return [...entries]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit)
    .map(({ title, status, format }) => ({ title, status, format }));
}
