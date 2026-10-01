import { useEffect, useRef } from 'react';

interface FlapsProps {
  text: string;
  cells?: number; // pads on the left with blank cells up to this many, so the row keeps its width
  label?: string; // what a screen reader hears; defaults to the text
  className?: string; // sets the size: every cell is 0.66em wide, punctuation included
}

// Text on split-flap cells. When a character changes, the upper leaf of the old one falls over
// the split and the lower leaf of the new one lands under it; the other cells hold still.
export function Flaps({ text, cells = 0, label, className = '' }: FlapsProps) {
  const padded = text.padStart(cells, ' ');
  const previous = useRef<string | null>(null);
  useEffect(() => {
    previous.current = padded;
  });
  const before = previous.current;

  return (
    <span className={`inline-flex gap-[0.06em] leading-none ${className}`}>
      <span className="sr-only">{label ?? text}</span>
      {[...padded].map((char, index) => {
        const old = before?.[index];
        return (
          <FlapCell key={`${index}-${char}`} char={char} old={old !== undefined && old !== char ? old : null} />
        );
      })}
    </span>
  );
}

function FlapCell({ char, old }: { char: string; old: string | null }) {
  return (
    <span aria-hidden="true" className="flap">
      <Leaf char={char} half="top" />
      <Leaf char={old ?? char} half="bottom" />
      {old !== null && (
        <>
          <Leaf char={old} half="top" motion="flap-fall" />
          <Leaf char={char} half="bottom" motion="flap-land" />
        </>
      )}
    </span>
  );
}

// Written out in full: Tailwind keeps only the component classes it finds as text.
const HALF = { top: 'flap-top', bottom: 'flap-bottom' };

function Leaf({ char, half, motion = '' }: { char: string; half: 'top' | 'bottom'; motion?: string }) {
  return <span className={`flap-leaf ${HALF[half]} ${motion}`}>{char === ' ' ? '' : char}</span>;
}
