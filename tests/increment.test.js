import assert from 'node:assert/strict';
import { test } from 'node:test';
import { incrementChapterWith } from "../src/increment.js";

const entry = { id: 'e1', mangaId: 42, progress: 9, totalChapters: 10, status: 'reading' };

function setup(chapters) {
  const calls = { fetch: [], update: [], feedback: [] };
  const queryClient = { fetchQuery: async (options) => { calls.fetch.push(options); return { chapters }; } };
  const updateEntry = { mutateAsync: async (payload) => { calls.update.push(payload); } };
  const feedback = { tick: () => calls.feedback.push('tick'), stampThud: () => calls.feedback.push('stamp') };
  return { calls, queryClient, updateEntry, feedback };
}

test('+1 onto the saved total asks for a fresh title under the shared key and sends the new total', async () => {
  const { calls, queryClient, updateEntry, feedback } = setup(12);
  const result = await incrementChapterWith(updateEntry, entry, queryClient, feedback);
  assert.deepEqual(calls.fetch[0].queryKey, ['title', 'kitsu', 42]);
  assert.equal(calls.fetch[0].staleTime, 0);
  assert.deepEqual(calls.update, [{ entry, changes: { progress: 10, status: 'reading', totalChapters: 12 } }]);
  assert.deepEqual(result, { finished: false, started: false });
  assert.deepEqual(calls.feedback, ['tick']);
});

test('a catalog title without chapters is saved as an unknown total', async () => {
  const { calls, queryClient, updateEntry, feedback } = setup(0);
  await incrementChapterWith(updateEntry, entry, queryClient, feedback);
  assert.equal(calls.update[0].changes.totalChapters, null);
});

test('reaching the confirmed last chapter reports finished', async () => {
  const { calls, queryClient, updateEntry, feedback } = setup(10);
  assert.deepEqual(await incrementChapterWith(updateEntry, entry, queryClient, feedback), { finished: true, started: false });
  assert.deepEqual(calls.feedback, ['stamp']);
});

test('a catalog total below saved progress saves nothing', async () => {
  const { calls, queryClient, updateEntry, feedback } = setup(8);
  await assert.rejects(incrementChapterWith(updateEntry, entry, queryClient, feedback), /8 chapters/);
  assert.equal(calls.update.length, 0);
});

test('+1 below the saved total never touches the catalog', async () => {
  const { calls, queryClient, updateEntry, feedback } = setup(12);
  await incrementChapterWith(updateEntry, { ...entry, progress: 3 }, queryClient, feedback);
  assert.equal(calls.fetch.length, 0);
  assert.deepEqual(calls.update[0].changes, { progress: 4, status: 'reading' });
});
