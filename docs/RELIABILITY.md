---
status: draft
last-verified: 2026-10-01
---

# Reliability

How the app behaves when something fails or slows down. The general rules are in [CODE_STYLE.md](CODE_STYLE.md#errors-and-boundaries); the mechanics of the outbox are in [STORAGE.md](../src/services/STORAGE.md) and of the API in [SERVER.md](../server/SERVER.md). This doc lists what the user sees.

## Failure modes
| Failure | What the user sees | Recovery |
| :-- | :-- | :-- |
| The server is unreachable (static build, server stopped, phone off the Wi-Fi) | The badge reads "Offline, N pending"; logging works as usual | Changes wait in the outbox and are sent when the browser goes back online, the tab comes to the front, or every 30 s |
| Another device has no access key | The badge reads "Needs access key" | Open the `#key=…` link the server prints ([SERVER.md](../server/SERVER.md)) |
| The server refuses a change (400, 413, 415) | The badge adds "N not saved"; Settings offers the refused changes as a JSON download | The change is kept in `gymmy_rejected_ops_v1` until downloaded or dismissed |
| localStorage is full or blocked | The badge adds "browser storage full" | Free browser storage. Until then, changes the server hasn't stored yet can be lost on reload |
| The workout draft can't be read | No resume banner; the draft is ignored | Logged as a warning; the finished sessions are unaffected |
| The timer chime can't play | Rest ends silently, with vibration where available | Logged as a warning |
| A database error | The request fails with a bare 500 | The details go to the server log once; the change stays in the outbox |
| A schema migration or `POST /api/clear` | Nothing | A copy of the database is written to `data/` first |

## Timeouts and limits
- Every API request gives up after 8 s (`REQUEST_TIMEOUT_MS` in `src/services/storage.ts`), so one unreachable address can't hold up the outbox.
- Retries run every 30 s while the app is open (`RETRY_INTERVAL_MS`), and on `online` and `visibilitychange`.
- Request bodies are capped at 1 MB (`MAX_BODY_BYTES` in `server/vitePlugin.ts`); the payload limits are `LIMITS` in `src/validation.ts`.

## Logging
- Server and client log plain lines to the console with a `[Gymmy DB]`, `[StorageService]`, `[WorkoutDraft]`, `[Theme]` or `[Audio]` prefix. There is no log file and no telemetry.
- Each failure is logged once, with the route or storage key it concerns. A 500 sends the client only `Internal database error`, because the details can hold SQL and file paths.
