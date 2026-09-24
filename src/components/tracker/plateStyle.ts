// Olympic plate colors, taken from the theme. Class names are written out in full so Tailwind finds them.
export const PLATE_STYLE: Record<number, { fill: string; text: string; size: string }> = {
  25: { fill: 'bg-plate-25', text: 'text-on-plate', size: 'h-16 w-4' },
  20: { fill: 'bg-plate-20', text: 'text-on-plate', size: 'h-16 w-4' },
  15: { fill: 'bg-plate-15', text: 'text-on-plate-light', size: 'h-12 w-3.5' },
  10: { fill: 'bg-plate-10', text: 'text-on-plate', size: 'h-12 w-3.5' },
  5: { fill: 'bg-plate-5', text: 'text-on-plate-light', size: 'h-10 w-3' },
  2.5: { fill: 'bg-plate-2-5', text: 'text-on-plate', size: 'h-7 w-2.5' },
  1.25: { fill: 'bg-plate-1-25', text: 'text-on-plate', size: 'h-7 w-2.5' }
};
