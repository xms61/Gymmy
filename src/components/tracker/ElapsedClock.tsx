import { useEffect, useState } from 'react';
import { elapsedSeconds, formatElapsed } from './workoutTime.ts';

// Ticks on its own, so only this text re-renders every second, not the whole tracker.
export function ElapsedClock({ startTime }: { startTime: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span>{formatElapsed(elapsedSeconds(startTime, now))}</span>;
}
