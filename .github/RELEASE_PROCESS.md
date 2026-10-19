# Release process

The repository is on GitHub (`origin`, xms61/Gymmy). Each change is one branch, pushed to `origin` and merged into `main` through a pull request once CI passes.

## Guardrails
- Never push to `main`: it changes only through a merged PR.
- Never commit `.env`, keys, tokens, `data/` (the database, its backups, the access key), the routine spreadsheet, or anything in `docs/scratch/` or `docs/plans/`. Git history keeps a file after it is deleted.
- Never commit details of this machine: absolute paths into a home folder, the local user or host name, or folder layouts outside the repo.
- `npm run check:files` ([scripts/check-tracked-files.mjs](../scripts/check-tracked-files.mjs)) enforces both rules, plus a 1 MiB limit per file (lockfiles excepted). The pre-commit hook runs it on staged files, with the doc and skills checks and gitleaks when it is installed; enable the hook once per clone with `npm run setup`. CI runs it on every tracked file, and gitleaks scans the commits for secrets and home-folder paths ([.gitleaks.toml](../.gitleaks.toml)). What enforces every other boundary is in [SECURITY.md](../docs/SECURITY.md#boundaries-and-what-enforces-them).
- Run `git status` before `git add`, and stage explicit paths (no `git add -A` on a dirty tree).
- Never skip hooks (`--no-verify`) or force-push a shared branch.

## Branching
- `main` always builds and runs.
- One branch per concern, named `<kind>/<short-topic>` (`setup/phase-0`, `fix/exercise-order`, `refactor/server-split`). A refactor and a behavior change go on separate branches.
- Merge the pull request with "Create a merge commit" (the same as `git merge --no-ff`), so each change stays one unit in the history, then delete the branch.

## Version
- Semantic versioning in `package.json`: patch for fixes, minor for features, major for changes to stored data that old versions can't read.
- Every change adds a line under `## [Unreleased]` in `CHANGELOG.md`. A release renames that section to the new version and date, and bumps `package.json` in the same commit.

## Before merging
- [ ] `npm run verify` passes locally, and CI passes on the pull request
- [ ] For a non-trivial change, the Claude Code `reviewer` subagent reviewed the diff by [REVIEW.md](../REVIEW.md), and its P0 and P1 findings are fixed
- [ ] The app was checked with `npm run dev`, without writing test data into `data/gymmy.db`
- [ ] `CHANGELOG.md`, `README.md` and the docs describing the changed code are updated, with a new `last-verified` ([knowledge base rules](../docs/KNOWLEDGE_BASE.md))
- [ ] The exec plan's progress and decision log are current, if the work has one
- [ ] Nothing from `data/`, `docs/scratch/`, `docs/plans/` or the spreadsheet is staged (`git status`)

## Pull request
```bash
git push -u origin <branch>
gh pr create --base main --head <branch> --title "<summary>" --body "<summary, key changes, checks>"
```
- The body follows [the template](pull_request_template.md): what changed, what was checked, and what was not checked and why.
- If a PR is already open for the branch, push more commits to it.

CI ([.github/workflows/ci.yml](workflows/ci.yml)) runs on every pull request and every push to `main`, and can also be started by hand. No AI agent runs in it.
- `verify` runs `npm run verify` on Linux, and `verify on windows-latest` and `verify on macos-latest` run it on the other systems the hooks and scripts run on.
- `secrets` runs gitleaks over the pull request's commits, or the whole history on `main`.

## Before a release
Run the [doc-gardening pass](../.claude/skills/doc-gardening/SKILL.md) and merge its fix-up PRs before naming the release in `CHANGELOG.md`.

## Commit messages
- Imperative subject under 72 characters (`Fix exercise order returned by /api/data`), then a body that says why.
- No emoji or exclamation marks.
