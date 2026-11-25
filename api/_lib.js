// Helpers for api/recommend.js. The leading underscore keeps Vercel from exposing this file as a route.

/** The only place the Gemini model is named. Newest stable Flash-Lite; see the PR for how it was checked. */
export const MODEL = 'gemini-3.5-flash-lite';

const STATUSES = ['reading', 'planned', 'completed', 'on_hold', 'dropped'];
const MAX_ENTRIES = 40;
const MAX_TITLE = 120;
const MAX_RESULTS = 5;
const MIN_RESULTS = 3;

function badResponse(message) {
  const error = new Error(message);
  error.code = 'BAD_RESPONSE';
  return error;
}

/** Keeps only title, status and format from a client-supplied library. Returns null when nothing usable is left. */
export function sanitizeLibrary(value) {
  if (!Array.isArray(value)) return null;
  const clean = [];
  for (const item of value) {
    if (clean.length >= MAX_ENTRIES) break;
    if (!item || typeof item !== 'object' || typeof item.title !== 'string' || !STATUSES.includes(item.status)) continue;
    const title = item.title.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE);
    if (!title) continue;
    const format = typeof item.format === 'string' ? item.format.trim().slice(0, 20) : '';
    clean.push({ title, status: item.status, format });
  }
  return clean.length > 0 ? clean : null;
}

export function buildPrompt(library) {
  const lines = library.map((e) => `- ${e.title} (${[e.format, e.status].filter(Boolean).join(', ')})`);
  return [
    'You recommend manga and manhwa. Below is a reader\'s library with their reading status.',
    'Suggest 5 other titles they are likely to enjoy that are NOT already in the library.',
    'Prefer well-known titles that exist on the Kitsu catalog, written with their common English or romanized name.',
    'Answer with only a JSON array of 5 title strings.',
    '',
    'Library:',
    ...lines
  ].join('\n');
}

/** Turns the model's text into 3 to 5 clean titles, or throws an error with code BAD_RESPONSE. */
export function parseRecommendations(text) {
  if (typeof text !== 'string' || !text.trim()) throw badResponse('Empty response.');
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let data;
  try { data = JSON.parse(unfenced); } catch { throw badResponse('Response is not valid JSON.'); }
  const list = Array.isArray(data) ? data : data && Array.isArray(data.titles) ? data.titles : null;
  if (!list) throw badResponse('Response has no title list.');
  const seen = new Set();
  const titles = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const title = item.trim();
    const key = title.toLowerCase();
    if (!title || title.length > MAX_TITLE || seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }
  if (titles.length < MIN_RESULTS) throw badResponse('Too few usable titles.');
  return titles.slice(0, MAX_RESULTS);
}

const MAX_LOG_TEXT = 200;

/** Removes anything shaped like a Google API key. Defensive: the key is never logged on purpose. */
export function redact(text) {
  return String(text).replace(/AIza[\w-]+/g, '[redacted]');
}

function clip(text) {
  const clean = redact(text);
  return clean.length > MAX_LOG_TEXT ? clean.slice(0, MAX_LOG_TEXT) + '...' : clean;
}

/**
 * One log-safe line describing a non-OK Gemini response: HTTP status plus Google's error status, code and message
 * (message cut to about 200 characters), or the raw body cut the same way when it is not a Google error.
 * Never includes request data. Values are JSON-quoted so the line stays on one row.
 */
export function describeUpstreamError(httpStatus, bodyText) {
  const head = 'http=' + httpStatus;
  if (typeof bodyText !== 'string' || !bodyText.trim()) return head + ' body=empty';
  let error;
  try { error = JSON.parse(bodyText)?.error; } catch { /* not JSON: log the raw body below */ }
  if (error && typeof error === 'object') {
    const parts = [];
    if (typeof error.status === 'string') parts.push('google_status=' + redact(error.status).slice(0, 40));
    if (typeof error.code === 'number') parts.push('google_code=' + error.code);
    if (typeof error.message === 'string') parts.push('message=' + JSON.stringify(clip(error.message)));
    if (parts.length > 0) return head + ' ' + parts.join(' ');
  }
  return head + ' body=' + JSON.stringify(clip(bodyText.trim()));
}
