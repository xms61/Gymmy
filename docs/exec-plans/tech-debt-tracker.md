---
status: draft
last-verified: 2026-10-01
---

# Tech debt tracker

Known shortcuts and gaps, written down so they are paid off on purpose instead of rediscovered. Add a row when you take on or find debt; delete the row in the change that pays it off (git keeps the history).

| Debt | Where | Cost of leaving it | Found | Plan |
| :-- | :-- | :-- | :-- | :-- |
| No linter or formatter | `package.json`, `.github/workflows/ci.yml` | The layer rules in ARCHITECTURE.md and the code style are checked only in review, and formatting drifts between files | 2026-10-01 | Add ESLint (with `no-restricted-imports` for the layers) and Prettier in their own PR, formatting the whole codebase in one commit |
| React components have no automated tests | `src/components/` | UI regressions are found only by hand in `npm run dev` | 2026-10-01 | Add Vitest with jsdom and Testing Library for the tracker first, since it holds the most logic |
