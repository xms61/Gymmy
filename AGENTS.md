# Gymmy — Agent Doc Map

A single-user Push/Pull/Legs workout tracker (React + Vite) that stores its history in a local SQLite file through the Vite dev server.

Read only the doc(s) matching your task.

| Doc | Read when |
| :-- | :-- |
| [.github/RELEASE_PROCESS.md](.github/RELEASE_PROCESS.md) | **Before any commit** (branching, version bump, checklist) |
| [docs/CODE_STYLE.md](docs/CODE_STYLE.md) | Writing or reviewing code |
| [docs/TESTING.md](docs/TESTING.md) | Running or writing tests |
| [src/components/tracker/TRACKER.md](src/components/tracker/TRACKER.md) | Touching the live workout screen, drafts, the rest timer or its chime |
| [src/services/STORAGE.md](src/services/STORAGE.md) | Touching browser storage, the outbox or `StorageService` |
| [server/SERVER.md](server/SERVER.md) | Touching the `/api` routes, the SQLite schema or `src/validation.ts` |
| [src/theme/THEME.md](src/theme/THEME.md) | Touching colors, fonts, themes, `tailwind.config.ts`, `src/index.css` or `src/components/ui/` |

## Commands
| Task | Command |
| :-- | :-- |
| Install | `npm ci` |
| Dev server (with the `/api` backend) | `npm run dev` |
| Typecheck | `npm run typecheck` |
| All tests | `npm test` |
| One test file | `node --test tests/overloadEngine.test.ts` |
| Everything CI runs (typecheck + tests with coverage thresholds) | `npm run test:ci` |
| Production build | `npm run build` |
| Serve the build (with the `/api` backend) | `npm run preview` |

## Always
- Tests never use the network or real data. Use in-memory or temp-dir stores; see `docs/TESTING.md`.
- `data/gymmy.db` and `Fundamentals Workout.xlsx` are the user's real training data. Open them read-only for analysis, and never run write or cleanup scripts against them unless asked.
- If the user says a long-running job is running, leave every file that job loads unchanged until they say it has finished.
- Plans and scratch notes go in `docs/plans/`, which git ignores. Never commit them.
- Git is local only. There is no remote: never add one and never push.
- Never rename these. Stored data and saved sessions depend on them:
  - the localStorage keys listed in `src/services/STORAGE.md`;
  - the `/api/*` paths;
  - the exercise `id`s in `src/data/seedData.ts`, because saved sessions refer to exercises by `exerciseId`;
  - the SQLite table and column names in `data/gymmy.db`.
- Code style: small functions, clear names instead of comments, no speculative abstractions, no emoji or marketing words in code, logs or docs. Delete dead code instead of keeping it "for later". Update the area doc in the same change. Details: `docs/CODE_STYLE.md`.
