// The design tokens of the Departure Board design. Components use only these (through the
// Tailwind classes in tailwind.config.ts), never palette colors.

// The localStorage key the old theme picker wrote. Nothing reads it any more; it stays named
// here and in src/services/STORAGE.md so the key is never reused for something else.
export const RETIRED_THEME_STORAGE_KEY = 'gymmy_theme_v1';

export const COLOR_TOKENS = [
  'bg', // the board
  'surface', // flap faces and cards
  'flap-low', // the lower leaf of a flap, a shade darker
  'inset', // wells inside a card, the gap between flaps
  'control', // neutral button fill
  'control-hover',
  'line', // decorative dividers and card borders
  'edge', // input, stepper and button borders
  'ink', // flap characters, headings and values
  'ink-soft', // body text
  'ink-muted', // secondary text
  'ink-faint', // placeholders, disabled text, rows that are not next
  'accent', // the yellow signage band and the primary button fill
  'accent-hover',
  'on-accent',
  'accent-ink', // yellow text and icons on the board
  'good', // Done and Finish fill: an off-white flap
  'good-hover',
  'on-good',
  'good-ink', // positive status text
  'warn-ink',
  'bad-ink',
  'info-ink',
  'push',
  'pull',
  'legs',
  'other',
  'on-split', // text on a filled split color
  'plate-25',
  'plate-20',
  'plate-15',
  'plate-10',
  'plate-5',
  'plate-2-5',
  'plate-1-25',
  'on-plate', // text on the dark plates
  'on-plate-light', // text on the 15 and 5 kg plates
  'bar'
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export interface DesignTokens {
  colors: Record<ColorToken, string>; // #rrggbb
  fonts: { display: string; body: string; data: string };
  radius: { card: string; panel: string; control: string; chip: string; pill: string };
  tapSize: string; // height of steppers and set buttons
  tapSizeLarge: string; // minimum height of Start, Finish, Done and the rest-timer buttons
  flipMs: number; // one flap flip
}

const CONDENSED = "'Barlow Condensed', 'Arial Narrow', sans-serif";

export const DESIGN: DesignTokens = {
  colors: {
    bg: '#15130F',
    surface: '#201E1A',
    'flap-low': '#1A1814',
    inset: '#0D0C0A',
    control: '#2E2B26',
    'control-hover': '#3B3832',
    line: '#2E2B26',
    edge: '#7A766C',
    ink: '#F2EEE3',
    'ink-soft': '#D8D4C8',
    'ink-muted': '#A8A498',
    'ink-faint': '#85827A',
    accent: '#F5C400',
    'accent-hover': '#FFD43A',
    'on-accent': '#15130F',
    'accent-ink': '#F5C400',
    good: '#F2EEE3',
    'good-hover': '#FFFFFF',
    'on-good': '#15130F',
    'good-ink': '#8FCB9B',
    'warn-ink': '#FFB547',
    'bad-ink': '#FF7A6B',
    'info-ink': '#93BDF2',
    push: '#E8702A',
    pull: '#45A462',
    legs: '#4E8EEA',
    other: '#A08BE0',
    'on-split': '#15130F',
    'plate-25': '#D2372B',
    'plate-20': '#2B6CD4',
    'plate-15': '#F2C230',
    'plate-10': '#2B7F44',
    'plate-5': '#F2EEE3',
    'plate-2-5': '#3A3A36',
    'plate-1-25': '#5C5B55',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#15130F',
    bar: '#A8A498'
  },
  fonts: {
    display: CONDENSED,
    body: "'Barlow', 'Segoe UI', sans-serif",
    data: CONDENSED
  },
  radius: { card: '4px', panel: '3px', control: '3px', chip: '2px', pill: '9999px' },
  tapSize: '2.5rem',
  tapSizeLarge: '3rem',
  flipMs: 90
};
