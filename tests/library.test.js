import assert from 'node:assert/strict';
import test from 'node:test';
import { continueReading, sortEntries } from '../src/library.js';

const e = (id, title, progress, updatedAt, status = 'reading') => ({ id, title, progress, updatedAt, status });
const list = [
  e('1', 'berserk', 40, '2026-11-01T00:00:00Z'),
  e('2', 'Akira', 10, '2026-11-03T00:00:00Z'),
  e('3', 'Vagabond', 40, '2026-11-02T00:00:00Z', 'planned')
];

test('recent puts the last updated entry first', () => {
  assert.deepEqual(sortEntries(list, 'recent').map((x) => x.id), ['2', '3', '1']);
});

test('title sorts case-insensitively', () => {
  assert.deepEqual(sortEntries(list, 'title').map((x) => x.title), ['Akira', 'berserk', 'Vagabond']);
});

test('progress sorts by chapters read and breaks ties by recency', () => {
  assert.deepEqual(sortEntries(list, 'progress').map((x) => x.id), ['3', '1', '2']);
});

test('sorting never mutates its input and falls back to recent', () => {
  const copy = [...list];
  sortEntries(list, 'title');
  assert.deepEqual(list, copy);
  assert.deepEqual(sortEntries(list, 'nonsense').map((x) => x.id), ['2', '3', '1']);
});

test('continue reading lists only reading titles, newest first, capped', () => {
  assert.deepEqual(continueReading(list).map((x) => x.id), ['2', '1']);
  assert.equal(continueReading(list, 1).length, 1);
});
