# Changelog

All notable changes to **Gymmy** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Local git repository, release process (`.github/RELEASE_PROCESS.md`), agent doc map (`AGENTS.md`), code style and testing docs.

### Changed
- Tests run on Node's built-in test runner (`npm test`, `npm run test:ci` with coverage thresholds) and live in `tests/`. The `scripts/verify*` files are removed; `verifyDb.mjs` wrote a test session into the real database.
- Everything is TypeScript: the Tailwind config is `tailwind.config.ts`, PostCSS settings moved into `vite.config.ts`, and the server plugin and configs are now type-checked (`tsconfig.node.json`).
- Requires Node.js 22.18 or newer (`engines` in `package.json`).
- `README.md` rewritten from the repository template: setup, features and where data is stored.

---

## [1.0.0] - 2026-09-07

### Added
- Push/Pull/Legs tracker with a live set logger, rest timer, plate calculator, calendar, progress view, and Excel/JSON export.
- Local SQLite storage (`data/gymmy.db`) served by the Vite dev server, with a copy in browser storage.

---

Older releases (none yet) are in [docs/CHANGELOG-archive.md](docs/CHANGELOG-archive.md).
