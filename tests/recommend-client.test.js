import assert from 'node:assert/strict';
import test from 'node:test';
import { freshPicks, genreSlug, libraryPayload, topGenre } from '../src/recommend.js';

test('genreSlug matches Kitsu category slugs', () => {
  assert.equal(genreSlug('Slice of Life'), 'slice-of-life');
  assert.equal(genreSlug('  Sci-Fi! '), 'sci-fi');
  assert.equal(genreSlug('***'), '');
});

test('topGenre picks the most common genre and ignores repeats within one title', () => {
  assert.equal(topGenre([['Action', 'Action', 'Drama'], ['Drama', 'Fantasy'], ['Drama']]), 'drama');
});

test('topGenre keeps the first seen on a tie and handles no genres', () => {
  assert.equal(topGenre([['Action'], ['Drama']]), 'action');
  assert.equal(topGenre([]), '');
  assert.equal(topGenre([[], []]), '');
});

test('freshPicks drops owned and repeated titles and caps the count', () => {
  const items = [1, 2, 3, 3, 4, 5, 6, 7].map((id) => ({ id }));
  assert.deepEqual(freshPicks(items, [2], 5).map((x) => x.id), [1, 3, 4, 5, 6]);
});

test('libraryPayload sends only title, status and format, newest first, capped', () => {
  const entries = [
    { id: 'a', mangaId: 1, title: 'Old', status: 'reading', format: 'Manga', imageUrl: 'https://x', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'b', mangaId: 2, title: 'New', status: 'planned', format: 'Manhwa', imageUrl: 'https://y', updatedAt: '2026-02-01T00:00:00Z' }
  ];
  assert.deepEqual(libraryPayload(entries, 1), [{ title: 'New', status: 'planned', format: 'Manhwa' }]);
  assert.deepEqual(Object.keys(libraryPayload(entries)[0]), ['title', 'status', 'format']);
});
