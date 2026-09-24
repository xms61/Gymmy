# Themes

Entry: `src/theme/themes.ts`: every theme's name, description, design tokens (colors, fonts, corner radii, border, tap sizes, motion) and traits. The single source of truth for how the app looks. Themes: `classic` (the default), `brutalism` (Industrial Brutalism), `terminal` (Terminal CLI), `telemetry` (Mechanical Telemetry) and `journal` (Golden Era Journal, the only light theme).
- `themeCss.ts`: turns the themes into `[data-theme="<id>"] { --c-…; --font-…; }` rules, and writes the boot script. `vite.config.ts` puts both in `<head>` of `index.html`, so the first paint has the chosen theme's colors.
- `themePreference.ts`: reads and saves the choice on this device (`gymmy_theme_v1`, see `src/services/STORAGE.md`), and applies a theme: `data-theme` on `<html>` and the `theme-color` meta tag.
- `ThemeProvider.tsx`: holds the current theme. Components read it with `useTheme()`. A choice made in another tab applies here too.
- `fonts.ts`: imports the bundled `@fontsource` fonts. The browser downloads a font only when text uses it. Each theme has four font roles: `display` (headings), `body`, `data` (numbers) and `note` (handwritten notes, `font-note`).
- `tailwind.config.ts`: maps the tokens to Tailwind classes (`bg-surface`, `text-ink-muted`, `rounded-card`, `font-display`, `h-tap`, `min-h-tap-lg`) and adds one variant per theme (`brutalism:bg-push`).
- `src/index.css`: the base rules (body, headings, scrollbars), the shared component classes (`card`, `panel`, `section-label`, `btn` with `btn-primary | btn-good | btn-secondary | btn-danger`, `icon-btn`, `field`), and one block per theme at the end.
- `src/components/settings/AppearanceSection.tsx`: the Appearance tab in Settings, a radio group with a live sample of each theme.
- `src/components/ui/Gauge.tsx` (arc math in `gaugeGeometry.ts`) and `Sparkline.tsx`: instrument dials and a tiny trend line. Telemetry shows them for the RIR pick, the rest timer and the exercise readouts.
- `src/components/ui/InkStamp.tsx`: a rubber-stamp mark in the `stamp` color (`.ink-stamp` in `index.css`). Journal uses it for done sets and for the finished workout.
- `src/components/ui/`: `Dialog` and `DialogHeader` (every modal; `Dialog` takes focus when it opens, keeps Tab inside, closes on Escape and gives focus back when it closes), `SplitBadge`, `StatusBadge` and `SPLIT_STYLE` (the split and overload status colors).

## How a theme changes the app
1. **Tokens** in `themes.ts`: colors, fonts, shape, tap sizes, motion. Most of a theme is here.
2. **Its block in `src/index.css`**, for what tokens can't express: layout and signature elements. The rules select hook classes that components carry and that have no style of their own, for example `set-row`, `set-list`, `set-number`, `stepper`, `exercise-card`, `exercise-cue`, `exercise-notes`, `rest-bar`, `rest-digits`, `rest-ring`, `split-solid`, `session-chip`, `calendar-day`, `hazard-edge` and `hazard-frame`. Some hook classes mark elements that are `hidden` unless a theme turns them on: `exercise-prescription` (Brutalism), `exercise-readouts`, `set-plates`, `rir-gauge` and `rest-gauge` (Telemetry), and `status-glyph`, `progress-text`, `plates-text`, `summary-text`, `nav-key` and `nav-status` (Terminal, which hides `status-text`, `progress-bar`, `plates-drawing` and `nav-icon` in exchange). The text drawings come from `src/components/terminalText.ts`. A block can also redefine token variables inside an element, so everything in it follows: `.rest-bar` in Brutalism sets `--c-surface` to the accent and the text tokens to `on-accent`.
3. **Traits** in `themes.ts`, for behavior a stylesheet can't express. Each one is read by a component:
   - `celebration`: confetti on Finish (`LiveTracker.tsx`), a "Logged · 24 Sep" stamp on the summary (`CompletionSummary.tsx`), or nothing.
   - `doneMark`: a done set shows a check or a "Done" stamp (`SetRow.tsx`).
   - `dates`: session dates in lists as `2026-09-24` or "Thursday, 24 September" (`formatSessionDate` in `src/utils/date.ts`).
   - `commandLine`: the tracker's command line and the single-key shortcuts (`src/components/tracker/TRACKER.md`), plus 1, 2, 3 and s in `App.tsx`.
   - `dialogs`: `pane` renders every `Dialog` as a full-screen page with a `-- TITLE --` header and `[esc] close`, instead of a card over a dimmed page.
   - `doneMark: 'glyph'` shows `[x]` and `[ ]`.
