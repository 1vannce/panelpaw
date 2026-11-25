import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextChapter, nextChapterChecked, settleProgress } from "../src/types.js";

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

test('hand-saved status and progress stay in step', () => {
  assert.deepEqual(settleProgress({ progress: 10, status: 'reading', total: 10 }), { progress: 10, status: 'completed' });
  assert.deepEqual(settleProgress({ progress: 3, status: 'completed', total: 10 }), { progress: 10, status: 'completed' });
  assert.deepEqual(settleProgress({ progress: 10, status: 'dropped', total: 10 }), { progress: 10, status: 'dropped' });
  assert.deepEqual(settleProgress({ progress: 3, status: 'on_hold', total: 10 }), { progress: 3, status: 'on_hold' });
  assert.deepEqual(settleProgress({ progress: 3, status: 'completed', total: null }), { progress: 3, status: 'completed' });
});

test('+1 below the saved last chapter does not look at the catalog', async () => {
  const lookup = async () => { throw new Error('should not be called'); };
  assert.deepEqual(await nextChapterChecked(entry({ progress: 4 }), lookup), { progress: 5, status: 'reading' });
});

test('+1 onto a stale saved total uses the fresh catalog total instead of completing', async () => {
  assert.deepEqual(await nextChapterChecked(entry({ progress: 9 }), async () => 12), { progress: 10, status: 'reading', totalChapters: 12 });
});

test('+1 onto a total the catalog confirms still completes the title', async () => {
  assert.deepEqual(await nextChapterChecked(entry({ progress: 9 }), async () => 10), { progress: 10, status: 'completed', totalChapters: 10 });
});

test('+1 onto a total the catalog no longer knows keeps reading', async () => {
  assert.deepEqual(await nextChapterChecked(entry({ progress: 9 }), async () => null), { progress: 10, status: 'reading', totalChapters: null });
});

test('+1 onto the saved total fails when the catalog cannot be checked', async () => {
  await assert.rejects(nextChapterChecked(entry({ progress: 9 }), async () => { throw new Error('offline'); }), /could not be checked/);
});

test('+1 never lowers saved progress when the catalog total has dropped below it', async () => {
  await assert.rejects(nextChapterChecked(entry({ progress: 9 }), async () => 8), /8 chapters.*9/);
  // A total equal to the saved progress is fine: the title is simply finished.
  assert.deepEqual(await nextChapterChecked(entry({ progress: 9 }), async () => 9), { progress: 9, status: 'completed', totalChapters: 9 });
});
