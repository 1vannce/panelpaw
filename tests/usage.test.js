import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasUsedApp, markAppUsed, shouldSkipLanding, USED_KEY } from '../src/usage.js';

const memory = () => { const data = new Map(); return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };

test('the flag is off until the app is used, then on', () => {
  const storage = memory();
  assert.equal(hasUsedApp(storage), false);
  assert.equal(markAppUsed(storage), true);
  assert.equal(hasUsedApp(storage), true);
});

test('missing or throwing storage never breaks the app', () => {
  assert.equal(markAppUsed(null), false);
  assert.equal(hasUsedApp(null), false);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(markAppUsed(broken), false);
  assert.equal(hasUsedApp(broken), false);
});

test('returning users skip the landing page unless they ask for it', () => {
  assert.equal(shouldSkipLanding({ used: true }), true);
  assert.equal(shouldSkipLanding({ used: false }), false);
  assert.equal(shouldSkipLanding({ used: true, search: '?landing' }), false);
  assert.equal(shouldSkipLanding({ used: true, search: '?a=1&landing=1' }), false);
  assert.equal(shouldSkipLanding({ used: true, hash: '#track' }), false);
});

test('the landing page script reads the same key and escape hatch', () => {
  const layout = readFileSync(new URL('../site/app/layout.jsx', import.meta.url), 'utf8');
  assert.ok(layout.includes(USED_KEY), 'layout uses the app flag key');
  assert.ok(layout.includes('landing'), 'layout honours ?landing');
});