4. **Theme variants** (`brutalism:bg-push`) for one-off class differences, such as `SPLIT_STYLE[split].solid`.

## Rules
- Components use token classes only. No palette colors (`slate-800`, `indigo-400`), no hex values, no `rounded-xl`: use `rounded-card | panel | control | chip | pill`.
- Text comes in four levels: `ink` (headings, values), `ink-soft` (body), `ink-muted` (secondary), `ink-faint` (placeholders). Colored text uses the `*-ink` tokens (`accent-ink`, `good-ink`, `warn-ink`, `bad-ink`, `info-ink`); fills use `accent`, `good`, `control` with their `on-*` text token.
- `line` is for decorative dividers and card borders. Inputs, steppers and buttons that need a visible edge use `edge`.
- A new color token goes in `COLOR_TOKENS` and in every theme. Only add one when a component uses it.
- Every theme must pass the contrast table in `tests/theme.test.ts`: 4.5:1 for text on its background (including the labels on split colors and plates), 3:1 for placeholders and for the `edge` of inputs and buttons.
- Class names built from data are written out in full in a table (`SPLIT_STYLE`, `PLATE_STYLE`), because Tailwind only generates classes it finds as text.
- A theme block must leave the other themes as they were. Only select `[data-theme="<id>"] …`, and add a hook class instead of restyling a shared class for everyone.
- The samples in the Appearance tab set `data-theme` on themselves and use token classes only. A block's rules match any descendant of its theme, including a sample of another theme, so samples never carry hook classes.
- A new theme needs: its id in `THEME_IDS`, a `Theme` with every field, its fonts in `fonts.ts` and `package.json`, its block in `index.css` if it needs one, and a pass of the contrast test.

## Gotchas
- `--border-style` is applied to every element in `index.css`, so a theme can make all borders dashed. `border-transparent` still hides a border.
- The theme blocks sit after the Tailwind layers, outside them, so they win over the utilities they replace, and Tailwind never drops them as unused.
- Brutalism turns off soft shadows and blur by resetting `--tw-shadow` and `--tw-backdrop-blur` on every element. Focus rings use their own variable and stay.
- Calendar days carry `--heat`, their volume as a share of the month's heaviest day (0 to 1). Telemetry shades them with it; the other themes ignore it.
- Journal is light, so it turns off the colored glows (`shadow-good/30`) the same way and gives cards a hairline `rule` line underneath instead. Test new components in Journal too: a color that only works on dark backgrounds shows there first.
- `.ink-stamp` uses `mix-blend-mode: multiply`, like ink on paper. On a dark theme that would hide it, so a dark theme that wants stamps needs its own rule.
- Anton has a single weight, so Brutalism sets `font-synthesis: none`: a synthesized bold of `font-black` headings smears it.
- The dev server serves the font files from `node_modules`. A copy of the app whose `node_modules` is a symlink to a folder outside the project gets 403 for the fonts; build it and use `vite preview` instead.
- A theme with `motionMs: 0` gets a rule that turns off every animation and transition. `prefers-reduced-motion` does the same for every theme, and also turns off the confetti at the end of a workout.
- Tailwind reads `tailwind.config.ts` when the dev server starts. After changing the tokens or the config, restart `npm run dev` if the page shows a CSS error.

## Tests
`tests/theme.test.ts`: the color conversion, the generated stylesheet, theme ids, the boot script (run against a fake page), and the contrast of every theme.
