import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Flame, 
  Award 
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { SplitType, WorkoutSession } from '../../types/workout.ts';
import { DayDetailModal } from './DayDetailModal.tsx';
import { toLocalDateString, getTodayDateString } from '../../utils/date.ts';
import { SPLIT_STYLE } from '../ui/badges.tsx';

const LEGEND_SPLITS: SplitType[] = ['Push', 'Pull', 'Legs'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WorkoutCalendarProps {
  sessions: WorkoutSession[];
  onDeleteSession: (id: string) => void;
}

export const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  sessions,
  onDeleteSession
}) => {
  // Calendar viewed month and year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Group sessions by date YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map: { [date: string]: WorkoutSession[] } = {};
    for (const session of sessions) {
      if (!session.completed) continue;
      const d = session.date;
      if (!map[d]) map[d] = [];
      map[d].push(session);
    }
    return map;
  }, [sessions]);

  // Generate calendar grid days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Days array
  const calendarDays = useMemo(() => {
    const days: Array<{
      dayNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
      sessions: WorkoutSession[];
    }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const str = toLocalDateString(prevDate);
      days.push({
        dayNumber: d,
        dateString: str,
        isCurrentMonth: false,
        sessions: sessionsByDate[str] || []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const str = toLocalDateString(date);
      days.push({
        dayNumber: d,
        dateString: str,
        isCurrentMonth: true,
        sessions: sessionsByDate[str] || []
      });
    }

    // Next month padding to fill standard 35 or 42 grid cells
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const str = toLocalDateString(nextDate);
      days.push({
        dayNumber: d,
        dateString: str,
        isCurrentMonth: false,
        sessions: sessionsByDate[str] || []
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayIndex, sessionsByDate]);

  // Calculate monthly stats
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = getTodayDateString();

  const workoutsThisMonth = useMemo(() => {
    return sessions.filter(s => {
      if (!s.completed) return false;
      const [sYear, sMonth] = s.date.split('-');
      return parseInt(sYear) === year && parseInt(sMonth) === month + 1;
    });
  }, [sessions, year, month]);

  const totalVolumeThisMonth = workoutsThisMonth.reduce((acc, s) => acc + s.totalVolumeKg, 0);

  const selectedDaySessions = selectedDayString ? sessionsByDate[selectedDayString] || [] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <MonthStat icon={CalendarIcon} iconClass="bg-accent-ink/10 text-accent-ink" label="Workouts">
          {workoutsThisMonth.length}
        </MonthStat>
        <MonthStat icon={Flame} iconClass="bg-good-ink/10 text-good-ink" label="Active Streak">
          {sessions.filter(s => s.completed).length > 0 ? 'Consistent' : '0 days'}
        </MonthStat>
        <MonthStat icon={Award} iconClass="bg-legs/10 text-legs" label="Month Volume">
          {Math.round(totalVolumeThisMonth / 1000)}k <span className="text-xs font-normal text-ink-muted">kg</span>
        </MonthStat>
      </div>

      <div className="card p-5 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-ink tracking-tight">{monthName}</h2>
            <button onClick={jumpToToday} className="btn btn-secondary px-2.5 py-1 text-xs font-semibold text-accent-ink rounded-chip">
              Today
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button onClick={prevMonth} className="icon-btn" title="Previous month">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="icon-btn" title="Next month">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4 text-xs font-semibold text-ink-muted border-b border-line pb-3">
          {LEGEND_SPLITS.map(split => (
            <span key={split} className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-pill inline-block ${SPLIT_STYLE[split].fill}`} />
              <span>{split}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center section-label text-ink-faint mb-2">
          {WEEKDAYS.map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, idx) => {
            const isToday = day.dateString === todayStr;
            const hasWorkout = day.sessions.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayString(day.dateString)}
                className={`min-h-[64px] md:min-h-[76px] p-2 rounded-panel flex flex-col items-center justify-between border transition-all text-left relative active:scale-95 ${
                  day.isCurrentMonth ? 'text-ink-soft' : 'text-ink-faint bg-inset/30 border-transparent'
                } ${
                  isToday
                    ? 'border-accent-ink bg-accent-ink/5 font-bold'
                    : hasWorkout
                    ? 'bg-inset border-line hover:border-edge'
                    : 'bg-inset/60 border-line/50 hover:border-edge'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isToday ? 'text-accent-ink' : ''}`}>
                    {day.dayNumber}
                  </span>
                  {hasWorkout && (
                    <span className="text-[10px] text-ink-faint font-mono hidden md:inline">
                      {day.sessions.length}
                    </span>
                  )}
                </div>

                <div className="w-full flex flex-wrap gap-1 justify-center mt-1">
                  {day.sessions.map((s, sIdx) => (
                    <span
                      key={sIdx}
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-chip ${SPLIT_STYLE[s.splitType].fill} shadow-sm truncate max-w-full`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Modal */}
      {selectedDayString && (
        <DayDetailModal
          dateString={selectedDayString}
          sessions={selectedDaySessions}
          onClose={() => setSelectedDayString(null)}
          onDeleteSession={id => {
            onDeleteSession(id);
            setSelectedDayString(null);
          }}
        />
      )}
    </div>
  );
};

interface MonthStatProps {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  children: ReactNode;
}

function MonthStat({ icon: Icon, iconClass, label, children }: MonthStatProps) {
  return (
    <div className="card rounded-panel p-4 flex items-center space-x-3">
      <div className={`p-3 rounded-control ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-ink-muted font-semibold">{label}</div>
        <div className="text-xl font-bold text-ink font-mono">{children}</div>
      </div>
    </div>
  );
}
