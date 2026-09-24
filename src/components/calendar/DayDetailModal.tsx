import React from 'react';
import { Calendar, Clock, Dumbbell, Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../types/workout.ts';
import { formatDisplayDate } from '../../utils/date.ts';
import { Dialog, DialogHeader } from '../ui/Dialog.tsx';
import { SplitBadge } from '../ui/badges.tsx';

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
  return (
    <Dialog width="lg" onClose={onClose}>
      <DialogHeader
        icon={Calendar}
        title={formatDisplayDate(dateString)}
        subtitle={sessions.length === 0 ? 'No workouts logged on this day' : `${sessions.length} workout(s) recorded`}
        onClose={onClose}
      />

      {sessions.length === 0 ? (
        <div className="panel bg-inset/50 text-center py-10">
          <Dumbbell className="w-10 h-10 text-ink-faint mx-auto mb-2" />
          <p className="text-sm text-ink-muted">Rest day or no workout logged.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map(session => (
            <div key={session.id} className="panel p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SplitBadge split={session.splitType} label={`${session.name} Day`} />
                  <span className="flex items-center space-x-1 text-xs text-ink-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{session.durationMinutes}m</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-ink-soft">
                    {session.totalVolumeKg.toLocaleString()} kg
                  </span>
                  {onDeleteSession && (
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="text-ink-faint hover:text-bad-ink p-1 transition"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {session.exercises.map(ex => (
                  <div key={ex.exerciseId} className="bg-surface/60 rounded-control p-3 border border-line">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-ink-soft">{ex.exerciseName}</span>
                      <span className="text-[11px] font-mono text-ink-muted">
                        {ex.sets.filter(s => s.completed).length} sets
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-chip font-mono text-xs ${
                            s.completed ? 'bg-control text-accent-ink font-semibold' : 'bg-surface text-ink-faint'
                          }`}
                        >
                          {s.weightKg}kg × {s.repsCompleted}
                        </span>
                      ))}
                    </div>

                    {ex.notes && <p className="text-[11px] text-ink-muted mt-2 italic">Note: {ex.notes}</p>}
                  </div>
                ))}
              </div>

              {session.notes && (
                <div className="text-xs text-ink-soft bg-surface p-3 rounded-control border border-line">
                  <strong>Session Notes:</strong> {session.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={onClose} className="btn btn-secondary w-full mt-5 py-3 text-sm">
        Close
      </button>
    </Dialog>
  );
};
