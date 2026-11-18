# AGENTS.md

PanelPaw is a manga/manhwa reading tracker: Expo SDK 58, React Native 0.88, React 19, Expo Router, TanStack Query. It is plain JavaScript (no TypeScript). Catalog data comes from the public Kitsu API; saved entries and lists live in an external MockAPI-style REST service. There is no local backend.

## Commands

Run from this directory (the repository root). Use Node 22.13+, 24.3+ or 26+.

```sh
npm ci                          # install exact locked dependencies
npm start                       # Expo dev server (npm run web / android / ios)
npm test                        # node --test tests/*.test.js
npm run export:web              # app-only web build into dist/ (served at /)
npm run build:web               # deploy build: landing site at /, app at /app, into dist/
npm run site:dev                # landing site dev server on :3001 (run `npm --prefix site ci` first)
npx expo install --check        # verify SDK-compatible dependency versions
npx expo-doctor
```

Stop the running Expo server before `npm ci` on Windows; it locks native files. After changing `.env`, restart with `npx expo start --clear`.

## Layout

- `app/` Expo Router routes only (thin wrappers): `(tabs)/index`, `(tabs)/library`, `title/[id]`, `connection`.
- `src/screens/` screen components (Home, TitleDetails, Library, Connection).
- `src/api/` `http.js` (Fetch, timeouts, GET-only retry), `catalog.js` (Kitsu), `tracker.js` (entries/lists CRUD and validation).
- `src/hooks/` TanStack Query hooks: `useCatalog`, `useTitle`, `useEntries`, `useLists`, `useTrackerMutations`.
- `src/providers/` query client and connection (endpoint preference) state.
- `src/components/ui.jsx`, `src/theme.js` shared UI primitives and tokens. `src/providers/ThemeProvider.jsx` supplies the active palette (`useTheme`, `useThemed`).
- `src/library.js` (library sort, continue-reading), `src/usage.js` (web flag that lets the landing page skip for returning users), `src/haptics.js` (native only).
- `src/config.js` endpoint normalization; `src/types.js` reading status values/labels.
- `tests/` Node test runner tests for API contract and config. `docs/API_SETUP.md` is the REST contract and migration guide.
- `site/` separate Next.js (static export) landing site with its own `package.json` and lockfile. `metro.config.cjs` keeps Metro out of it; `app.config.js` sets the app's `/app` base URL only when `EXPO_BASE_URL` is set (by `scripts/build-web.mjs`).

## Landing site (`site/`)

- Never import from `src/` or the root `node_modules`; copy brand assets instead. Do not use npm workspaces.
- Static sample data only (`site/lib/site.js`); status labels match `src/types.js`. No real Kitsu covers in marketing art.
- Motion: GSAP + Lenis in `site/components/Motion.jsx`. Every effect respects `prefers-reduced-motion`; markup must read fine without JS. No WebGL.
- Palette: the app's black/white/gray plus one accent (`--accent`, hanko red) for hover and the 完 stamp only. The app now uses red more widely (see Conventions); the landing page has not been updated to match.
- Returning users: `site/app/layout.jsx` redirects `/` to the app when the browser has the `panelpaw:used` flag (set by the app after the first saved title). `/?landing` or any `#hash` keeps the landing page. Keep it in step with `src/usage.js`.
- Vercel: one project (`panelpaw`). `vercel.json` rewrites `/app/*` to the app and redirects old app routes (`/library`, `/connection`, `/title/:id`) under `/app`.

## Conventions

- Server state belongs in TanStack Query hooks, not in a second global store. Local React state is for inputs, filters and drafts.
- All tracker I/O goes through `src/api/tracker.js` and `src/api/http.js`. Never retry writes automatically; only GETs may retry.
- Never silently fall back to local data when the API fails; show the error state.
- Use the theme tokens and `ui.jsx` primitives (black/white/gray palette, Geist Sans) rather than ad hoc styles. Never import a static colour table: get `colors` from `useThemed(makeStyles)` (styles built from the active palette; light and dark, with a System/Light/Dark toggle). The only colour is `colors.highlight` (hanko red): hover/press, progress fill, active tab and format markers, small labels and tags, links, focus, errors, index numbers and the 完 stamp. Primary buttons and selected chips stay ink. Check contrast (`tests/theme.test.js`) when changing a palette.
- Motion uses `react-native-reanimated` through `ui.jsx` (`ScreenEnter`, `Cover` lift/stamp, `ProgressBar`). Keep it subtle and honour reduce motion (`useReducedMotion`, Reanimated's default `ReduceMotion.System`).
- Reading statuses are `reading`, `planned`, `completed`, `on_hold`, `dropped`. Progress is a nonnegative integer, capped by the total when known (`null` when unknown). A title belongs to at most one custom list.
- Catalog IDs are numeric Kitsu manga IDs. Space Kitsu requests ~1.05 s apart.
- Match the surrounding code's style. Add dependencies only when necessary, and use `npx expo install` so versions match the SDK.

## Secrets and files not to touch

- `.env` is gitignored and may hold a real endpoint. Do not print, commit or edit it. Only `.env.example` (blank placeholder) is tracked. Never put keys, tokens or dashboard URLs in tracked files.
- Do not edit `dist/`, `.expo/`, `node_modules/`, `.npm-cache/`, `output/`, `site/.next/`, `site/out/` (generated or local).
- The anonymous Beeceptor demo endpoint expires around 2026-11-10; do not use it as a default. See `docs/API_SETUP.md` before changing connection logic.

## Verification

- Run `npm test` after changing `src/api/`, `src/config.js` or validation logic, and add tests for new behavior there.
- For UI changes, run the app (`npm run web`) and check the affected screen, including loading, empty and error states.
- For `site/` or routing changes, run `npm run build:web`, serve `dist/`, and check `/` (desktop and phone width) and that `/app` loads the tracker.
- Report only the checks you actually ran.

## Commits

Use Conventional Commits: `type(scope): short description` (lowercase, imperative, no trailing period). One coherent change per commit.
