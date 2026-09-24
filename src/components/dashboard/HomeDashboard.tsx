import React, { useMemo } from 'react';
import {
  Play,
  Trophy,
  Calendar as CalendarIcon,
  Dumbbell,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import type { SplitType, WorkoutSession, ExerciseDefinition } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { logsFor, type ExerciseLogIndex } from '../../services/exerciseLogs.ts';
import { latestSession, nextSplit as nextInRotation, ROTATION } from '../../services/rotation.ts';
import { SPLIT_STYLE, StatusBadge } from '../ui/badges.tsx';

interface HomeDashboardProps {
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
  logIndex: ExerciseLogIndex;
  onStartWorkout: (type: SplitType) => void;
  canStart: boolean; // false until the first sync, so targets come from the full history
  onNavigateToCalendar: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  sessions,
  exercises,
  logIndex,
  onStartWorkout,
  canStart,
  onNavigateToCalendar
}) => {
  const lastSession = useMemo(() => latestSession(sessions), [sessions]);
  const nextSplit: SplitType = useMemo(() => nextInRotation(sessions), [sessions]);

  // Next workout exercises and overload preview
  const nextWorkoutExercises = useMemo(() => {
    return exercises.filter(e => e.workoutType === nextSplit);
  }, [exercises, nextSplit]);

  const nextOverloadRecommendations = useMemo(() => {
    return nextWorkoutExercises.map(ex => ({
      exercise: ex,
      rec: getRecommendation(ex, logsFor(logIndex, ex))
    }));
  }, [nextWorkoutExercises, logIndex]);

  // Overall workout stats
  const totalWorkouts = sessions.filter(s => s.completed).length;
  const totalVolumeKg = sessions.reduce((acc, s) => acc + (s.completed ? s.totalVolumeKg : 0), 0);

  const nextStyle = SPLIT_STYLE[nextSplit];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero: Next Recommended Workout */}
      <div className={`bg-surface bg-gradient-to-br ${nextStyle.gradient} border ${nextStyle.border} rounded-card p-6 md:p-8 shadow-2xl relative overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 section-label font-extrabold mb-1">
              <Sparkles className="w-4 h-4 text-accent-ink" />
              <span>Next in Rotation</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
              {nextSplit} Workout
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {lastSession
                ? `Following your last ${lastSession.name} session on ${lastSession.date}`
                : 'No workouts logged yet. The rotation starts with Push.'}
            </p>
          </div>

          <button
            onClick={() => onStartWorkout(nextSplit)}
            disabled={!canStart}
            className={`btn px-6 py-3.5 disabled:opacity-60 ${nextStyle.fill} hover:opacity-90 font-black text-sm uppercase tracking-wider rounded-panel shadow-xl`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{canStart ? `Start ${nextSplit}` : 'Syncing…'}</span>
          </button>
        </div>

        {/* Overload Recommendations Preview for today */}
        <div className="panel bg-inset/70 p-4">
          <div className="section-label mb-3 flex items-center justify-between">
            <span>Today's Target & Overload Goals ({nextWorkoutExercises.length} exercises)</span>
            <span className="text-[11px] font-normal text-accent-ink">Auto-adjusted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {nextOverloadRecommendations.map(({ exercise, rec }) => (
              <div
                key={exercise.id}
                className="bg-surface/80 border border-line rounded-control p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-ink-soft">{exercise.name}</div>
                  <div className="text-[11px] text-ink-muted">
                    Target: <strong className="text-accent-ink">{rec.recommendedWeightKg} kg</strong> × {exercise.targetRepsMin}–{exercise.targetRepsMax}
                  </div>
                </div>

                <StatusBadge status={rec.status} short />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launch Workout Split Grid */}
      <div>
        <h3 className="section-label mb-3">Choose a Workout to Start</h3>
        <div className="grid grid-cols-3 gap-3">
          {ROTATION.map(split => {
            const style = SPLIT_STYLE[split];
            const exerciseCount = exercises.filter(e => e.workoutType === split).length;
            return (
              <button
                key={split}
                onClick={() => onStartWorkout(split)}
                disabled={!canStart}
                className={`p-4 card disabled:opacity-60 disabled:cursor-wait rounded-panel ${style.hoverBorder} flex flex-col items-center justify-center space-y-2 transition active:scale-95 group`}
              >
                <div className={`w-10 h-10 rounded-control ${style.tint} ${style.text} ${style.groupHoverFill} flex items-center justify-center transition`}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-ink">{split}</div>
                  <div className="text-[11px] text-ink-muted">{exerciseCount} Exercises</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats & Mini Calendar Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adherence & Volume Stats */}
        <div className="card p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-ink flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-warn-ink" />
                <span>Overall Performance</span>
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="panel p-3">
                <div className="text-xs text-ink-muted font-medium">Logged Sessions</div>
                <div className="text-2xl font-mono font-black text-ink mt-1">{totalWorkouts}</div>
              </div>

              <div className="panel p-3">
                <div className="text-xs text-ink-muted font-medium">All-Time Volume</div>
                <div className="text-2xl font-mono font-black text-accent-ink mt-1">
                  {Math.round(totalVolumeKg / 1000)}k <span className="text-xs font-normal text-ink-muted">kg</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-muted mt-2">
            Every set and rep drives your automatic progressive overload calculations.
          </p>
        </div>

        {/* Mini Calendar Banner */}
        <button
          onClick={onNavigateToCalendar}
          className="card p-5 shadow-xl hover:border-accent-ink/50 transition flex flex-col justify-between text-left group"
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-ink flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-accent-ink" />
                <span>Workout Calendar</span>
              </h4>
              <span className="text-xs text-accent-ink font-semibold group-hover:translate-x-0.5 transition flex items-center">
                View Full <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Review exactly which days you worked out with full set breakdowns and notes.
            </p>
          </div>

          <div className="panel p-3 w-full flex items-center justify-between">
            <span className="text-xs text-ink-soft font-semibold">Latest Workout:</span>
            <span className="text-xs font-mono font-bold text-good-ink">
              {lastSession ? `${lastSession.name} (${lastSession.date})` : 'None yet'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
