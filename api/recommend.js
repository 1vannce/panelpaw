// Vercel serverless function: POST /api/recommend
// Body: { library: [{ title, status, format }] }  ->  { titles: string[] }
// The Gemini key stays in the GEMINI_API_KEY env var and never reaches the client bundle.
import { buildPrompt, describeUpstreamError, MODEL, parseRecommendations, quote, sanitizeLibrary } from './_lib.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
const TIMEOUT_MS = 9000;

// Failures are logged to the Vercel runtime logs, one line each, prefixed "[recommend]".
// Never log the key, request headers, the prompt or library titles.
const log = (line) => console.error('[recommend] ' + line);

function fail(res, status, code) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json({ error: code });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'METHOD_NOT_ALLOWED');
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    log('missing_key GEMINI_API_KEY is not set for this environment');
    return fail(res, 503, 'UNAVAILABLE');
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  const library = sanitizeLibrary(body && body.library);
  if (!library) return fail(res, 400, 'BAD_REQUEST');

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(library) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
          temperature: 0.8
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      log('upstream_error model=' + MODEL + ' ' + describeUpstreamError(response.status, detail, key));
      return response.status === 429 ? fail(res, 429, 'RATE_LIMITED') : fail(res, 502, 'UPSTREAM_ERROR');
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    const titles = parseRecommendations(text);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ titles });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      log('timeout after ' + TIMEOUT_MS + 'ms');
      return fail(res, 504, 'TIMEOUT');
    }
    if (error?.code === 'BAD_RESPONSE') {
      log('bad_response ' + quote(error.message, key));
      return fail(res, 502, 'BAD_RESPONSE');
    }
    log('unexpected name=' + quote(error?.name ?? 'Error', key) + ' message=' + quote(error?.message ?? '', key));
    return fail(res, 502, 'UPSTREAM_ERROR');
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
