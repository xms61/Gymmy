# <Project name> — Agent Doc Map

<One sentence: what this project is and who uses it.>

Read only the doc(s) matching your task.

| Doc | Read when |
| :-- | :-- |
| [.github/RELEASE_PROCESS.md](.github/RELEASE_PROCESS.md) | **Before any commit, push, or PR** (branching, version bump, guardrails, checklist) |
| [docs/CODE_STYLE.md](docs/CODE_STYLE.md) | Writing or reviewing code |
| [docs/TESTING.md](docs/TESTING.md) | Running or writing tests |
| <path/to/AREA.md> | <Touching that area: one row per area doc, next to the code it describes> |

## Commands
| Task | Command |
| :-- | :-- |
| Install | `<npm ci>` |
| Dev server | `<npm run dev>` |
| Lint / format | `<npm run lint>` / `<npm run format>` |
| Typecheck | `<npm run typecheck>` |
| All tests | `<npm test>` |
| One test file | `<node --test path/to/file.test.ts>` |
| Everything CI runs | `<npm run test:ci>` |

## Always
- Tests never use the network or real data. Use in-memory or temp-dir stores and the test stubs listed in `docs/TESTING.md`.
- `<data/ or other path>` holds the user's real data. Open it read-only for analysis, and never run write or cleanup scripts against it unless asked.
- If the user says a long-running job is running, leave every file that job loads unchanged until they say it has finished.
- Plans and scratch notes go in `docs/plans/`, which git ignores. Never commit or push them.
- Script flags go after `--`: `<npm run task -- --flag=value>`.
- <Names that must never be renamed, and why (storage keys, env vars, volume names, public API paths).>
- Code style: small functions, clear names instead of comments, no speculative abstractions, no emoji or marketing words in code, logs or docs. Delete dead code instead of keeping it "for later". Update the area doc in the same change. Details: `docs/CODE_STYLE.md`.
