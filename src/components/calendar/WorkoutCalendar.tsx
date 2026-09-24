import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Flame, 
  Award 
} from 'lucide-react';
import type { WorkoutSession } from '../../types/workout.ts';
import { DayDetailModal } from './DayDetailModal.tsx';
import { toLocalDateString, getTodayDateString } from '../../utils/date.ts';

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
      {/* Monthly Statistics Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Workouts</div>
            <div className="text-xl font-bold text-white font-mono">{workoutsThisMonth.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Active Streak</div>
            <div className="text-xl font-bold text-white font-mono">
              {sessions.filter(s => s.completed).length > 0 ? 'Consistent' : '0 days'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Month Volume</div>
            <div className="text-xl font-bold text-white font-mono">
              {Math.round(totalVolumeThisMonth / 1000)}k <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
        {/* Month Header and Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-white tracking-tight">{monthName}</h2>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-lg transition"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 mb-4 text-xs font-semibold text-slate-400 border-b border-slate-800/80 pb-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50" />
            <span>Push</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
            <span>Pull</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
            <span>Legs</span>
          </span>
        </div>

        {/* Day of Week Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, idx) => {
            const isToday = day.dateString === todayStr;
            const hasWorkout = day.sessions.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayString(day.dateString)}
                className={`min-h-[64px] md:min-h-[76px] p-2 rounded-2xl flex flex-col items-center justify-between border transition-all text-left relative active:scale-95 ${
                  day.isCurrentMonth ? 'text-slate-200' : 'text-slate-600 bg-slate-950/30 border-transparent'
                } ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-500/5 font-bold'
                    : hasWorkout
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* Day number */}
                <div className="w-full flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isToday ? 'text-indigo-400' : ''}`}>
                    {day.dayNumber}
                  </span>
                  {hasWorkout && (
                    <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                      {day.sessions.length}
                    </span>
                  )}
                </div>

                {/* Workout Type Badges */}
                <div className="w-full flex flex-wrap gap-1 justify-center mt-1">
                  {day.sessions.map((s, sIdx) => {
                    const bgClass =
                      s.splitType === 'Push'
                        ? 'bg-orange-500 text-slate-950'
                        : s.splitType === 'Pull'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-blue-500 text-slate-950';

                    return (
                      <span
                        key={sIdx}
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${bgClass} shadow-sm truncate max-w-full`}
                      >
                        {s.name}
                      </span>
                    );
                  })}
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
