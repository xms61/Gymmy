---
status: draft
last-verified: 2026-10-01
---

# Tech debt tracker

Known shortcuts and gaps, written down so they are paid off on purpose instead of rediscovered. Add a row when you take on or find debt; delete the row in the change that pays it off (git keeps the history).

| Debt | Where | Cost of leaving it | Found | Plan |
| :-- | :-- | :-- | :-- | :-- |
| No linter or formatter | `package.json`, `.github/workflows/ci.yml` | The layer rules in ARCHITECTURE.md and the code style are checked only in review, and formatting drifts between files | 2026-10-01 | Add ESLint (with `no-restricted-imports` for the layers) and Prettier in their own PR, formatting the whole codebase in one commit. Check first that typescript-eslint supports TypeScript 7; when ysto added it, typescript-eslint supported TypeScript below 6.1 only |
| React components have no automated tests | `src/components/` | UI regressions are found only by hand in `npm run dev` | 2026-10-01 | Add Vitest with jsdom and Testing Library for the tracker first, since it holds the most logic |
| Full stops in body text look like commas | Barlow at 16px, e.g. the progression sentence in `ExerciseBoard.tsx` and `ProgressView.tsx` | "62.5 kg" can be misread as "62,5" in prose; numbers in data type at 1.125rem read correctly | 2026-10-01 | Set numbers inside prose in the data face, or raise body text to 1.125rem, then compare captures |
