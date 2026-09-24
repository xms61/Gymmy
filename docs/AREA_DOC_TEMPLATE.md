# <Area name>

<!--
Copy this file next to the code it describes (e.g. server/db/DATABASE.md), fill it in,
add a row for it to the doc map in AGENTS.md, and delete this comment.
An agent reads it before every change in the area, so include only what such a change needs: entry points, rules, data shapes and gotchas.
Write facts and rules, not history. Update it in the same PR as the code.
-->

Entry: `<path/to/entry.ts>`: <what it owns, in one sentence>.
- `<file or folder>`: <responsibility>
- `<file or folder>`: <responsibility>

## Rules
- <An invariant that must hold, e.g. "every write goes through upsertX, never raw INSERT">
- <Where new things go, e.g. "a new payload gets a validator in validators.ts">
- <Limits and thresholds, with the constant that holds them>

## Data / API
| <Table, route or message> | <Key fields> | Notes |
|---|---|---|
| | | |

## Gotchas
- <Something that looks wrong but is intentional, and why>
- <Something that broke before, and how to avoid it>

## Tests
`<tests that cover this area>`: <what they prove>.
