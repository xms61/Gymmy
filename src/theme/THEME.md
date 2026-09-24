# Themes

Entry: `src/theme/themes.ts`: every theme's design tokens (colors, fonts, corner radii, border, tap size, motion). The single source of truth for how the app looks.
- `themeCss.ts`: turns the themes into `[data-theme="<id>"] { --c-…; --font-…; }` rules. `vite.config.ts` puts them in `<head>` of `index.html`, so the first paint has the right colors.
- `tailwind.config.ts`: maps the tokens to Tailwind classes (`bg-surface`, `text-ink-muted`, `rounded-card`, `font-display`, `h-tap`) and adds one variant per theme (`classic:`).
- `src/index.css`: the base rules (body, headings, scrollbars) and the shared component classes: `card`, `panel`, `section-label`, `btn` with `btn-primary | btn-good | btn-secondary | btn-danger`, `icon-btn`, `field`.
- `src/components/ui/`: `Dialog` and `DialogHeader` (every modal), `SplitBadge`, `StatusBadge` and `SPLIT_STYLE` (the split and overload status colors).

## Rules
- Components use token classes only. No palette colors (`slate-800`, `indigo-400`), no hex values, no `rounded-xl`: use `rounded-card | panel | control | chip | pill`.
- Text comes in four levels: `ink` (headings, values), `ink-soft` (body), `ink-muted` (secondary), `ink-faint` (placeholders). Colored text uses the `*-ink` tokens (`accent-ink`, `good-ink`, `warn-ink`, `bad-ink`, `info-ink`); fills use `accent`, `good`, `control` with their `on-*` text token.
- `line` is for decorative dividers and card borders. Inputs, steppers and buttons that need a visible edge use `edge`.
- A new color token goes in `COLOR_TOKENS` and in every theme. Only add one when a component uses it.
- Every theme must pass the contrast table in `tests/theme.test.ts`: 4.5:1 for text on its background (including the labels on split colors and plates), 3:1 for placeholders and for the `edge` of inputs and buttons.
- Class names built from data are written out in full in a table (`SPLIT_STYLE`, `PLATE_STYLE`), because Tailwind only generates classes it finds as text.

## Gotchas
- `--border-style` is applied to every element in `index.css`, so a theme can make all borders dashed. `border-transparent` still hides a border.
- A theme with `motionMs: 0` gets a rule that turns off every animation and transition. `prefers-reduced-motion` does the same for every theme.
- Tailwind reads `tailwind.config.ts` when the dev server starts. After changing the tokens or the config, restart `npm run dev` if the page shows a CSS error.

## Tests
`tests/theme.test.ts`: the color conversion, the generated stylesheet, and the contrast of every theme.
