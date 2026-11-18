// Web only: remember that this browser has really used the app (saved a title), so the landing
// page at / can send returning users straight to /app. The landing page (site/app/layout.jsx)
// reads the same key from the same origin. Everything fails soft: no storage, no flag.
export const USED_KEY = 'panelpaw:used';
export const LANDING_PARAM = 'landing';

const webStorage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

export function markAppUsed(storage = webStorage()) {
  if (!storage) return false;
  try { storage.setItem(USED_KEY, '1'); return true; } catch { return false; }
}

export function hasUsedApp(storage = webStorage()) {
  try { return storage?.getItem(USED_KEY) === '1'; } catch { return false; }
}

// Mirrors the inline script in site/app/layout.jsx.
export function shouldSkipLanding({ used, search = '', hash = '' }) {
  if (!used || hash) return false;
  return !new URLSearchParams(search).has(LANDING_PARAM);
}
