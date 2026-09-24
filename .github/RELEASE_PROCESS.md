# Release process

Git is local only. There is no remote, so nothing is pushed and there are no pull requests. A "PR" in the other docs means one branch merged into `main`.

## Branching
- `main` always builds and runs.
- One branch per concern, named `<kind>/<short-topic>` (`setup/phase-0`, `fix/exercise-order`, `refactor/server-split`). A refactor and a behavior change go on separate branches.
- Merge with `git merge --no-ff <branch>` so each change stays one unit in the history, then delete the branch.

## Version
- Semantic versioning in `package.json`: patch for fixes, minor for features, major for changes to stored data that old versions can't read.
- Every change adds a line under `## [Unreleased]` in `CHANGELOG.md`. A release renames that section to the new version and date, and bumps `package.json` in the same commit.

## Before merging
- [ ] `npx tsc -b` and `npm run build` pass (and the test suite, once it exists; see `docs/TESTING.md`)
- [ ] The app was checked with `npm run dev`, without writing test data into `data/gymmy.db`
- [ ] `CHANGELOG.md`, `README.md` and the matching area doc are updated
- [ ] Nothing from `data/`, `docs/plans/` or the spreadsheet is staged (`git status`)

## Commit messages
- Imperative subject under 72 characters (`Fix exercise order returned by /api/data`), then a body that says why.
- No emoji or exclamation marks.
