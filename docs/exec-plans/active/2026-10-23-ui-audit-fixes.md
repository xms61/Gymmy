# Fix the findings of the 2026-10-23 UI audit

## Purpose
Gymmy's frontend scored 14/20 in an Impeccable audit on 2026-10-23: 2 P1, 5 P2 and 6 P3 findings, most of them about keyboard use, focus visibility and contrast. When this is done, the keyboard works on the workout screen without logging sets by accident, focus can be seen on every surface, all text meets 4.5:1, the screens follow DESIGN.md, and a repeat audit scores at least 17/20.

## Context
- The audit report, kept in the audit session's worktree (scratch, not committed). The findings are restated in the Plan below with their files, so this plan stands on its own.
- [DESIGN.md](../../../DESIGN.md) (the Departure Board, the Signage Rule, Layout), [src/theme/THEME.md](../../../src/theme/THEME.md) (token rules), [PRODUCT.md](../../../PRODUCT.md) (principles 3 and 4, Accessibility & Inclusion), [src/components/tracker/TRACKER.md](../../../src/components/tracker/TRACKER.md) (shortcuts, the board).
- [docs/TESTING.md](../../TESTING.md): tests import pure modules only, so DOM-dependent logic is moved into pure functions before it is tested. UI changes are proved in the running app from a worktree whose `data/` starts empty, never against `data/gymmy.db`.
- Builds on the Tailwind 4 migration (#59, merged 2026-10-23). `tailwind.config.ts` is gone: the theme mapping is the `@theme inline reference` block in `src/index.css`, `outline-none` is now `outline-hidden`, and the 2px `rounded-sm` is now `rounded-xs`.
- Rejected in the audit and out of scope: phone layouts (desktop only by spec), touch and screen-reader testing beyond accessible names (not available on this machine).

## Plan
Each milestone is one branch and one squash-merged PR, in this order, because several touch the same files (`LiveTracker.tsx`, `ExerciseBoard.tsx`, `index.css`).

1. **Tracker keyboard and the last-set delete (P1 item 1, P2 item 7).**
   - Space and Enter go to a focused button, link, `summary` or control role (radio, checkbox, switch, tab, menu item, option) instead of the tracker's shortcuts; letter shortcuts still work there. The decision is a pure function in its own DOM-free module (`src/components/shortcutTarget.ts`), tested in `tests/`, and `isShortcutFree` in `src/components/keyboardShortcuts.ts` calls it.
   - The trash button on a logged last set asks first, through `askToConfirm` (`removeLastSet` in `LiveTracker.tsx`). An open set is still removed at once.
   - Proof: in the browser, Space on a focused Plates button opens the plate dialog and logs nothing; deleting a done set asks.
2. **Focus that can be seen everywhere (P1 item 2, P2 item 3).**
   - Inside `bg-accent` areas (the band, the home sign), the focus ring is drawn in `on-accent` instead of `accent`. That's the nav tabs, sync status and gear in `App.tsx`, Leave and Finish in `LiveTracker.tsx`, and Start, Discard and Resume in `HomeDashboard.tsx`.
   - The command row (`CommandLine.tsx`) shows focus and drops `aria-label="Command"`, so its name is the visible label "Type a set".
   - DESIGN.md's Signage Rule says which ring colour goes on which surface.
   - Proof: the computed outline colour on yellow is `on-accent`, and screenshots show it.
3. **Text contrast without opacity (P2 item 4).**
   - Replace opacity used as a text level with ink steps. That's "No sessions" and exercise names on Progress (`ProgressView.tsx`), days outside the month (`WorkoutCalendar.tsx`), and set numbers on the selected tile (`ExerciseBoard.tsx`).
   - Extend `tests/theme.test.ts` with the composite cases (foreground at its opacity over its real background), so the contrast table covers what the screens draw.
4. **One content column (P2 item 5).**
   - The four screens use the band's 90rem column instead of `max-w-6xl` (`App.tsx`), as DESIGN.md Layout says.
   - Proof: screenshots of every screen at 1024 and 1440 wide, with no overflow, and band and content starting at the same x.
5. **Accessible names and keys (P2 item 6, P3 items 11 to 13).**
   - Dialogs get `aria-labelledby` pointing to their title (`Dialog.tsx`, `CompletionSummary.tsx`).
   - Set tiles read as "Set 1, 77.5 kg × 5 reps, done".
   - The RIR picker moves with the arrow keys and is one tab stop (`SetControls.tsx`).
   - The sync "needs attention" state is announced (`App.tsx`).
6. **Tokens and dead code (P3 items 8 to 10).**
   - The flap type sizes (`flap-row`, `flap`, `sign`, `flap-xl`) and the letter spacings DESIGN.md names become theme tokens in the `@theme` block of `src/index.css`, replacing the arbitrary values. The 0.03em and 0.04em spacings, which the spec doesn't name, fold into the nearest named step (0.02em), checked by screenshots before and after.
   - `rounded-xs` (was `rounded-sm`) becomes `rounded-chip` (`PlateCalculatorModal.tsx`).
   - Fix the outdated comments in `tokens.ts`. Delete the unused `.btn-primary` and its mention in THEME.md.
   - Remove "the finish confetti" from PRODUCT.md, since the confetti is gone.
7. **Settings table after a sync (outside the audit, unverified).**
   - `SettingsView.tsx` copies the exercises into state once and compares edits by index, so a sync that lands while Settings is open may leave the table stale.
   - Reproduce it first with the diagnosing-bugs skill. If it's real, fix it with a regression test. If it isn't, record why here.
8. **Re-audit and close out.**
   - Run the Impeccable audit again and fix anything new at P1 or P2.
   - Update DESIGN.md, THEME.md, TRACKER.md and the CHANGELOG where behaviour changed, and refresh the `.impeccable/design.json` sidecar from DESIGN.md (`/impeccable document`), since milestone 2 changed the Signage Rule. Then move this plan to `completed/`.

## Progress
- [x] 2026-10-23 Tailwind 4 migration merged (#59, prerequisite)
- [x] 2026-10-23 1. Tracker keyboard and the last-set delete
- [x] 2026-10-23 2. Focus that can be seen everywhere
- [ ] 3. Text contrast without opacity
- [ ] 4. One content column
- [ ] 5. Accessible names and keys
- [ ] 6. Tokens and dead code
- [ ] 7. Settings table after a sync
- [ ] 8. Re-audit and close out

## Decision log
- 2026-10-23: one PR per milestone, in order, in one session, because milestones 1, 2, 3 and 5 share files, so parallel tickets would conflict. Rejected: GitHub tickets for parallel sessions.
- 2026-10-23: start after the Tailwind 4 migration merges, because it rewrites the CSS and config these fixes touch. Rejected: fixing on Tailwind 3 and merging twice.
- 2026-10-23: the user took the five recommended answers ("continue"):
  - The screens move to the band's 90rem column, as DESIGN.md says. Rejected: keeping 72rem and changing the doc.
  - Inside yellow areas the focus ring is `on-accent`, written into the Signage Rule. Rejected: one yellow ring everywhere.
  - Deleting a logged last set asks first through `askToConfirm`; open sets still go at once (principles 3 and 4). Rejected: an undo (more code), or the trash only on open sets.
  - The 0.03em and 0.04em spacings fold into 0.02em. Rejected: new spacing tokens.
  - The Settings table after a sync stays in as milestone 7, reproduced before any fix. Rejected: only a tech-debt row.
- 2026-10-23: Space and Enter are left to a focused button, link, `summary` or control role, but letter shortcuts still work there. After a click, focus stays on the button, and blocking every shortcut there would break `1`/`2`/`3`, `s`, `j` and `k`. Rejected: treating a focused button like a text field.
- 2026-10-23: accepted side effect, found in review: after a mouse click on a set tile, "+ Set" or an RIR choice, focus stays there, so Space presses that button again (re-selects the tile, adds a set, clears the RIR) instead of ticking the set under the cursor. Space has to operate the focused control (WCAG 2.1.1). Space returns to the cursor once focus leaves the button, for example with a click on the board. Revisit if mouse-then-Space turns out to be a common way to log.

## Surprises
- The audit ran on a worktree at `a244de3`, so its line numbers are older than `main`. Each finding was checked again on `main` at `0c86cd8` before planning, and all still hold.

## Validation
- `npm run verify` passes after each milestone, and CI passes on each PR.
- New tests: the shortcut target predicate (milestone 1) and the composite contrast cases (milestone 3), each seen failing before the fix.
- Browser proof per milestone, from a worktree with an empty `data/`: screenshots or computed styles as listed in the Plan.
- A repeat Impeccable audit scores at least 17/20 with no P1 or P2 findings.

## Outcome
Filled in when the plan moves to completed/.
