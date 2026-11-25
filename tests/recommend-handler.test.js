import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/recommend.js';

const KEY = 'test-key-not-a-google-pattern-12345';
const TITLE = 'Secret Library Title';
const body = { library: [{ title: TITLE, status: 'reading', format: 'Manga' }] };

function call(options) {
  const { method = 'POST', reqBody = body, fetchImpl } = options;
  const key = 'key' in options ? options.key : KEY;
  const logs = [];
  const realFetch = globalThis.fetch;
  const realError = console.error;
  const realKey = process.env.GEMINI_API_KEY;
  globalThis.fetch = fetchImpl;
  console.error = (...args) => logs.push(args.join(' '));
  if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
  const res = {
    headers: {}, statusCode: 200, payload: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
  return handler({ method, body: reqBody }, res).then(() => ({ res, logs })).finally(() => {
    globalThis.fetch = realFetch;
    console.error = realError;
    if (realKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = realKey;
  });
}

const upstream = (status, text) => async () => new Response(text, { status });
const googleError = (code, status, message) => JSON.stringify({ error: { code, status, message } });

test('429 from Gemini stays 429 RATE_LIMITED and is logged', async () => {
  const { res, logs } = await call({ fetchImpl: upstream(429, googleError(429, 'RESOURCE_EXHAUSTED', 'Quota exceeded')) });
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.payload, { error: 'RATE_LIMITED' });
  assert.equal(logs.length, 1);
  assert.match(logs[0], /^\[recommend\] upstream_error .*http=429 google_status="RESOURCE_EXHAUSTED" google_code=429/);
});

test('other non-OK from Gemini becomes 502 UPSTREAM_ERROR with Google details logged', async () => {
  const { res, logs } = await call({ fetchImpl: upstream(500, googleError(500, 'INTERNAL', 'Oops')) });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.payload, { error: 'UPSTREAM_ERROR' });
  assert.match(logs[0], /http=500 google_status="INTERNAL" google_code=500 message="Oops"/);
});

test('a 400 that echoes the key or a newline stays one clean log line without the key', async () => {
  const message = 'bad value ' + KEY + '\nsecond line AIzaSyB-abc_123';
  const { logs } = await call({ fetchImpl: upstream(400, googleError(400, 'INVALID_ARGUMENT\nforged', message)) });
  assert.equal(logs.length, 1);
  assert.ok(!logs[0].includes('\n'));
  assert.ok(!logs[0].includes(KEY));
  assert.ok(!logs[0].includes('AIza'));
});

test('missing key gives 503 UNAVAILABLE and a log line', async () => {
  const { res, logs } = await call({ key: undefined, fetchImpl: async () => { throw new Error('must not be called'); } });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.payload, { error: 'UNAVAILABLE' });
  assert.match(logs[0], /^\[recommend\] missing_key/);
});

test('unparseable model text gives 502 BAD_RESPONSE', async () => {
  const ok = JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] });
  const { res, logs } = await call({ fetchImpl: upstream(200, ok) });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.payload, { error: 'BAD_RESPONSE' });
  assert.match(logs[0], /^\[recommend\] bad_response/);
});

test('success returns the parsed titles and logs nothing', async () => {
  const text = JSON.stringify(['A', 'B', 'C', 'D', 'E']);
  const ok = JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] });
  const { res, logs } = await call({ fetchImpl: upstream(200, ok) });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { titles: ['A', 'B', 'C', 'D', 'E'] });
  assert.deepEqual(logs, []);
});

test('a network failure gives 502 UPSTREAM_ERROR and never logs library titles or the key', async () => {
  const { res, logs } = await call({ fetchImpl: async () => { throw new TypeError('fetch failed for ' + KEY + ' ' + TITLE); } });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.payload, { error: 'UPSTREAM_ERROR' });
  assert.match(logs[0], /^\[recommend\] unexpected name="TypeError"/);
  assert.ok(!logs[0].includes(KEY));
});

test('a timeout gives 504 TIMEOUT', async () => {
  const { res, logs } = await call({ fetchImpl: async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; } });
  assert.equal(res.statusCode, 504);
  assert.deepEqual(res.payload, { error: 'TIMEOUT' });
  assert.match(logs[0], /^\[recommend\] timeout/);
});

test('the request sent to Gemini carries the key only in the header', async () => {
  let seen;
  await call({ fetchImpl: async (url, init) => { seen = { url, init }; return new Response('{}', { status: 500 }); } });
  assert.ok(!String(seen.url).includes(KEY));
  assert.equal(seen.init.headers['x-goog-api-key'], KEY);
});
