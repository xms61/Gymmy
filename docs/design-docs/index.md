---
status: draft
last-verified: 2026-10-19
---

# Design docs

Technical decisions that later work depends on: what was decided, why, and what was rejected. What the app does for the user is in [README.md](../../README.md).

| Doc | Status | Summary |
| :-- | :-- | :-- |
| [Core beliefs](core-beliefs.md) | draft | How the repo is run for agent-first work |

## Adding a design doc
Write one only when the decision is all three of these:
1. **Hard to reverse:** changing your mind later costs real work (a storage choice, an API shape, a layering rule).
2. **Surprising without context:** a future reader would ask why it was done this way, and might "fix" it.
3. **A real trade-off:** there were genuine alternatives, and this one won for reasons.

If any is missing, an exec plan's decision log is enough. Create `docs/design-docs/<topic>.md` with the frontmatter from [KNOWLEDGE_BASE.md](../KNOWLEDGE_BASE.md#doc-metadata) and these sections: Context, Decision, Alternatives considered, Consequences. Add a row above with the same status as the doc; the doc checks fail when a doc has no row or the statuses differ.
