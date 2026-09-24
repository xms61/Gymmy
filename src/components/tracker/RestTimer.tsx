import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Plus, Minus, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { playTimerChime } from '../../utils/audio';

interface RestTimerProps {
  totalSeconds: number;
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

  // Sync when initialSeconds changes (e.g. new exercise timer started)
  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(true);
    targetEndTimeRef.current = Date.now() + initialSeconds * 1000;
  }, [initialSeconds]);

  // Main countdown loop using high-resolution timestamp
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((targetEndTimeRef.current - now) / 1000);

      if (diff <= 0) {
        clearInterval(interval);
        setSecondsLeft(0);
        playTimerChime();
        onFinishRef.current();
      } else {
        setSecondsLeft(diff);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      targetEndTimeRef.current = Date.now() + secondsLeft * 1000;
      setIsActive(true);
    }
  };

  const addSeconds = (amount: number) => {
    const newSeconds = Math.max(0, secondsLeft + amount);
    setSecondsLeft(newSeconds);
    targetEndTimeRef.current = Date.now() + newSeconds * 1000;
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const progressPercent =
    initialSeconds > 0
      ? Math.min(100, Math.max(0, ((initialSeconds - secondsLeft) / initialSeconds) * 100))
      : 0;

  // Minimized floating banner
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex items-center justify-between animate-slide-up">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
            {timeFormatted}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Resting: {exerciseName}</div>
            <div className="text-xs text-indigo-300 font-semibold">Set {nextSetNumber} up next</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => addSeconds(30)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
          >
            +30s
          </button>
          <button
            onClick={toggleTimer}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            title="Skip rest"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 text-slate-400 hover:text-white transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsMinimized(true)}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-semibold">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Rest Timer</span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise info */}
        <div className="text-center mb-6 z-10">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Up Next</div>
          <h3 className="text-lg font-bold text-slate-100">{exerciseName}</h3>
          <div className="text-sm font-medium text-indigo-400">Set {nextSetNumber}</div>
        </div>

        {/* Circular Timer Visual */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-800 stroke-current"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-indigo-500 stroke-current transition-all duration-100 ease-linear"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tighter">
              {timeFormatted}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1">
              {isActive ? 'Resting...' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center space-x-2 mb-6 z-10">
          <button
            onClick={() => addSeconds(-15)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition active:scale-95"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>15s</span>
          </button>
          <button
            onClick={() => addSeconds(30)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-xl transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>30s</span>
          </button>
          <button
            onClick={() => addSeconds(60)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-xl transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>60s</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="w-full grid grid-cols-2 gap-3 z-10">
          <button
            onClick={toggleTimer}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition active:scale-95 ${
              isActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              playTimerChime();
              onClose();
            }}
            className="flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip Rest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
