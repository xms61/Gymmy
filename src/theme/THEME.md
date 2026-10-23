---
status: draft
last-verified: 2026-10-23
---

# Design tokens

Gymmy has one design, the Departure Board: a matte black station board, off-white characters on split-flap cells, a yellow signage band, and the Push, Pull and Legs colours kept to small round route markers. The system as built is recorded in [DESIGN.md](../../DESIGN.md); how it came about is in the [exec plan](../../docs/exec-plans/completed/2026-10-01-departure-board.md).

Entry: `src/theme/tokens.ts`: every color, font, corner radius, tap size and the flip duration. The single source of truth for how the app looks.
- `tokensCss.ts`: turns the tokens into one `:root { --c-…; --font-…; }` rule. `vite.config.ts` puts it in `<head>` of `index.html`, so the first paint has the right colors.
- `fonts.ts`: imports the bundled Barlow and Barlow Condensed (`@fontsource`), so they work offline. Three font roles: `display` (headings, labels and buttons, in caps), `body`, and `data` (numbers, `font-mono`, with tabular figures).
- `src/index.css`: Tailwind 4, configured in CSS. Its `@theme inline reference` block maps the tokens to Tailwind classes (`bg-surface`, `text-ink-muted`, `rounded-card`, `font-display`, `h-tap`, `min-h-tap-lg`): `inline` makes each class read the token variable directly, and `reference` keeps Tailwind from declaring the variables a second time. Then come the base rules (body, headings, focus ring, selection, scrollbars), the shared component classes (`card`, `panel`, `section-label`, `btn` with `btn-primary | btn-good | btn-secondary | btn-danger`, `icon-btn`, `field`) and the flap cell (`flap`, and `flaps-idle` on a row that steps its digits down to `ink-muted`).
- `src/components/ui/Flaps.tsx`: text on split-flap cells. Each cell is two leaves meeting at a hairline split; when its character changes, the old upper leaf falls and the new lower leaf lands, each in two stepped frames. The other cells hold still. Screen readers hear the text once, not cell by cell.
- `src/components/ui/ConfirmHost.tsx`: `askToConfirm` and `showNotice`, the in-app replacements for the browser's confirm and alert boxes, which embedded browsers can answer "no" to without showing. Never call `window.confirm` or `alert`.
- `src/components/ui/`: `Dialog` and `DialogHeader` (every modal; `Dialog` takes focus when it opens, keeps Tab inside, closes on Escape and gives focus back when it closes), `RouteMarker` (a split as a round marker, in three sizes) and `StatusBadge` (the progression status in its ink).
- Every dialog is named by its title: `Dialog` labels itself with an id that its title element takes from `useDialogTitleId()`. `DialogHeader` does it for its title; a dialog without one gives the id to its own heading or message (the finish summary, the confirm host).

## Rules
- Components use token classes only. No palette colors (`slate-800`, `indigo-400`), no hex values, no `rounded-xl`: use `rounded-card | panel | control | chip | pill`.
- Text comes in four levels: `ink` (flap characters, headings, values), `ink-soft` (body), `ink-muted` (secondary), `ink-faint` (placeholders, and small text on `bg` or `inset` only, such as set numbers and days of other months; on `surface` it falls below 4.5:1). Rows that are not next are full `ink` at 50% opacity, the one opacity on text, declared in `tests/theme.test.ts`. Colored text uses the `*-ink` tokens (`accent-ink`, `good-ink`, `warn-ink`, `bad-ink`, `info-ink`); fills use `accent`, `good`, `control` with their `on-*` text token.
- Flaps carry two inks only: `ink` on `surface`. Color belongs to the yellow band (`accent`) and the route markers (`push`, `pull`, `legs`, `other`).
- `good` is an off-white flap, the fill of the primary action on the board (Log set). `accent` is the signage yellow: the header bands, the focus ring, the caret and text selection. Secondary actions (Skip, Plates, Cancel) are bordered two-ink buttons.
- No shadows, gradients, glows or blur. Motion is a stepped flip (`--flip`, `steps()`), never an eased fade or a scale on press.
- `line` is for decorative dividers and card borders. Inputs, steppers and buttons that need a visible edge use `edge`.
- A new color token goes in `COLOR_TOKENS`, in `DESIGN.colors` and as `--color-<token>: rgb(var(--c-<token>));` in the `@theme` block of `src/index.css`. Only add one when a component uses it.
- The tokens must pass the contrast table in `tests/theme.test.ts`: 4.5:1 for text on its background (including the labels on split colors and plates), 3:1 for placeholders and for the `edge` of inputs and buttons.
- Class names built from data are written out in full in a table (`SPLIT_FILL`, `MARKER_SIZE`, `PLATE_STYLE`), because Tailwind only generates classes it finds as text. It looks in `index.html` and `src/**/*.{js,ts,jsx,tsx}` only (`source(none)` and the `@source` lines in `src/index.css`), so a class named in a doc does not end up in the stylesheet.

## Gotchas
- Body text is 17px (`--text-base` is redefined in the `@theme` block). At 16px both Barlow faces smear the full stop into a comma on 1x screens, so 62.5 reads as 62,5; 14, 15, 17 and 18px render it cleanly.
- `prefers-reduced-motion` turns off every animation and transition, including the flap turn.
- The dev server serves the font files from `node_modules`. A copy of the app whose `node_modules` is a symlink to a folder outside the project gets 403 for the fonts; build it and use `vite preview` instead.
- Tailwind runs as a Vite plugin (`@tailwindcss/vite`), with no PostCSS step and no autoprefixer: Tailwind 4 adds the vendor prefixes itself.
- Tailwind 4's `transition-colors` also covers `outline-color`. The base rules give every element the accent as its outline color, so the focus ring appears at once instead of fading in. Buttons get `cursor: pointer` in the base rules too, because Tailwind 4 dropped it from its reset.
- Inside a `bg-accent` area (the band, the home sign) the focus ring is `on-accent`, set by a base rule in `src/index.css`, and `tests/theme.test.ts` checks that rule and the ring's 3:1 contrast on each surface. Don't remove the global ring with `outline-hidden` on a control that takes keyboard focus.
- Tailwind 4 renamed some classes: `outline-none` is now `outline-hidden`, and the old `rounded-sm` (2px) is `rounded-xs`. `outline-hidden` also sets the variable that `outline` and `outline-2` read, so an element that hides its outline on `focus:` brings the ring back with `focus-visible:outline-solid`, not `focus-visible:outline` (see `TrendChart`).

## Tests
`tests/theme.test.ts`: the color conversion, the generated stylesheet, the `@theme` colors in `src/index.css` against `COLOR_TOKENS`, and the contrast table.
