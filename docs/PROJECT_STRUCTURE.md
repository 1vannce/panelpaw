# Project Structure Guide

This guide explains what each folder in PanelPaw is for and how the parts connect. It is written for anyone browsing the code for the first time, including our instructor.

## The big picture

PanelPaw is a manga and manhwa tracker built with **Expo (React Native)** in plain JavaScript. The same code runs on Android, iOS, and the web. The web version is deployed on Vercel.

The app has no backend of its own. It reads from two outside APIs:

| Data | Where it comes from | Read or write |
| --- | --- | --- |
| Catalog (titles, covers, chapters, genres) | Public Kitsu API (`https://kitsu.app/api/edge`) | Read only |
| Your library (saved titles, progress, status, custom lists) | A MockAPI project the user connects (`/entries` and `/lists`) | Read and write |

```text
 Screen  ->  hook (TanStack Query)  ->  src/api/*.js  ->  Kitsu API  (catalog)
                                                     ->  MockAPI    (your library)
```

## Folder map

```text
panelpaw/
├── app/                        # ROUTES. Expo Router turns each file here into a screen URL.
│   ├── _layout.jsx             # Root layout: wraps the whole app in providers and sets up the screen stack
│   ├── (tabs)/                 # The bottom tab bar. "(tabs)" is a group name, so it does not appear in the URL.
│   │   ├── _layout.jsx         # Defines the two tabs: Discover and My library
│   │   ├── index.jsx           # "/"          -> Discover (search the catalog)
│   │   └── library.jsx         # "/library"   -> My library
│   ├── title/[id].jsx          # "/title/123" -> Title details. [id] means the part of the URL is a variable.
│   └── connection.jsx          # "/connection" -> Pop-up screen for setting the tracker API URL
│
├── src/                        # APP CODE. The route files above are one line each; the real screens live here.
│   ├── screens/                # One file per screen
│   │   ├── HomeScreen.jsx          # Search box, format and genre filters, scrolling catalog results
│   │   ├── TitleDetailsScreen.jsx  # Cover, synopsis, chapter progress, reading status, add to lists
│   │   ├── LibraryScreen.jsx       # Saved titles grouped by status, plus custom lists
│   │   └── ConnectionScreen.jsx    # Enter, test, and save the MockAPI base URL
│   │
│   ├── api/                    # Talks to the internet. No React code here.
│   │   ├── http.js             # Shared fetch wrapper: JSON parsing, 15 s timeout, one retry for reads (never for writes), error messages
│   │   ├── catalog.js          # Kitsu requests. Turns Kitsu's response into the simple title objects the app uses.
│   │   └── tracker.js          # MockAPI requests (GET/POST/PUT/DELETE on /entries and /lists) and input checks
│   │
│   ├── hooks/                  # React hooks that connect screens to the api/ functions
│   │   ├── useCatalog.js       # Loads catalog pages (infinite scroll) and single titles, with caching
│   │   └── useTracker.js       # Loads and saves library entries and lists, then refreshes the screen data
│   │
│   ├── providers/              # Wrappers that give every screen shared state
│   │   ├── AppProviders.jsx        # Loads fonts, creates the TanStack Query cache, adds safe-area support
│   │   └── ConnectionProvider.jsx  # Picks the tracker API URL (saved choice, else EXPO_PUBLIC_TRACKER_API_URL) and remembers it
│   │
│   ├── components/ui.jsx       # Reusable UI pieces: Button, IconButton, Chip, Cover, Notice, headings
│   ├── config.js               # Cleans up and checks the tracker URL and decides which URL to use by default
│   ├── theme.js                # Colors and font names used everywhere (black and white theme)
│   └── types.js                # Reading statuses: Reading, Want to read, Completed, On hold, Dropped
│
├── assets/
│   ├── branding/               # PanelPaw cat logo (PNG and SVG)
│   └── fonts/                  # Geist font files and their license
│
├── tests/                      # Automated tests (run with npm test)
│   ├── api.test.js             # Checks the API layer: response mapping, validation, error handling
│   └── config.test.js          # Checks URL clean-up and the default connection logic
│
├── docs/
│   ├── API_SETUP.md            # How to create the MockAPI project, data fields, and moving off the old demo API
│   ├── PROMPT_TEMPLATE.md      # Template for asking AI assistants for scoped changes
│   └── PROJECT_STRUCTURE.md    # This guide
│
├── .env.example                # EXPO_PUBLIC_TRACKER_API_URL: the default tracker URL (copy to .env)
├── app.json                    # Expo app settings: name, icon, Android/iOS IDs, web output
├── package.json                # Dependencies and scripts (start, web, test, export:web)
├── vercel.json                 # Vercel deploy: builds with npm run export:web and serves the dist/ folder
├── .vercelignore               # Files Vercel should not upload
├── AGENTS.md, CLAUDE.md        # Rules for AI coding assistants used on this project
└── README.md                   # How to run, deploy, and connect your own tracker
```

## Why `app/` and `src/screens/` are separate

Expo Router uses **file-based routing**: the file path inside `app/` becomes the screen's address. To keep routing easy to read, each route file only re-exports a screen:

```js
// app/(tabs)/index.jsx
export { default } from '../../src/screens/HomeScreen';
```

So `app/` answers "which screens exist and what are their URLs", and `src/screens/` answers "what does each screen do".

## Follow one action: updating chapter progress

1. The user opens a title. `app/title/[id].jsx` shows `src/screens/TitleDetailsScreen.jsx`.
2. The screen loads the title with `useTitle()` from `src/hooks/useCatalog.js`, which calls `src/api/catalog.js` (Kitsu).
3. The screen loads the saved entry with `useEntries()` from `src/hooks/useTracker.js`.
4. The user changes the chapter. `useTrackerMutations()` calls the API object made by `createTrackerApi(baseUrl)` in `src/api/tracker.js`.
5. `tracker.js` checks the value (chapter cannot go below 0 or past the total), then sends `PUT /entries/:id` through `src/api/http.js`.
6. When the save succeeds, TanStack Query refreshes the library data, so the Library tab is up to date too.

## Where to find things

| I want to see... | Look in |
| --- | --- |
| The list of screens and URLs | `app/` |
| What a screen looks like and does | `src/screens/` |
| The calls to Kitsu | `src/api/catalog.js` |
| The calls that save my library | `src/api/tracker.js` |
| Error handling, timeouts, retries | `src/api/http.js` |
| Colors and fonts | `src/theme.js` |
| Tests | `tests/` |
| How to set up the tracker API | `docs/API_SETUP.md` |
| Deployment settings | `vercel.json` |

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server (scan the QR code with Expo Go) |
| `npm run web` | Run the app in a browser |
| `npm test` | Run the tests in `tests/` |
| `npm run export:web` | Build the web version into `dist/` (Vercel runs this) |
