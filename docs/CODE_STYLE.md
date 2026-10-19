---
status: draft
last-verified: 2026-10-19
---

# Code Style

Code should read like the code around it. When this file and the surrounding code disagree, follow this file, and fix the surrounding code when you are already changing it.

## Shape
- Small functions that each do one thing. A function that needs a comment to explain its sections should be split into named functions instead.
- Names say what a thing is or does (`completedExerciseLogs`, `hasValidRepRange`). Avoid `data`, `info`, `helper`, `utils`, `manager`, `handle2`.
- One source of truth per concept (one list of split types in `SPLIT_TYPES`, one parser per payload in `src/validation.ts`, one table of loading steps in `LOADING`). Import it; don't copy it.
- Keep modules at one level of abstraction: an HTTP route validates, calls a service and responds. It doesn't build SQL.
- Prefer plain data and functions. Add a class only when it owns state or a lifecycle (a database handle, a connection).

## Do not add
- Abstractions for a second use case that doesn't exist yet (plugin systems, generic repositories, factories for one product, config switches nobody sets).
- New dependencies for something the standard library or an existing dependency already does. When one is needed, prefer a boring, well-known library: agents and new people already know it, and its API is stable.
- Dead code, commented-out code, "kept for later" branches, unused exports or parameters. Delete them; git remembers.
- Emoji, marketing words ("blazing", "robust", "seamless", "powerful") or exclamation marks in code, logs, commit messages or docs.

## Comments
- Explain *why* (a constraint, a trade-off, a bug being avoided), never *what* the next line does.
- Keep them short. A module header says what the module owns in one or two sentences.
- A temporary workaround names its exit condition: `// ... narrower than the code (removed when X moves to TypeScript)`.

## Errors and boundaries
- Validate every external input (HTTP bodies, query strings, messages, CLI flags, files) at the boundary, in one place, and trust it inside.
- Error messages say what went wrong and how to fix it. The reader is often an agent that will act on the message.
- Fail loudly on programmer errors. Degrade gracefully only on expected runtime failures (network, rate limits), and log them once with enough context.
- CLI scripts parse flags strictly: an unknown flag prints the usage and exits non-zero. Anything that deletes data makes a backup first or has a dry-run mode.

## Types (typed languages)
- Type the boundaries (payloads, rows, public functions). Let inference handle locals.
- `unknown` plus a narrowing check beats `any`. A cast needs a comment saying why it is safe.

## Changes
- One concern per PR. A refactor and a behavior change go in separate PRs.
- Update the matching area doc, `README.md` and `CHANGELOG.md` in the same change.
- Leave the code a little cleaner than you found it, within the files you are already touching.
- Commit and PR rules are in the [release process](../.github/RELEASE_PROCESS.md). Claude Code records its part itself, with a `Co-Authored-By` trailer on its commits and an attribution line at the end of its pull request descriptions. Keep what it adds, and don't write a second credit by hand.

## Custom checks
When a rule can be checked, write the check instead of the sentence. The [retro skill](../.claude/skills/retro/SKILL.md) decides which level a rule gets; this is how to write the check.
- Configure an existing rule before writing a new one. Most "use X, not Y" rules are a setting of a rule the linter already has, such as ESLint's `no-restricted-imports` or `no-restricted-syntax`, with a custom message.
- The error names the fix: the file, function or command to use instead, in words an agent can act on.
- Each custom rule has a test with a failing case taken from the real mistake and a passing case for the right form, such as `invalid` and `valid` cases in the linter's `RuleTester`.
- When the pattern is already common, fail only on new occurrences (ESLint's bulk suppressions), and put the existing ones in the [tech-debt tracker](exec-plans/tech-debt-tracker.md).
- An exception sits on the offending line, names the rule, and says why, who approved it and, if it is temporary, when it expires. Disabling a rule for a whole file or the project needs a person's approval.
- A check that runs while an agent edits, from a hook, reports only findings with a clear fix. A finding without one makes the agent rewrite code just to silence it; leave those to `npm run verify` and review.
- For the repo's own structure, write a Node script in `scripts/` with tests, like the doc checks. Gymmy has no linter yet ([tech-debt tracker](exec-plans/tech-debt-tracker.md)).
