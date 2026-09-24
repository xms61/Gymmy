# <Project name>

<What it does, in one or two sentences.>

## Setup
```bash
<npm ci>
cp .env.example .env
<npm run dev>
```

## Commands
See the Commands table in [AGENTS.md](AGENTS.md).

---

## Using this template (delete this section once done)

Files, and what each one is for:

| File | Purpose |
| :-- | :-- |
| `AGENTS.md` | Entry point for coding agents: a doc map (which doc to read for which task), the commands and the "Always" rules. Keep it short, because agents load it on every task. |
| `CLAUDE.md` | Imports `AGENTS.md`, so Claude Code reads the same file as other agents. |
| `docs/CODE_STYLE.md` | What good code looks like here, and what not to add. |
| `docs/TESTING.md` | Test commands, isolation rules and how to write tests. |
| `docs/AREA_DOC_TEMPLATE.md` | Copy it next to each area of code (database, API, UI…). Each copy gets a row in the doc map. |
| `.github/RELEASE_PROCESS.md` | Branching, version bump, checklist and PR format. Agents read it before any commit. |
| `.github/pull_request_template.md` | A PR body that states what was and wasn't checked. |
| `.github/workflows/ci.yml` | CI that runs the same commands as `AGENTS.md`. Adapt it to your stack. |
| `CHANGELOG.md`, `docs/CHANGELOG-archive.md` | Keep a Changelog. About 5 releases in the main file, older ones in the archive, so agents read less. |
| `.gitignore` | Keeps secrets, data and `docs/plans/` (local plans) out of git. |
| `.gitattributes`, `.editorconfig` | LF line endings and consistent whitespace across OSes and agents. |
| `.env.example` | Every env var the app reads. |

Checklist:
1. Replace every `<placeholder>` (search for `<`).
2. Fill in the Commands table in `AGENTS.md` and make CI run the same commands.
3. Write the "Always" rules that are specific to this repo: where real data lives, names that must never change, and how tests are isolated.
4. Add one area doc per area once the code exists, and a row for each in the doc map.
5. Delete this section.
