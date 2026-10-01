import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../types/workout.ts';
import { formatReps } from '../../services/effort.ts';
import { latestSession } from '../../services/rotation.ts';
import { formatDisplayDate, getTodayDateString, toLocalDateString } from '../../utils/date.ts';
import { RouteMarker } from '../ui/badges.tsx';
import { Flaps } from '../ui/Flaps.tsx';
import { monthGrid } from './monthGrid.ts';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WorkoutCalendarProps {
  sessions: WorkoutSession[];
  onDeleteSession: (id: string) => void;
}

// The month and the chosen day side by side: training days carry route markers in the grid, and
// the chosen day's workouts read set by set in the column beside it.
export function WorkoutCalendar({ sessions, onDeleteSession }: WorkoutCalendarProps) {
  const completed = useMemo(() => sessions.filter(s => s.completed), [sessions]);
  const byDate = useMemo(() => groupByDate(completed), [completed]);
  const today = getTodayDateString();
  // Until a day is chosen, the latest training day is open, in its month. Derived rather than
  // stored, so history that arrives after the first render still opens the right day.
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = chosen ?? latestSession(completed)?.date ?? today;
  const shown = monthOf(selected);

  const year = shown.getFullYear();
  const month = shown.getMonth();
  const days = useMemo(() => monthGrid(year, month), [year, month]);
  const monthSessions = completed.filter(s => s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`));
  const monthTonnes = Math.round(monthSessions.reduce((total, s) => total + s.totalVolumeKg, 0) / 100) / 10;

  // Another month opens on its latest training day, or its 1st, so the day beside the grid is
  // always one of the grid's own days.
  const goToMonth = (offset: number) => {
    const first = toLocalDateString(new Date(year, month + offset, 1));
    const prefix = first.slice(0, 8);
    const trainingDays = [...byDate.keys()].filter(date => date.startsWith(prefix)).sort();
    setChosen(trainingDays[trainingDays.length - 1] ?? first);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-2">
          <h2 className="text-5xl leading-none text-ink mr-3">
            {shown.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => goToMonth(-1)} title="Previous month" aria-label="Previous month" className="btn btn-secondary h-tap w-tap border border-edge">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => goToMonth(1)} title="Next month" aria-label="Next month" className="btn btn-secondary h-tap w-tap border border-edge">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setChosen(today)} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
            Today
          </button>
        </div>
        <div className="flex items-end gap-10">
          <Figure label="Workouts" value={String(monthSessions.length)} cells={2} />
          <Figure label="Volume" value={String(monthTonnes)} cells={4} unit="t" />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,7fr)_minmax(18rem,5fr)] gap-10">
        <MonthBoard days={days} byDate={byDate} today={today} selected={selected} onSelect={setChosen} />
        <DayColumn date={selected} sessions={byDate.get(selected) ?? []} onDeleteSession={onDeleteSession} />
      </div>
    </div>
  );
}

interface MonthBoardProps {
  days: ReturnType<typeof monthGrid>;
  byDate: Map<string, WorkoutSession[]>;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

function MonthBoard({ days, byDate, today, selected, onSelect }: MonthBoardProps) {
  return (
    <section aria-label="Month">
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAYS.map(day => (
          <span key={day} className="section-label px-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => {
          const daySessions = byDate.get(day.date) ?? [];
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              aria-pressed={isSelected}
              aria-label={`${formatDisplayDate(day.date)}${daySessions.length ? `, ${daySessions.map(s => s.splitType).join(' and ')}` : ''}`}
              className={`aspect-square min-h-16 p-1.5 flex flex-col justify-between rounded-panel border text-left transition-colors ${
                isSelected ? 'bg-surface border-ink' : 'bg-inset border-line hover:border-edge'
              } ${day.inMonth ? '' : 'opacity-40'}`}
            >
              <span className={`font-mono text-lg leading-none ${day.date === today ? 'w-fit px-1 -mx-1 rounded-chip bg-good text-on-good' : 'text-ink-soft'}`}>
                {day.dayNumber}
              </span>
              {daySessions.length > 0 && (
                <span className="grid gap-1">
                  {/* The split's name rides with its marker, so Push and Pull never rest on colour alone. */}
                  {daySessions.map(s => (
                    <span key={s.id} className="flex items-center gap-1 font-display text-xs font-semibold uppercase tracking-[0.04em] text-ink">
                      <RouteMarker split={s.splitType} size="sm" />
                      {s.splitType}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface DayColumnProps {
  date: string;
  sessions: WorkoutSession[];
  onDeleteSession: (id: string) => void;
}

// The chosen day, workout by workout and set by set.
function DayColumn({ date, sessions, onDeleteSession }: DayColumnProps) {
  return (
    <section aria-labelledby="day-heading" className="grid gap-6 content-start">
      <h3 id="day-heading" className="text-2xl text-ink">
        {formatDisplayDate(date)}
      </h3>
      {sessions.length === 0 ? (
        <p className="text-base text-ink-muted">No workout logged on this day.</p>
      ) : (
        sessions.map(session => <SessionRecord key={session.id} session={session} onDelete={() => onDeleteSession(session.id)} />)
      )}
    </section>
  );
}

function SessionRecord({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const exercises = session.exercises.filter(ex => ex.sets.some(s => s.completed));
  return (
    <article className="grid gap-4">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <RouteMarker split={session.splitType} />
        <span className="font-display text-lg font-semibold uppercase tracking-[0.04em] text-ink">{session.splitType}</span>
        <span className="ml-auto flex items-baseline gap-4">
          <span className="flex items-baseline gap-1.5">
            <Flaps text={String(session.durationMinutes)} cells={3} label={`${session.durationMinutes} minutes`} className="text-xl" />
            <span className="section-label">min</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <Flaps text={session.totalVolumeKg.toLocaleString('en-US')} cells={6} label={`${session.totalVolumeKg} kg`} className="text-xl" />
            <span className="section-label">kg</span>
          </span>
        </span>
        <button onClick={onDelete} title="Delete this workout" aria-label="Delete this workout" className="icon-btn hover:text-bad-ink">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <ol className="grid gap-3">
        {exercises.map(ex => (
          <li key={ex.exerciseId} className="grid gap-1.5">
            <span className="font-display text-lg font-semibold uppercase tracking-[0.04em] text-ink">{ex.exerciseName}</span>
            <span className="flex flex-wrap gap-1.5">
              {ex.sets
                .filter(s => s.completed)
                .map(s => (
                  <span key={s.setNumber} className="flex items-center gap-2.5 h-tap-lg px-3 rounded-control border border-line bg-inset font-mono text-lg text-ink-muted">
                    <span className="text-sm text-ink-faint">{s.setNumber}</span>
                    {s.weightKg} × {formatReps(s)}
                  </span>
                ))}
            </span>
            {ex.notes && <span className="text-sm text-ink-muted">{ex.notes}</span>}
          </li>
        ))}
      </ol>
      {session.notes && <p className="text-base text-ink-soft border-t border-line pt-3">{session.notes}</p>}
    </article>
  );
}

function Figure({ label, value, cells, unit }: { label: string; value: string; cells: number; unit?: string }) {
  return (
    <div className="grid gap-2">
      <span className="section-label">{label}</span>
      <span className="flex items-baseline gap-2">
        <Flaps text={value} cells={cells} label={`${value}${unit ? ` ${unit}` : ''}`} className="text-[2.25rem]" />
        <span className={`section-label ${unit ? '' : 'invisible'}`}>{unit ?? 'x'}</span>
      </span>
    </div>
  );
}

function monthOf(date: string): Date {
  const [year, month] = date.split('-').map(Number);
  return new Date(year!, month! - 1, 1);
}

function groupByDate(sessions: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>();
  for (const session of sessions) map.set(session.date, [...(map.get(session.date) ?? []), session]);
  return map;
}
