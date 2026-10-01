# Gymmy — Agent Doc Map

A single-user Push/Pull/Legs workout tracker (React + Vite) that stores its history in a local SQLite file through the Vite dev server.

This file is the map, not the manual. The repository is the system of record: what you need to know lives in the docs below, and what is not written in the repo does not exist for the next session. Read only the docs your task needs.

| Doc | Read when |
| :-- | :-- |
| [.github/RELEASE_PROCESS.md](.github/RELEASE_PROCESS.md) | **Before any commit, push, or PR** (branching, version, guardrails, checklist) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Finding where code lives, or changing how parts depend on each other |
| [docs/design-docs/core-beliefs.md](docs/design-docs/core-beliefs.md) | Your first task in this repo, or when two docs seem to disagree |
| [docs/design-docs/index.md](docs/design-docs/index.md) | Making a technical decision, or asking why something is built the way it is |
| [README.md](README.md) | Changing what the app does for the user (features, setup) |
| [docs/PLANS.md](docs/PLANS.md) | Starting work that spans several sessions or areas |
| [docs/exec-plans/active/](docs/exec-plans/active/) | Resuming work, or before starting something that may already be planned |
| [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md) | Taking a shortcut, or looking for known gaps |
| [docs/CODE_STYLE.md](docs/CODE_STYLE.md) | Writing or reviewing code |
| [docs/TESTING.md](docs/TESTING.md) | Running or writing tests |
| [docs/RELIABILITY.md](docs/RELIABILITY.md) | Handling errors, timeouts, offline behavior or logging |
| [docs/SECURITY.md](docs/SECURITY.md) | Handling input, the access key, user data or dependencies |
| [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | Choosing what to improve, or after a change that moves a grade |
| [docs/references/](docs/references/) | Using a third-party library: its llms.txt here is newer than your memory of it |
| [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md) | Adding, moving or checking a doc, or running the doc-gardening pass |
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
| Typecheck + tests with coverage thresholds | `npm run test:ci` |
| Production build | `npm run build` |
| Serve the build (with the `/api` backend) | `npm run preview` |
| Doc checks | `node scripts/check-docs.mjs` |
| Tracked-files check | `node scripts/check-tracked-files.mjs` (`--staged`: staged files only) |
| Repo checker tests | `node --test scripts/*.test.mjs` |
| Everything CI runs | The three rows above, gitleaks, `npm run test:ci` and the build |

## Always
- Tests never use the network or real data. Use in-memory or temp-dir stores; see [docs/TESTING.md](docs/TESTING.md).
- `data/gymmy.db` and `Fundamentals Workout.xlsx` are the user's real training data. Open them read-only for analysis, and never run write or cleanup scripts against them unless asked.
- Committed files never reveal this machine: no home-folder paths, no local user or host names. Enable the pre-commit hook that checks this once per clone: `git config core.hooksPath .githooks` ([guardrails](.github/RELEASE_PROCESS.md)).
- If the user says a long-running job is running, leave every file that job loads unchanged until they say it has finished.
- Work that spans sessions or areas gets an exec plan in `docs/exec-plans/active/` ([docs/PLANS.md](docs/PLANS.md)), committed with the code and updated as you go. Scratch notes go in `docs/scratch/`, which git ignores; never commit them.
- A decision, constraint or known gap that matters beyond this session goes into the doc that owns it, in the same change. When you change behavior, update the docs that describe it, set their `last-verified`, and run the doc checks. Rules: [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md).
- The repository is on GitHub (`origin`, xms61/Gymmy). Push each branch and open a pull request into `main`; never push to `main` directly. CI (`.github/workflows/ci.yml`) must pass before a merge.
- Never rename these. Stored data and saved sessions depend on them:
  - the localStorage keys listed in `src/services/STORAGE.md`;
  - the `/api/*` paths;
  - the exercise `id`s in `src/data/seedData.ts`, because saved sessions refer to exercises by `exerciseId`;
  - the SQLite table and column names in `data/gymmy.db`.
- Code style: small functions, clear names instead of comments, no speculative abstractions, no emoji or marketing words in code, logs or docs. Delete dead code instead of keeping it "for later". Details: [docs/CODE_STYLE.md](docs/CODE_STYLE.md).
