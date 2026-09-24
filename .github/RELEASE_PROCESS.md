# Release process

The repository is on GitHub (`origin`, xms61/Gymmy). Each change is one branch, pushed to `origin` and merged into `main` through a pull request once CI passes.

## Branching
- `main` always builds and runs.
- One branch per concern, named `<kind>/<short-topic>` (`setup/phase-0`, `fix/exercise-order`, `refactor/server-split`). A refactor and a behavior change go on separate branches.
- Merge the pull request with "Create a merge commit" (the same as `git merge --no-ff`), so each change stays one unit in the history, then delete the branch.
- Never push to `main` directly.

## Version
- Semantic versioning in `package.json`: patch for fixes, minor for features, major for changes to stored data that old versions can't read.
- Every change adds a line under `## [Unreleased]` in `CHANGELOG.md`. A release renames that section to the new version and date, and bumps `package.json` in the same commit.

## Before merging
- [ ] `npm run test:ci` and `npm run build` pass locally, and CI (`.github/workflows/ci.yml`, which runs both) passes on the pull request
- [ ] The app was checked with `npm run dev`, without writing test data into `data/gymmy.db`
- [ ] `CHANGELOG.md`, `README.md` and the matching area doc are updated
- [ ] Nothing from `data/`, `docs/plans/` or the spreadsheet is staged (`git status`)

## Commit messages
- Imperative subject under 72 characters (`Fix exercise order returned by /api/data`), then a body that says why.
- No emoji or exclamation marks.
