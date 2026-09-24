import { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Flame,
  Database
} from 'lucide-react';
import type { SplitType, WorkoutSession, ExerciseDefinition } from './types/workout.ts';
import { StorageService } from './services/storage.ts';
import { HomeDashboard } from './components/dashboard/HomeDashboard.tsx';
import { WorkoutCalendar } from './components/calendar/WorkoutCalendar.tsx';
import { ProgressView } from './components/analytics/ProgressView.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';
import { LiveTracker } from './components/tracker/LiveTracker.tsx';

export function App() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'analytics'>('dashboard');
  const [activeWorkoutType, setActiveWorkoutType] = useState<SplitType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load state from Storage / Local Database
  const refreshData = () => {
    setSessions(StorageService.getSessions());
    setExercises(StorageService.getExerciseDefinitions());
  };

  useEffect(() => {
    StorageService.init().then(() => {
      refreshData();
    });
  }, []);

  const handleStartWorkout = (type: SplitType) => {
    setActiveWorkoutType(type);
  };

  const handleFinishWorkout = () => {
    setActiveWorkoutType(null);
    refreshData();
    setActiveTab('calendar');
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Delete this workout session?')) {
      StorageService.deleteSession(id);
      refreshData();
    }
  };

  // If in an active workout, show full LiveTracker
  if (activeWorkoutType) {
    return (
      <LiveTracker
        workoutType={activeWorkoutType}
        onFinish={handleFinishWorkout}
        onCancel={() => {
          if (window.confirm('Are you sure you want to exit the current workout?')) {
            setActiveWorkoutType(null);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-1">
                <span>Gymmy</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">Fundamentals Tracker</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 cursor-pointer hover:border-slate-700 transition"
              title="Data persisted locally in data/gymmy.db (SQLite) and IndexedDB"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline font-medium">SQLite DB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              title="Settings & Excel Sync"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-28">
        {activeTab === 'dashboard' && (
          <HomeDashboard
            sessions={sessions}
            exercises={exercises}
            onStartWorkout={handleStartWorkout}
            onNavigateToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <WorkoutCalendar
            sessions={sessions}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {activeTab === 'analytics' && (
          <ProgressView
            exercises={exercises}
            sessions={sessions}
          />
        )}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 py-2 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[11px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'calendar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[11px]">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'analytics' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[11px]">Progress</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          exercises={exercises}
          onClose={() => setIsSettingsOpen(false)}
          onRefreshData={refreshData}
        />
      )}
    </div>
  );
}

export default App;
