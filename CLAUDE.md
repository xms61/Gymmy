@AGENTS.md

## Claude Code
- Skills live in `.claude/skills/`; `npm run check:skills` checks their frontmatter ([docs/AGENT_TOOLS.md](docs/AGENT_TOOLS.md)).
- Before you call a non-trivial change done, have the `reviewer` subagent review the diff in a fresh context.
- Shared permissions, sandbox and hooks are in `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json`, which git ignores.
