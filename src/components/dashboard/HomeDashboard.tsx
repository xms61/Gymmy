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

interface HomeDashboardProps {
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
  onStartWorkout: (type: SplitType) => void;
  onNavigateToCalendar: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  sessions,
  exercises,
  onStartWorkout,
  onNavigateToCalendar
}) => {
  // Determine next scheduled split based on last completed session (newest date first)
  const lastSession = useMemo(() => {
    const completed = [...sessions]
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return completed.length > 0 ? completed[0] : null;
  }, [sessions]);

  const nextSplit: SplitType = useMemo(() => {
    if (!lastSession) return 'Push';
    if (lastSession.splitType === 'Legs') return 'Push';
    if (lastSession.splitType === 'Push') return 'Pull';
    if (lastSession.splitType === 'Pull') return 'Legs';
    return 'Push';
  }, [lastSession]);

  // Next workout exercises and overload preview
  const nextWorkoutExercises = useMemo(() => {
    return exercises.filter(e => e.workoutType === nextSplit);
  }, [exercises, nextSplit]);

  const nextOverloadRecommendations = useMemo(() => {
    return nextWorkoutExercises.map(ex => ({
      exercise: ex,
      rec: getRecommendation(ex, sessions)
    }));
  }, [nextWorkoutExercises, sessions]);

  // Overall workout stats
  const totalWorkouts = sessions.filter(s => s.completed).length;
  const totalVolumeKg = sessions.reduce((acc, s) => acc + (s.completed ? s.totalVolumeKg : 0), 0);

  const splitColors = {
    Push: { bg: 'from-orange-500/20 to-amber-500/5', border: 'border-orange-500/30', text: 'text-orange-400', button: 'bg-orange-600 hover:bg-orange-500' },
    Pull: { bg: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', button: 'bg-emerald-600 hover:bg-emerald-500' },
    Legs: { bg: 'from-blue-500/20 to-indigo-500/5', border: 'border-blue-500/30', text: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-500' },
    Other: { bg: 'from-indigo-500/20 to-purple-500/5', border: 'border-indigo-500/30', text: 'text-indigo-400', button: 'bg-indigo-600 hover:bg-indigo-500' }
  }[nextSplit];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero: Next Recommended Workout */}
      <div className={`bg-gradient-to-br ${splitColors.bg} bg-slate-900 border ${splitColors.border} rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Next in Rotation</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {nextSplit} Workout
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {lastSession
                ? `Following your last ${lastSession.name} session on ${lastSession.date}`
                : 'No workouts logged yet. The rotation starts with Push.'}
            </p>
          </div>

          <button
            onClick={() => onStartWorkout(nextSplit)}
            className={`flex items-center space-x-2 px-6 py-3.5 ${splitColors.button} text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-600/20 transition active:scale-95`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start {nextSplit}</span>
          </button>
        </div>

        {/* Overload Recommendations Preview for today */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Today's Target & Overload Goals ({nextWorkoutExercises.length} exercises)</span>
            <span className="text-[11px] font-normal text-indigo-400">Auto-adjusted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {nextOverloadRecommendations.map(({ exercise, rec }) => (
              <div
                key={exercise.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{exercise.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Target: <strong className="text-indigo-300">{rec.recommendedWeightKg} kg</strong> × {exercise.targetRepsMin}–{exercise.targetRepsMax}
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                  rec.status === 'increase_load'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : rec.status === 'deload'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  {rec.status === 'increase_load' ? '+Weight' : rec.status === 'deload' ? 'Deload' : '+Reps'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launch Workout Split Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Choose a Workout to Start
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onStartWorkout('Push')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-2xl flex flex-col items-center justify-center space-y-2 transition active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm text-white">Push</div>
              <div className="text-[11px] text-slate-400">5 Exercises</div>
            </div>
          </button>

          <button
            onClick={() => onStartWorkout('Pull')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center space-y-2 transition active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm text-white">Pull</div>
              <div className="text-[11px] text-slate-400">4 Exercises</div>
            </div>
          </button>

          <button
            onClick={() => onStartWorkout('Legs')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center space-y-2 transition active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black group-hover:bg-blue-500 group-hover:text-white transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm text-white">Legs</div>
              <div className="text-[11px] text-slate-400">3 Exercises</div>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Stats & Mini Calendar Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adherence & Volume Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Overall Performance</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">From Sheet "List"</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Logged Sessions</div>
                <div className="text-2xl font-mono font-black text-white mt-1">{totalWorkouts}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">All-Time Volume</div>
                <div className="text-2xl font-mono font-black text-indigo-400 mt-1">
                  {Math.round(totalVolumeKg / 1000)}k <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Every set and rep drives your automatic progressive overload calculations.
          </p>
        </div>

        {/* Mini Calendar Banner */}
        <div
          onClick={onNavigateToCalendar}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 shadow-xl cursor-pointer transition flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <span>Workout Calendar</span>
              </h4>
              <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-0.5 transition flex items-center">
                View Full <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Review exactly which days you worked out with full set breakdowns and notes.
            </p>
          </div>

          <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">Latest Workout:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {lastSession ? `${lastSession.name} (${lastSession.date})` : 'None yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
