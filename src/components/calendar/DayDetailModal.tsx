import React from 'react';
import { X, Calendar, Clock, Dumbbell, Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../types/workout.ts';
import { formatDisplayDate } from '../../utils/date.ts';

interface DayDetailModalProps {
  dateString: string;
  sessions: WorkoutSession[];
  onClose: () => void;
  onDeleteSession?: (id: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateString,
  sessions,
  onClose,
  onDeleteSession
}) => {
  const formattedDate = formatDisplayDate(dateString);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{formattedDate}</h3>
              <p className="text-xs text-slate-400">
                {sessions.length === 0 ? 'No workouts logged on this day' : `${sessions.length} workout(s) recorded`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Rest day or no workout logged.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map(session => {
              const splitBadge = {
                Push: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
                Pull: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                Legs: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                Other: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              }[session.splitType];

              return (
                <div
                  key={session.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${splitBadge}`}>
                        {session.name} Day
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{session.durationMinutes}m</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {session.totalVolumeKg.toLocaleString()} kg
                      </span>
                      {onDeleteSession && (
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exercise Logs */}
                  <div className="space-y-3">
                    {session.exercises.map(ex => (
                      <div key={ex.exerciseId} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-200">{ex.exerciseName}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {ex.sets.filter(s => s.completed).length} sets
                          </span>
                        </div>

                        {/* Sets chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {ex.sets.map((s, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-md font-mono text-xs ${
                                s.completed ? 'bg-slate-800 text-indigo-300 font-semibold' : 'bg-slate-900 text-slate-500'
                              }`}
                            >
                              {s.weightKg}kg × {s.repsCompleted}
                            </span>
                          ))}
                        </div>

                        {ex.notes && (
                          <p className="text-[11px] text-slate-400 mt-2 italic">
                            Note: {ex.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {session.notes && (
                    <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <strong>Session Notes:</strong> {session.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
