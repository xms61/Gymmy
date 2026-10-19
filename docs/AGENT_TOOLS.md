---
status: draft
last-verified: 2026-10-19
---

# Agent tools

Claude Code is the only coding agent set up in this repo, and it runs only on a developer's machine: no AI agent runs in CI. This doc says which file configures what, and how to change it. The instructions themselves are in [AGENTS.md](../AGENTS.md), which [CLAUDE.md](../CLAUDE.md) imports.

## Files
| File | Purpose |
| :-- | :-- |
| [CLAUDE.md](../CLAUDE.md) | Imports AGENTS.md (an import instead of a symlink, because symlinks break on Windows checkouts), plus the few notes only Claude Code needs |
| [.claude/settings.json](../.claude/settings.json) | Shared permissions (allow, ask and deny rules), the sandbox and the guard hook |
| [.claude/agents/reviewer.md](../.claude/agents/reviewer.md) | A subagent that reviews the diff in a fresh context, by [REVIEW.md](../REVIEW.md) |
| `.claude/skills/` | Procedures loaded on demand, listed below |
| [scripts/agent-hooks/guard-tool-use.mjs](../scripts/agent-hooks/guard-tool-use.mjs) | Blocks edits to `.env`, keys, lockfiles and `.git/`, and commands that skip hooks, force-push or touch `.env` |
| `.claude/settings.local.json`, `CLAUDE.local.md` | Personal settings and notes; git ignores them |
| `.claude/launch.json` | The dev servers the desktop app's preview starts; local to each machine (`.git/info/exclude`) |

## Skills
| Skill | Use when |
| :-- | :-- |
| [exec-plan](../.claude/skills/exec-plan/SKILL.md) | Starting, resuming or finishing work that spans sessions, or splitting it into tickets |
| [doc-gardening](../.claude/skills/doc-gardening/SKILL.md) | Before a release, after a large change, or when asked to bring the docs back in line with the code |
| [diagnosing-bugs](../.claude/skills/diagnosing-bugs/SKILL.md) | Something is broken, throws, fails or got slow |
| [retro](../.claude/skills/retro/SKILL.md) | Only when asked: turning repeated agent mistakes into checks |

`npm run check:skills` ([scripts/check-skills.mjs](../scripts/check-skills.mjs)) checks each skill's frontmatter: a `name` that matches its folder, a description, and a valid `disable-model-invocation`. Claude Code skips a skill with a broken name or description without saying so. To scope rules to one folder, add a nested `AGENTS.md` there rather than a new skill.

## Notes
- **Sandbox:** it works on macOS, Linux and WSL2. On native Windows, commands run unsandboxed and the permission rules and the hook still apply. When the sandbox can't start, Claude Code warns and runs commands unsandboxed; on macOS, Linux and WSL2, make that a hard stop with `"sandbox": { "failIfUnavailable": true }` in `.claude/settings.local.json`. The shared settings leave it off so native Windows keeps working.
- **Training data:** the deny rules stop Claude Code from editing anything in `data/` or the routine spreadsheet, and from reading the access key. Reading `data/gymmy.db` for analysis stays allowed.
- **Changing this config:** Claude Code asks before it edits `.claude/`, `.github/workflows/`, `.githooks/`, `.npmrc` or `scripts/agent-hooks/`, and [REVIEW.md](../REVIEW.md) flags such changes for a person.

## Tickets on GitHub Issues
Exec plans can split their milestones into GitHub issues ([PLANS.md](PLANS.md#tickets)). Create the label agents take work from once:

```bash
gh label create ready-for-agent --color 0E8A16 --description "A ticket an agent may work on"
```

Claude Code uses the `gh` CLI, signed in with a fine-grained token limited to this repository ([SECURITY.md](SECURITY.md#tickets-and-untrusted-text)). It needs a `gh` whose `gh issue create --help` lists `--parent` and `--blocked-by`.

## Optional additions
- **MCP servers:** add them in `.mcp.json` and give each the narrowest scope that works. Every server's tools cost context, and every server is code you run.
- **Harder verification gate:** a `Stop` hook that runs `npm run verify` blocks a turn from ending while checks fail. It is slower and costs more per session; add it when sessions often stop before verifying. A hook after each edit runs only fast checks whose findings have a clear fix ([CODE_STYLE.md](CODE_STYLE.md#custom-checks)).
- **AI in CI:** none by choice. Adding a Claude workflow means an `ANTHROPIC_API_KEY` secret in CI, and the rules in [SECURITY.md](SECURITY.md#agents-in-ci) first.
