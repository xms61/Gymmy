// Text drawings for themes that show the app as a console.

// "[######----] 60%"
export function progressBarText(percent: number, width = 10): string {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${Math.round(percent)}%`;
}

// "|==[20][15][10]--- 100 kg ---[10][15][20]==|" for a bar loaded on both ends, and
// "floor--- 20 kg ---[10][5]==|" for a landmine loaded on one. `layout` is one end, heaviest first.
export function plateBarText(layout: number[], weightKg: number, ends: 1 | 2): string {
  const outward = layout.map(plate => `[${plate}]`).join('');
  const inward = [...layout].reverse().map(plate => `[${plate}]`).join('');
  const middle = `--- ${weightKg} kg ---`;
  return ends === 2 ? `|==${inward}${middle}${outward}==|` : `floor${middle}${outward}==|`;
}
