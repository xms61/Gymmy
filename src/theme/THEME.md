---
status: draft
last-verified: 2026-10-01
---

# Design tokens

Gymmy has one design, the Departure Board: a matte black station board, off-white characters on split-flap cells, a yellow signage band, and the Push, Pull and Legs colours kept to small round route markers. The system as built is recorded in [DESIGN.md](../../DESIGN.md); the screens still to be redone are in the [exec plan](../../docs/exec-plans/active/2026-10-01-departure-board.md).

Entry: `src/theme/tokens.ts`: every color, font, corner radius, tap size and the flip duration. The single source of truth for how the app looks.
- `tokensCss.ts`: turns the tokens into one `:root { --c-…; --font-…; }` rule. `vite.config.ts` puts it in `<head>` of `index.html`, so the first paint has the right colors.
- `fonts.ts`: imports the bundled Barlow and Barlow Condensed (`@fontsource`), so they work offline. Three font roles: `display` (headings, labels and buttons, in caps), `body`, and `data` (numbers, `font-mono`, with tabular figures).
- `tailwind.config.ts`: maps the tokens to Tailwind classes (`bg-surface`, `text-ink-muted`, `rounded-card`, `font-display`, `h-tap`, `min-h-tap-lg`).
- `src/index.css`: the base rules (body, headings, focus ring, selection, scrollbars), the shared component classes (`card`, `panel`, `section-label`, `btn` with `btn-primary | btn-good | btn-secondary | btn-danger`, `icon-btn`, `field`) and the flap cell (`flap`).
- `src/components/ui/Flaps.tsx`: text on split-flap cells. Each cell is two leaves meeting at a hairline split; when its character changes, the old upper leaf falls and the new lower leaf lands, each in two stepped frames. The other cells hold still. Screen readers hear the text once, not cell by cell.
- `src/components/ui/ConfirmHost.tsx`: `askToConfirm` and `showNotice`, the in-app replacements for the browser's confirm and alert boxes, which embedded browsers can answer "no" to without showing. Never call `window.confirm` or `alert`.
- `src/components/ui/`: `Dialog` and `DialogHeader` (every modal; `Dialog` takes focus when it opens, keeps Tab inside, closes on Escape and gives focus back when it closes), `RouteMarker`, `SplitBadge`, `StatusBadge` and `SPLIT_STYLE` (the split and overload status colors).

## Rules
- Components use token classes only. No palette colors (`slate-800`, `indigo-400`), no hex values, no `rounded-xl`: use `rounded-card | panel | control | chip | pill`.
- Text comes in four levels: `ink` (flap characters, headings, values), `ink-soft` (body), `ink-muted` (secondary), `ink-faint` (placeholders, rows that are not next). Colored text uses the `*-ink` tokens (`accent-ink`, `good-ink`, `warn-ink`, `bad-ink`, `info-ink`); fills use `accent`, `good`, `control` with their `on-*` text token.
- Flaps carry two inks only: `ink` on `surface`. Color belongs to the yellow band (`accent`) and the route markers (`push`, `pull`, `legs`, `other`).
- `good` is an off-white flap, the fill of the primary action on the board (Log set). `accent` is the signage yellow: the header bands, the focus ring, the caret and text selection. Secondary actions (Skip, Plates, Cancel) are bordered two-ink buttons.
- No shadows, gradients, glows or blur. Motion is a stepped flip (`--flip`, `steps()`), never an eased fade or a scale on press.
- `line` is for decorative dividers and card borders. Inputs, steppers and buttons that need a visible edge use `edge`.
- A new color token goes in `COLOR_TOKENS` and in `DESIGN.colors`. Only add one when a component uses it.
- The tokens must pass the contrast table in `tests/theme.test.ts`: 4.5:1 for text on its background (including the labels on split colors and plates), 3:1 for placeholders and for the `edge` of inputs and buttons.
- Class names built from data are written out in full in a table (`SPLIT_STYLE`, `PLATE_STYLE`), because Tailwind only generates classes it finds as text.

## Gotchas
- `prefers-reduced-motion` turns off every animation and transition, including the flap turn.
- The dev server serves the font files from `node_modules`. A copy of the app whose `node_modules` is a symlink to a folder outside the project gets 403 for the fonts; build it and use `vite preview` instead.
- Tailwind reads `tailwind.config.ts` when the dev server starts. After changing the tokens or the config, restart `npm run dev` if the page shows a CSS error.

## Tests
`tests/theme.test.ts`: the color conversion, the generated stylesheet and the contrast table.
