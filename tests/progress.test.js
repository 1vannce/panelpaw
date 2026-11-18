import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextChapter } from "../src/types.js";

const entry = (overrides) => ({ progress: 0, totalChapters: 10, status: 'reading', ...overrides });

test('+1 chapter advances progress and keeps the status mid-series', () => {
  assert.deepEqual(nextChapter(entry({ progress: 4 })), { progress: 5, status: 'reading' });
});

test('+1 chapter on a planned title moves it to reading', () => {
  assert.deepEqual(nextChapter(entry({ status: 'planned' })), { progress: 1, status: 'reading' });
});

test('reaching the known last chapter marks the title completed', () => {
  assert.deepEqual(nextChapter(entry({ progress: 9 })), { progress: 10, status: 'completed' });
  assert.deepEqual(nextChapter(entry({ progress: 0, totalChapters: 1, status: 'planned' })), { progress: 1, status: 'completed' });
  assert.deepEqual(nextChapter(entry({ progress: 9, status: 'on_hold' })), { progress: 10, status: 'completed' });
});

test('an unknown total never auto-completes', () => {
  assert.deepEqual(nextChapter(entry({ progress: 96, totalChapters: null })), { progress: 97, status: 'reading' });
});

test('progress never goes past a known total', () => {
  assert.deepEqual(nextChapter(entry({ progress: 10, status: 'completed' })), { progress: 10, status: 'completed' });
});
