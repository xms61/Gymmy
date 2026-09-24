import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { COLOR_TOKENS, THEME_IDS } from './src/theme/themes.ts';

// Every color, radius, font and size a component uses comes from the active theme's tokens (src/theme/themes.ts).
const tokenColors = Object.fromEntries(COLOR_TOKENS.map(token => [token, `rgb(var(--c-${token}) / <alpha-value>)`]));

// One variant per theme, e.g. `terminal:border-dashed`, for differences that tokens cannot express.
const themeVariants = plugin(({ addVariant }) => {
  for (const id of THEME_IDS) addVariant(id, `[data-theme="${id}"] &`);
});

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: tokenColors,
      fontFamily: {
        sans: 'var(--font-body)',
        mono: 'var(--font-data)',
        display: 'var(--font-display)',
        note: 'var(--font-note)'
      },
      borderRadius: {
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        control: 'var(--radius-control)',
        chip: 'var(--radius-chip)',
        pill: 'var(--radius-pill)'
      },
      borderWidth: { DEFAULT: 'var(--border-width)' },
      spacing: { tap: 'var(--tap)', 'tap-lg': 'var(--tap-lg)' },
      transitionDuration: { DEFAULT: 'var(--motion)' }
    }
  },
  plugins: [themeVariants]
} satisfies Config;
