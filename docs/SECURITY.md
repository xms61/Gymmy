---
status: draft
last-verified: 2026-10-01
---

# Security

Gymmy holds one person's training history on their own computer. This doc says what protects it: the API's request checks, input validation, and what never reaches the public repo.

## The API
The API has no login. The checks that replace one (allowed `Host`, the access key for other devices, `Origin`, JSON-only POSTs, no framing, `data/` denied to Vite's file serving) are described once, in the Rules of [SERVER.md](../server/SERVER.md). Keep them when changing `server/api.ts` or `vite.config.ts`.
- Without `--host` the servers listen only on this computer. With it, every other device needs the access key from `data/access-key`, which the server creates on first start and prints as `#key=…` links. Deleting the file and restarting issues a new key and locks out every device that had the old one.
- The browser keeps the key in localStorage (`gymmy_access_key_v1`) and removes it from the address bar.

## Input
- Every external input is validated once, at the boundary ([CODE_STYLE.md](CODE_STYLE.md#errors-and-boundaries)): request bodies and backup files by the parsers in `src/validation.ts`, against `LIMITS`. The browser and the server use the same parsers.
- React escapes all text, and the app never uses `dangerouslySetInnerHTML`.

## Secrets and the public repo
- Gymmy reads no environment variables and needs no secret beyond the access key, which lives in `data/` and is never committed.
- What must never be committed (training data, the database, the spreadsheet, keys, `.env` files, details of this machine) and the checks that enforce it are in the [release guardrails](../.github/RELEASE_PROCESS.md).

## Dependencies
- Add a dependency only when the standard library or an existing dependency can't do the job ([CODE_STYLE.md](CODE_STYLE.md)). The server uses only Node built-ins (`node:sqlite`).
- Dependabot opens weekly PRs for npm and GitHub Actions. Actions are pinned by commit SHA, and gitleaks in CI by version and checksum.

## User data
- Everything stays on the user's machine: `data/gymmy.db`, and a copy in each browser's localStorage. No analytics, no third-party requests; the fonts are bundled.
- A backup file is a full copy of the history. It is created only when the user asks, and saved where they choose.
