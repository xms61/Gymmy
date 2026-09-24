// A rubber-stamp mark in the theme's stamp ink: a double border, slightly rotated. It settles
// in with the theme's motion, and simply appears when motion is off.
export function InkStamp({ label, size = 'sm' }: { label: string; size?: 'sm' | 'lg' }) {
  return <span className={`ink-stamp ${size === 'lg' ? 'ink-stamp-lg' : ''}`}>{label}</span>;
}
