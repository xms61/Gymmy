# Review guidelines

For the Claude Code `reviewer` subagent (`.claude/agents/reviewer.md`) and for people. No AI reviewer runs in CI. Keep it short: a long review brief dilutes the rules that matter.

## Report
- Only issues that matter: bugs, security problems, data loss, behavior the change claims but doesn't deliver, and new behavior without a test. Label each **P0** (must fix before merge) or **P1** (should fix before merge).
- Each finding gives the file and line, the situation in which it goes wrong, and a suggested fix.
- At most three P2 nits, and only when they hurt readability. If the change is sound, say so in one line instead of looking for something to report.

## Skip
- Anything CI enforces: formatting, lint, doc structure, tracked-file rules.
- Generated files, lockfiles and `docs/scratch/`.
- Style preferences that [docs/CODE_STYLE.md](docs/CODE_STYLE.md) doesn't state.

## Always check
- Tests: new behavior has a test that fails without the change, and no test or check was weakened, skipped or deleted to get green. A test that would still pass if every function it calls returned nothing counts as missing.
- Secrets and machine details: none in code, logs, docs or fixtures ([docs/SECURITY.md](docs/SECURITY.md)).
- Stored data: no rename of a localStorage key, an `/api/*` path, an exercise `id` or a SQLite table or column ([AGENTS.md](AGENTS.md)), and no test or script that writes to `data/` or the routine spreadsheet.
- Docs: changed behavior is reflected in the doc the [AGENTS.md](AGENTS.md) map points to.
- Agent and CI config: changes to `.github/workflows/`, `.claude/`, `.githooks/` or `scripts/agent-hooks/` are flagged for a human reviewer. CI runs no AI agent; a change that adds one needs the rules in [docs/SECURITY.md](docs/SECURITY.md#agents-in-ci).

## Re-reviews
Report only new findings and whether earlier ones were fixed. Don't repeat resolved points.
