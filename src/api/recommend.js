import { Platform } from 'react-native';
import { ApiError, requestJson } from './http.js';

// Same origin on the web (the app is served by the same Vercel project); native has no origin, so it calls production.
const ENDPOINT = Platform.OS === 'web' ? '/api/recommend' : 'https://panelpaw.vercel.app/api/recommend';

/** Asks the serverless function for suggested titles. Throws ApiError; callers fall back, never show it raw. */
export async function requestRecommendations(library, signal) {
  const data = await requestJson(ENDPOINT, { method: 'POST', body: { library }, signal, timeoutMs: 12000 });
  // POST is never retried by requestJson, so one failed call goes straight to the caller's fallback.
  const titles = data && Array.isArray(data.titles) ? data.titles.filter((t) => typeof t === 'string' && t.trim()) : [];
  if (titles.length === 0) throw new ApiError('The recommendation service returned no titles.', { code: 'INVALID_RESPONSE' });
  return titles;
}
