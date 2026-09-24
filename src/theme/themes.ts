import type { DateStyle } from '../utils/date.ts';

// The design tokens of every theme. Components use only these (through the Tailwind classes in
// tailwind.config.ts), never palette colors, so a theme changes the whole app.
export const THEME_IDS = ['classic', 'brutalism', 'terminal', 'telemetry', 'journal'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME_ID: ThemeId = 'classic';

// The localStorage key of the theme chosen on this device. Other devices keep their own.
export const THEME_STORAGE_KEY = 'gymmy_theme_v1';

// Reads a stored value. Anything that is not a theme id means "use the default".
export function parseThemeId(value: unknown): ThemeId | null {
  return THEME_IDS.find(id => id === value) ?? null;
}

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
  'bar',
  'rule', // ledger lines and the double rule under headings
  'stamp', // ink stamps and the ledger's margin line
  'gauge' // gauge arcs, plate-stock warnings and the calendar heat map
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

// Behavior a stylesheet cannot express. Every field is read by a component.
export interface ThemeTraits {
  celebration: 'confetti' | 'stamp' | 'none'; // what finishing a workout shows besides the summary
  doneMark: 'check' | 'stamp' | 'glyph'; // what the done button shows: a check, a "Done" stamp, or [x] and [ ]
  dates: DateStyle; // how session dates are written in lists
  commandLine: boolean; // the tracker's command line, and single-key shortcuts
  dialogs: 'overlay' | 'pane'; // a dialog floats over the page, or replaces it as a full-screen pane
}

export interface Theme {
  id: ThemeId;
  label: string; // shown in Settings
  description: string; // one line under the label
  colorScheme: 'dark' | 'light';
  colors: Record<ColorToken, string>; // #rrggbb
  fonts: { display: string; body: string; data: string; note: string }; // note: handwritten notes
  radius: { card: string; panel: string; control: string; chip: string; pill: string };
  borderWidth: string;
  borderStyle: 'solid' | 'dashed';
  tapSize: string; // height of the set-row steppers and done button
  tapSizeLarge: string; // minimum height of Start, Finish and the rest-timer buttons
  motionMs: number; // 0 turns off every transition and animation
  traits: ThemeTraits;
}

const SYSTEM_SANS =
  "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
const SYSTEM_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

const classic: Theme = {
  id: 'classic',
  label: 'Classic',
  description: 'Slate and indigo, rounded cards. The original look.',
  colorScheme: 'dark',
  colors: {
    bg: '#090D16',
    surface: '#0F172A',
    inset: '#020617',
    control: '#1E293B',
    'control-hover': '#334155',
    line: '#1E293B',
    edge: '#5A6B84',
    ink: '#FFFFFF',
    'ink-soft': '#E2E8F0',
    'ink-muted': '#94A3B8',
    'ink-faint': '#64748B',
    accent: '#4F46E5',
    'accent-hover': '#6366F1',
    'on-accent': '#FFFFFF',
    'accent-ink': '#818CF8',
    good: '#047857',
    'good-hover': '#059669',
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
    'plate-10': '#047857',
    'plate-5': '#E2E8F0',
    'plate-2-5': '#334155',
    'plate-1-25': '#27272A',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#0F172A',
    bar: '#94A3B8',
    rule: '#1E293B',
    stamp: '#FB7185',
    gauge: '#FCD34D'
  },
  fonts: { display: SYSTEM_SANS, body: SYSTEM_SANS, data: SYSTEM_MONO, note: SYSTEM_SANS },
  radius: { card: '1.5rem', panel: '1rem', control: '0.75rem', chip: '0.5rem', pill: '9999px' },
  borderWidth: '1px',
  borderStyle: 'solid',
  tapSize: '2rem',
  tapSizeLarge: '2.25rem',
  motionMs: 150,
  traits: { celebration: 'confetti', doneMark: 'check', dates: 'numeric', commandLine: false, dialogs: 'overlay' }
};

// A garage gym under strip lights: cast iron, chalk and caution tape. Everything is big enough
// to hit with shaking hands after a heavy set.
const brutalism: Theme = {
  id: 'brutalism',
  label: 'Industrial Brutalism',
  description: 'Iron, chalk and caution yellow. Square, heavy, big targets.',
  colorScheme: 'dark',
  colors: {
    bg: '#0B0B0A',
    surface: '#161614',
    inset: '#050505',
    control: '#26251F',
    'control-hover': '#34322A',
    line: '#3A382F',
    edge: '#77725F',
    ink: '#F5F3EA',
    'ink-soft': '#E4E1D3',
    'ink-muted': '#A9A493',
    'ink-faint': '#7E7967',
    accent: '#FFD000',
    'accent-hover': '#FFE04D',
    'on-accent': '#0B0B0A',
    'accent-ink': '#FFD000',
    good: '#F5F3EA',
    'good-hover': '#FFFFFF',
    'on-good': '#0B0B0A',
    'good-ink': '#A6E35A',
    'warn-ink': '#FF9F1A',
    'bad-ink': '#FF5A47',
    'info-ink': '#6CC4FF',
    push: '#FF6A00',
    pull: '#FFD000',
    legs: '#E8E4D8',
    other: '#A9A493',
    'on-split': '#0B0B0A',
    'plate-25': '#D7261E',
    'plate-20': '#1F5FD1',
    'plate-15': '#F2C200',
    'plate-10': '#17733A',
    'plate-5': '#EDEDED',
    'plate-2-5': '#3A3A3A',
    'plate-1-25': '#6E6E6E',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#0B0B0A',
    bar: '#8A877C',
    rule: '#26251F',
    stamp: '#FFD000',
    gauge: '#FFD000'
  },
  fonts: {
    display: "Anton, Impact, 'Arial Narrow Bold', sans-serif",
    body: `'Archivo Variable', Archivo, ${SYSTEM_SANS}`,
    data: `'JetBrains Mono Variable', 'JetBrains Mono', ${SYSTEM_MONO}`,
    note: `'Archivo Variable', Archivo, ${SYSTEM_SANS}`
  },
  radius: { card: '0', panel: '0', control: '0', chip: '0', pill: '0' },
  borderWidth: '3px',
  borderStyle: 'solid',
  tapSize: '3.5rem',
  tapSizeLarge: '4.5rem',
  motionMs: 80,
  traits: { celebration: 'none', doneMark: 'check', dates: 'numeric', commandLine: false, dialogs: 'overlay' }
};

// A green-phosphor console: logging a set is typing a command. No animation, no overlays, and
// every action has a key.
const terminal: Theme = {
  id: 'terminal',
  label: 'Terminal CLI',
  description: 'Green phosphor console. Type 62.5x8@2 to log a set.',
  colorScheme: 'dark',
  colors: {
    bg: '#050805',
    surface: '#0A100A',
    inset: '#030503',
    control: '#0F1A0F',
    'control-hover': '#173017',
    line: '#1C3A1F',
    edge: '#2E7A3A',
    ink: '#C6FFD2',
    'ink-soft': '#8CF5A6',
    'ink-muted': '#56C274',
    'ink-faint': '#3C8C55',
    accent: '#33FF66',
    'accent-hover': '#70FF94',
    'on-accent': '#031A08',
    'accent-ink': '#33FF66',
    good: '#29D95A',
    'good-hover': '#4DF07A',
    'on-good': '#031A08',
    'good-ink': '#5CFF85',
    'warn-ink': '#FFB000',
    'bad-ink': '#FF6B5E',
    'info-ink': '#5CE1E6',
    push: '#FFB000',
    pull: '#33FF66',
    legs: '#5CE1E6',
    other: '#C3A6FF',
    'on-split': '#031A08',
    'plate-25': '#C42F27',
    'plate-20': '#2B63C4',
    'plate-15': '#F2C200',
    'plate-10': '#1B7340',
    'plate-5': '#E6F5E9',
    'plate-2-5': '#2E3A2F',
    'plate-1-25': '#5D6B5F',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#031A08',
    bar: '#56C274',
    rule: '#1C3A1F',
    stamp: '#33FF66',
    gauge: '#FFB000'
  },
  fonts: {
    display: `VT323, 'JetBrains Mono Variable', ${SYSTEM_MONO}`,
    body: `'JetBrains Mono Variable', 'JetBrains Mono', ${SYSTEM_MONO}`,
    data: `'JetBrains Mono Variable', 'JetBrains Mono', ${SYSTEM_MONO}`,
    note: `'JetBrains Mono Variable', 'JetBrains Mono', ${SYSTEM_MONO}`
  },
  radius: { card: '0', panel: '0', control: '0', chip: '0', pill: '0' },
  borderWidth: '1px',
  borderStyle: 'dashed',
  tapSize: '2.25rem',
  tapSizeLarge: '2.75rem',
  motionMs: 0,
  traits: { celebration: 'none', doneMark: 'glyph', dates: 'numeric', commandLine: true, dialogs: 'pane' }
};

// A lab instrument panel: training as measured data. Loads, reps in reserve, volume and plate use
// read like gauges, on a faint instrument grid.
const telemetry: Theme = {
  id: 'telemetry',
  label: 'Mechanical Telemetry',
  description: 'Slate, cyan and amber gauges. Readouts, plate strips, heat map.',
  colorScheme: 'dark',
  colors: {
    bg: '#0A0F17',
    surface: '#0F1622',
    inset: '#070B12',
    control: '#172233',
    'control-hover': '#213049',
    line: '#1B283A',
    edge: '#4A6689',
    ink: '#E6EEF7',
    'ink-soft': '#C3D0DE',
    'ink-muted': '#8B9DB3',
    'ink-faint': '#66788E',
    accent: '#22D3EE',
    'accent-hover': '#67E8F9',
    'on-accent': '#04141A',
    'accent-ink': '#38D9F0',
    good: '#3DDC97',
    'good-hover': '#6BE7B2',
    'on-good': '#04130C',
    'good-ink': '#5BE3A8',
    'warn-ink': '#F5A524',
    'bad-ink': '#FF6B6B',
    'info-ink': '#8AAEFF',
    push: '#FF8A4C',
    pull: '#3DDC97',
    legs: '#8AAEFF',
    other: '#C79BFF',
    'on-split': '#04141A',
    'plate-25': '#D9362C',
    'plate-20': '#2F6FDB',
    'plate-15': '#F2C200',
    'plate-10': '#17733F',
    'plate-5': '#E6EEF7',
    'plate-2-5': '#344A68',
    'plate-1-25': '#5A6B80',
    'on-plate': '#FFFFFF',
    'on-plate-light': '#04141A',
    bar: '#8B9DB3',
    rule: '#152235',
    stamp: '#38D9F0',
    gauge: '#F5A524'
  },
  fonts: {
    display: "'Chakra Petch', 'Segoe UI', sans-serif",
    body: `'IBM Plex Sans Variable', 'IBM Plex Sans', ${SYSTEM_SANS}`,
    data: `'IBM Plex Mono', ${SYSTEM_MONO}`,
    note: `'IBM Plex Sans Variable', 'IBM Plex Sans', ${SYSTEM_SANS}`
  },
  radius: { card: '4px', panel: '4px', control: '2px', chip: '2px', pill: '9999px' },
  borderWidth: '1px',
  borderStyle: 'solid',
  tapSize: '2.5rem',
  tapSizeLarge: '3rem',
  motionMs: 120,
  traits: { celebration: 'none', doneMark: 'check', dates: 'numeric', commandLine: false, dialogs: 'overlay' }
};

// A 1970s training log: parchment pages, ruled lines, espresso ink, a margin for how the
// session felt, and a stamp when the work is done. The only light theme.
const journal: Theme = {
  id: 'journal',
  label: 'Golden Era Journal',
  description: 'Parchment, ruled ledger, margin notes and ink stamps.',
  colorScheme: 'light',
  colors: {
    bg: '#EFE6D2',
    surface: '#FBF6EA',
    inset: '#F4ECDA',
    control: '#E6DAC0',
    'control-hover': '#DBCBAA',
    line: '#D6C7A6',
    edge: '#9C8762',
    ink: '#2A1C12',
    'ink-soft': '#3D2B1E',
    'ink-muted': '#65503D',
    'ink-faint': '#8A7560',
    accent: '#1F4D3A',
    'accent-hover': '#2A6149',
    'on-accent': '#FBF6EA',
    'accent-ink': '#1F4D3A',
    good: '#3B5E2B',
    'good-hover': '#4A7236',
    'on-good': '#FBF6EA',
    'good-ink': '#3B5E2B',
    'warn-ink': '#8A5A00',
    'bad-ink': '#8E2A22',
    'info-ink': '#2B4C7E',
    push: '#9C3D1B',
    pull: '#1F4D3A',
    legs: '#2B4C7E',
    other: '#6B4E7A',
    'on-split': '#FBF6EA',
    'plate-25': '#9E2B25',
    'plate-20': '#2B4C7E',
    'plate-15': '#C39A2E',
    'plate-10': '#3B6B45',
    'plate-5': '#E9E0CC',
    'plate-2-5': '#4A3B2E',
    'plate-1-25': '#7A6A58',
    'on-plate': '#FBF6EA',
    'on-plate-light': '#2A1C12',
    bar: '#7A6A58',
    rule: '#D9C9A6',
    stamp: '#8E2A22',
    gauge: '#8A5A00'
  },
  fonts: {
    display: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
    body: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif",
    data: "'Courier Prime', 'Courier New', monospace",
    note: "'Caveat Variable', Caveat, 'Segoe Print', cursive"
  },
  radius: { card: '2px', panel: '2px', control: '2px', chip: '2px', pill: '9999px' },
  borderWidth: '1px',
  borderStyle: 'solid',
  tapSize: '2.25rem',
  tapSizeLarge: '3rem',
  motionMs: 180,
  traits: { celebration: 'stamp', doneMark: 'stamp', dates: 'written', commandLine: false, dialogs: 'overlay' }
};

export const THEMES: Record<ThemeId, Theme> = { classic, brutalism, terminal, telemetry, journal };
