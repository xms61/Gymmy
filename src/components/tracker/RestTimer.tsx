import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { scheduleTimerChime, vibrateForChime } from '../../utils/audio.ts';
import { Flaps } from '../ui/Flaps.tsx';

interface RestTimerProps {
  initialSeconds: number;
  onFinish: () => void;
  onSkip: () => void;
}

// The rest countdown after a done set, in flap digits on the board.
export function RestTimer({ initialSeconds, onFinish, onSkip }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const targetEndTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const cancelChimeRef = useRef<() => void>(() => {});

  // The chime is set up on the audio clock at the start, so a throttled background tab can't delay it.
  const scheduleChime = (seconds: number) => {
    cancelChimeRef.current();
    cancelChimeRef.current = scheduleTimerChime(seconds);
  };

  useEffect(() => {
    scheduleChime(initialSeconds);
    return () => cancelChimeRef.current();
  }, []);

  // The display ticks from the end time, never by counting ticks.
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const diff = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        setSecondsLeft(0);
        vibrateForChime();
        onFinishRef.current();
      } else {
        setSecondsLeft(diff);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => {
    if (isActive) {
      cancelChimeRef.current();
      setIsActive(false);
    } else {
      targetEndTimeRef.current = Date.now() + secondsLeft * 1000;
      scheduleChime(secondsLeft);
      setIsActive(true);
    }
  };

  const addSeconds = (amount: number) => {
    const newSeconds = Math.max(0, secondsLeft + amount);
    setSecondsLeft(newSeconds);
    targetEndTimeRef.current = Date.now() + newSeconds * 1000;
    if (isActive) scheduleChime(newSeconds);
  };

  const clock = formatClock(secondsLeft);
  const pauseLabel = isActive ? 'Pause' : 'Resume';
  const controls = (
    <>
      <button onClick={() => addSeconds(-15)} className="btn btn-secondary h-tap-lg text-base normal-case border border-edge">
        −15s
      </button>
      <button onClick={() => addSeconds(30)} className="btn btn-secondary h-tap-lg text-base normal-case border border-edge">
        +30s
      </button>
      <button onClick={toggleTimer} title={pauseLabel} aria-label={pauseLabel} className="btn btn-secondary h-tap-lg border border-edge">
        {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <button onClick={onSkip} className="btn btn-secondary h-tap-lg text-base border border-edge">
        <SkipForward className="w-4 h-4" />
        Skip
      </button>
    </>
  );

  return (
    <section aria-label="Rest timer">
      <RestHeading state={isActive ? 'Resting' : 'Paused'} />
      <Flaps text={clock} cells={5} label={`${clock} rest left`} className="mt-3 text-[4.5rem]" />
      <div className="mt-4 grid grid-cols-4 gap-1.5">{controls}</div>
    </section>
  );
}

// Before the first done set, and between rests: the rest that the next done set starts.
export function RestIdle({ seconds }: { seconds: number }) {
  return (
    <section aria-label="Rest timer">
      <RestHeading state="Ready" />
      <Flaps text={formatClock(seconds)} cells={5} label={`${formatClock(seconds)} rest after this set`} className="mt-3 text-[4.5rem] opacity-40" />
      <p className="mt-3 text-base text-ink-muted">Starts when you log a set.</p>
    </section>
  );
}

function RestHeading({ state }: { state: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-2xl text-ink">Rest</h3>
      <span className="section-label">{state}</span>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
