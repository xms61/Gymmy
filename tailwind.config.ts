import type { Config } from 'tailwindcss';
import { COLOR_TOKENS } from './src/theme/tokens.ts';

// Every color, radius, font and size a component uses comes from the design tokens (src/theme/tokens.ts).
const tokenColors = Object.fromEntries(COLOR_TOKENS.map(token => [token, `rgb(var(--c-${token}) / <alpha-value>)`]));

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: tokenColors,
      fontFamily: {
        sans: 'var(--font-body)',
        mono: 'var(--font-data)',
        display: 'var(--font-display)'
      },
      borderRadius: {
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        control: 'var(--radius-control)',
        chip: 'var(--radius-chip)',
        pill: 'var(--radius-pill)'
      },
      spacing: { tap: 'var(--tap)', 'tap-lg': 'var(--tap-lg)' },
      transitionDuration: { DEFAULT: 'var(--flip)' }
    }
  }
} satisfies Config;
