---
status: draft
last-verified: 2026-10-19
---

# Knowledge base

How the docs in this repo are laid out, checked and kept true. The principles behind it are in [core beliefs](design-docs/core-beliefs.md).

## Layout
| Path | Holds | Written by |
| :-- | :-- | :-- |
| [AGENTS.md](../AGENTS.md) | The map: which doc to read for which task, the commands, the boundaries. Under 100 lines | Hand |
| [CLAUDE.md](../CLAUDE.md) | Imports AGENTS.md, plus the few notes only Claude Code needs | Hand |
| [REVIEW.md](../REVIEW.md) | What reviewers, human or AI, report and skip | Hand |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Code map, layers and invariants | Hand |
| [README.md](../README.md) | Setup, and what the app does for the person using it | Hand |
| `docs/*.md` | One doc per cross-cutting topic: style, testing, reliability, security, quality, plans, agent tools | Hand |
| [docs/design-docs/](design-docs/index.md) | Technical decisions, catalogued in the folder's index | Hand |
| [docs/exec-plans/](PLANS.md) | Active and completed exec plans, and the tech-debt tracker | Hand, as the work happens |
| [docs/references/](references/) | llms.txt files and similar docs of third-party libraries | Copied from the source, not edited |
| Area docs | Rules for one area of code, kept next to that code, made from the [template](AREA_DOC_TEMPLATE.md) | Hand |
| [CHANGELOG.md](../CHANGELOG.md), [docs/CHANGELOG-archive.md](CHANGELOG-archive.md) | Release notes: the latest releases, and the older ones | Hand, a line per change |
| `.claude/skills/` | Procedures Claude Code loads on demand ([AGENT_TOOLS.md](AGENT_TOOLS.md)) | Hand |
| `docs/scratch/` | Local notes; git ignores it | Anyone; never committed |
| `docs/plans/` | Older local notes from before exec plans; git ignores it | Nobody; new notes go in `docs/scratch/` |

## Growing the docs
Add a doc when a topic needs rules that more than one change will rely on, not before. Every new doc gets frontmatter, a row in the AGENTS.md map or a link from a related doc, and one owner topic that no other doc restates.
- `docs/GLOSSARY.md`, once people or agents use the domain terms inconsistently (split, session, set, load). Each term gets one or two sentences on what it is and its rejected synonyms under `_Avoid_`. Use the glossary's word in code, tickets and docs.
- `docs/generated/` for reference that scripts produce, such as the database schema. Never edit it by hand.
- A nested `AGENTS.md` inside a folder whose code has its own rules: Claude Code reads it only when that folder is touched.
- An area doc next to the code it describes, copied from [AREA_DOC_TEMPLATE.md](AREA_DOC_TEMPLATE.md), once an area's rules, data and gotchas outgrow a few lines. Give it a row in the AGENTS.md map.

## Writing for agents
Most readers of these docs and skills are agents, and every line in AGENTS.md or a skill description is read in every session.
- A pointer decides when a doc gets read: a map row, a link or a skill description names what the doc holds and the situations that should send an agent to it, with the deciding word first.
- Delete sentences that change nothing an agent would do anyway.
- Say what to do. Keep "never" for hard boundaries, and give each one an enforcer ([SECURITY.md](SECURITY.md#boundaries-and-what-enforces-them)).
- Don't copy what a file or command already shows, such as scripts, config or `--help` output; the copy goes stale. Write down what an agent can't find by looking: the reason behind a choice, an unwritten convention, a trap. The AGENTS.md commands table is the exception, because every session needs it.
- End each step of a procedure on a result the agent can check, so it can tell done from not done.

## Doc metadata
Every hand-written doc starts with this frontmatter. Exceptions: AGENTS.md, CLAUDE.md, README.md, REVIEW.md, the changelogs, `.github/` and `.claude/` files, and exec plans.

```md
---
status: draft
last-verified: YYYY-MM-DD
---
```

- `stub`: a skeleton with placeholders. Don't rely on it; fill it in once the code it describes exists.
- `draft`: written, but not checked against the code, or the code doesn't exist yet.
- `verified`: checked against the code on `last-verified`. For docs of principles, the owner confirmed it.

Set `last-verified` to today's UTC date (`date -u +%F`) whenever you check a doc against the code, including when a change makes you edit it.

## What the doc checks enforce
`npm run check:docs` runs in `verify`, the pre-commit hook and CI, and fails on:
- a relative link to a file or folder that doesn't exist, in any Markdown file, skills and agent config included;
- a doc that can't be reached by following links from AGENTS.md (exec plans, generated and reference files are exempt);
- missing or invalid frontmatter, or a `last-verified` date more than a day ahead of UTC;
- a doc in `docs/design-docs/` without a row in that folder's `index.md`, or a row whose status differs from the doc's;
- an exec plan without its required sections ([PLANS.md](PLANS.md));
- an AGENTS.md longer than 100 lines;
- an `npm run` command, in any Markdown file, that names no script in `package.json`.

It warns, without failing, about `verified` docs last verified more than 90 days ago. Those are the gardening pass's first work.

## Doc gardening
A pass that keeps the docs true to the code, run before each release, after a large change, or when asked. The procedure is the [doc-gardening skill](../.claude/skills/doc-gardening/SKILL.md); the release process lists it as a step.
