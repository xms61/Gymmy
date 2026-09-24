import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Plus, Minus, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { playTimerChime, scheduleTimerChime, vibrateForChime } from '../../utils/audio.ts';
import { Dialog } from '../ui/Dialog.tsx';

interface RestTimerProps {
  initialSeconds: number;
  exerciseName: string;
  nextSetNumber: number;
  onFinish: () => void;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  exerciseName,
  nextSetNumber,
  onFinish,
  onClose
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);

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

  // Main countdown loop using high-resolution timestamp
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((targetEndTimeRef.current - now) / 1000);

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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const progressPercent =
    initialSeconds > 0
      ? Math.min(100, Math.max(0, ((initialSeconds - secondsLeft) / initialSeconds) * 100))
      : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 bg-surface/95 border border-accent-ink/40 backdrop-blur-md rounded-panel p-3 shadow-2xl flex items-center justify-between animate-slide-up">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-pill bg-accent-ink/20 border-2 border-accent-ink flex items-center justify-center font-mono font-bold text-accent-ink text-sm">
            {timeFormatted}
          </div>
          <div>
            <div className="text-xs text-ink-muted font-medium">Resting: {exerciseName}</div>
            <div className="text-xs text-accent-ink font-semibold">Set {nextSetNumber} up next</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button onClick={() => addSeconds(30)} className="btn btn-secondary px-2 py-1 text-xs font-semibold rounded-chip">
            +30s
          </button>
          <button onClick={toggleTimer} className="btn btn-secondary p-1.5 rounded-chip" title={isActive ? 'Pause' : 'Resume'}>
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-good-ink" />}
          </button>
          <button onClick={onClose} className="btn btn-good p-1.5 rounded-chip" title="Skip rest">
            <SkipForward className="w-4 h-4" />
          </button>
          <button onClick={() => setIsMinimized(false)} className="p-1.5 text-ink-muted hover:text-ink transition" title="Expand">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dialog width="sm" onBackdropClick={() => setIsMinimized(true)} className="flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/10 rounded-pill blur-3xl pointer-events-none" />

      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex items-center space-x-2 text-accent-ink text-sm font-semibold">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Rest Timer</span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="icon-btn p-1.5" title="Minimize">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center mb-6 z-10">
        <div className="section-label font-semibold mb-1">Up Next</div>
        <h3 className="text-lg font-bold text-ink">{exerciseName}</h3>
        <div className="text-sm font-medium text-accent-ink">Set {nextSetNumber}</div>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" className="text-control stroke-current" strokeWidth="6" fill="transparent" />
          <circle
            cx="50"
            cy="50"
            r="44"
            className="text-accent-hover stroke-current transition-all duration-100 ease-linear"
            strokeWidth="6"
            strokeDasharray={276.46}
            strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold font-mono text-ink tracking-tighter">{timeFormatted}</span>
          <span className="text-xs text-ink-muted font-medium mt-1">{isActive ? 'Resting...' : 'Paused'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6 z-10">
        <button onClick={() => addSeconds(-15)} className="btn btn-secondary gap-1 px-3 py-1.5 text-xs font-semibold">
          <Minus className="w-3.5 h-3.5" />
          <span>15s</span>
        </button>
        <button onClick={() => addSeconds(30)} className="btn btn-secondary gap-1 px-3 py-1.5 text-xs font-semibold text-accent-ink">
          <Plus className="w-3.5 h-3.5" />
          <span>30s</span>
        </button>
        <button onClick={() => addSeconds(60)} className="btn btn-secondary gap-1 px-3 py-1.5 text-xs font-semibold text-accent-ink">
          <Plus className="w-3.5 h-3.5" />
          <span>60s</span>
        </button>
      </div>

      <div className="w-full grid grid-cols-2 gap-3 z-10">
        <button onClick={toggleTimer} className={`btn py-3 text-sm ${isActive ? 'btn-secondary' : 'btn-good'}`}>
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isActive ? 'Pause' : 'Resume'}</span>
        </button>

        <button
          onClick={() => {
            playTimerChime();
            onClose();
          }}
          className="btn btn-primary py-3 text-sm shadow-lg shadow-accent/30"
        >
          <SkipForward className="w-4 h-4" />
          <span>Skip Rest</span>
        </button>
      </div>
    </Dialog>
  );
};
