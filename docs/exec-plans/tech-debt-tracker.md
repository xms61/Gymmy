---
status: draft
last-verified: 2026-10-19
---

# Tech debt tracker

Known shortcuts and gaps, written down so they are paid off on purpose instead of rediscovered. Add a row when you take on or find debt; delete the row in the change that pays it off (git keeps the history).

| Debt | Where | Cost of leaving it | Found | Plan |
| :-- | :-- | :-- | :-- | :-- |
| No linter or formatter | `package.json`, `.github/workflows/ci.yml` | The layer rules in ARCHITECTURE.md and the code style are checked only in review, and formatting drifts between files | 2026-10-01 | Add ESLint (with `no-restricted-imports` for the layers) and Prettier in their own PR, formatting the whole codebase in one commit. Check first that typescript-eslint supports TypeScript 7; when ysto added it, typescript-eslint supported TypeScript below 6.1 only |
| React components have no automated tests | `src/components/` | UI regressions are found only by hand in `npm run dev` | 2026-10-01 | Add Vitest with jsdom and Testing Library for the tracker first, since it holds the most logic |
| "Never weaken, skip or delete a failing test" has only review and the coverage thresholds behind it | `tests/`, `package.json` | A skipped test (`test.skip`, `{ skip: true }`) or a narrowed assertion passes CI | 2026-10-19 | With the linter above, turn on rules against skipped and focused tests, or a script in `scripts/` that fails on `skip`/`only` in `tests/` |
| "Ask before adding a dependency" and "never downgrade one" are only partly enforced | `package.json` | Claude Code asks before `npm install` and `npm i` only; `npm add` and hand edits of `package.json` get through | 2026-10-19 | A CI check that compares `package.json` with the base branch and fails on an added or lowered dependency unless the pull request says who approved it |
| Claude Code can write the training data from a shell command | `data/`, the spreadsheet | The deny rules cover its file edits only; a mistaken `sqlite3` or `rm` command reaches `data/gymmy.db` | 2026-10-19 | A guard-hook rule that blocks shell commands naming `data/` or the spreadsheet, except read-only `sqlite3 -readonly` |
| A local agent can read an unlabelled issue and run `gh` commands that send data out (`gh issue comment`, `gh gist`, `gh api`) without asking | `.claude/settings.json` | Untrusted issue text on a public repo could steer a session | 2026-10-19 | Ask rules for those `gh` commands in `.claude/settings.json` |
| No verification skill for the running app | `.claude/skills/` | Each session drives the UI its own way, and proofs of UI changes vary ([TESTING.md](../TESTING.md#proving-behavior)) | 2026-10-19 | Write `.claude/skills/verify-gymmy/` (launch from an empty worktree, doctor, drive, evidence, cleanup, feature map) |
| GitHub secret scanning, push protection and Dependabot security updates are off | Repository settings on GitHub | A pushed secret reaches GitHub before gitleaks in CI reports it, and a known-vulnerable dependency raises no alert or fix PR | 2026-10-19 | Turn on Dependabot alerts, Dependabot security updates, and secret scanning with push protection under Settings → Advanced Security (free for public repositories), then reword [SECURITY.md](../SECURITY.md) |
