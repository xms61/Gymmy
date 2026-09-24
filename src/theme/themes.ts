// The design tokens of every theme. Components use only these (through the Tailwind classes in
// tailwind.config.ts), never palette colors, so a theme changes the whole app.
export const THEME_IDS = ['classic'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const COLOR_TOKENS = [
  'bg', // page background
  'surface', // cards
  'inset', // panels and wells inside a card
  'control', // neutral button fill
  'control-hover',
  'line', // decorative dividers and card borders
  'edge', // input, stepper and button borders
  'ink', // headings and values
  'ink-soft', // body text
  'ink-muted', // secondary text
  'ink-faint', // placeholders and disabled text
  'accent', // primary button fill
  'accent-hover',
  'on-accent',
  'accent-ink', // accent-colored text and icons
  'good', // Finish and Save button fill
  'good-hover',
  'on-good',
  'good-ink',
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

export interface Theme {
  id: ThemeId;
  colorScheme: 'dark' | 'light';
  colors: Record<ColorToken, string>; // #rrggbb
  fonts: { display: string; body: string; data: string };
  radius: { card: string; panel: string; control: string; chip: string; pill: string };
  borderWidth: string;
  borderStyle: 'solid' | 'dashed';
  tapSize: string; // height of the set-row steppers and done button
  motionMs: number; // 0 turns off every transition and animation
}

const SYSTEM_SANS =
  "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
const SYSTEM_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

const classic: Theme = {
  id: 'classic',
  colorScheme: 'dark',
  colors: {
    bg: '#090D16',
    surface: '#0F172A',
    inset: '#020617',
    control: '#1E293B',
    'control-hover': '#334155',
    line: '#1E293B',
    edge: '#334155',
    ink: '#FFFFFF',
    'ink-soft': '#E2E8F0',
    'ink-muted': '#94A3B8',
    'ink-faint': '#64748B',
    accent: '#4F46E5',
    'accent-hover': '#6366F1',
    'on-accent': '#FFFFFF',
    'accent-ink': '#818CF8',
    good: '#059669',
    'good-hover': '#10B981',
    'on-good': '#FFFFFF',
    'good-ink': '#34D399',
    'warn-ink': '#FCD34D',
    'bad-ink': '#FB7185',
    'info-ink': '#7DD3FC',
    push: '#FB923C',
    pull: '#34D399',
    legs: '#60A5FA',
    other: '#818CF8',
    'on-split': '#020617',
    'plate-25': '#DC2626',
    'plate-20': '#2563EB',
    'plate-15': '#EAB308',
    'plate-10': '#059669',
    'plate-5': '#E2E8F0',
    'plate-2-5': '#334155',
    'plate-1-25': '#27272A',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#0F172A',
    bar: '#94A3B8'
  },
  fonts: { display: SYSTEM_SANS, body: SYSTEM_SANS, data: SYSTEM_MONO },
  radius: { card: '1.5rem', panel: '1rem', control: '0.75rem', chip: '0.5rem', pill: '9999px' },
  borderWidth: '1px',
  borderStyle: 'solid',
  tapSize: '2rem',
  motionMs: 150
};

export const THEMES: Record<ThemeId, Theme> = { classic };
