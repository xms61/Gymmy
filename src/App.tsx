import { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Flame,
  Database,
  type LucideIcon
} from 'lucide-react';
import type { SplitType, WorkoutDraft, WorkoutSession, ExerciseDefinition } from './types/workout.ts';
import { StorageService } from './services/storage.ts';
import { indexCompletedLogs } from './services/exerciseLogs.ts';
import type { SyncStatus } from './services/sync.ts';
import { HomeDashboard } from './components/dashboard/HomeDashboard.tsx';
import { WorkoutCalendar } from './components/calendar/WorkoutCalendar.tsx';
import { ProgressView } from './components/analytics/ProgressView.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';
import { LiveTracker } from './components/tracker/LiveTracker.tsx';
import { ResumeWorkoutBanner } from './components/tracker/ResumeWorkoutBanner.tsx';
import { clearDraft, loadDraft } from './components/tracker/workoutDraft.ts';
import { describeSyncStatus, needsAttention, syncLabel } from './components/syncStatusText.ts';
import { isShortcutFree } from './components/keyboardShortcuts.ts';
import { nextSplit } from './services/rotation.ts';
import { useTheme } from './theme/ThemeProvider.tsx';

type AppTab = 'dashboard' | 'calendar' | 'analytics';

// Starting a workout waits this long at most for the first sync, so a slow or unreachable server
// never blocks training: after that the tracker uses the copy in this browser.
const FIRST_SYNC_WAIT_MS = 5000;

const NAV_TABS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Home', icon: Flame },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'analytics', label: 'Progress', icon: TrendingUp }
];

export function App() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [activeWorkoutType, setActiveWorkoutType] = useState<SplitType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => StorageService.getSyncStatus());
  // A workout left unfinished by a reload or a closed tab, offered for resuming.
  const [draft, setDraft] = useState<WorkoutDraft | null>(() => loadDraft());
  const [resumeFrom, setResumeFrom] = useState<WorkoutDraft | null>(null);
  // The tracker's targets come from history, so a workout starts only after the first sync.
  const [isFirstSyncDone, setIsFirstSyncDone] = useState(false);

  const logIndex = useMemo(() => indexCompletedLogs(sessions, exercises), [sessions, exercises]);
  const { theme } = useTheme();

  // Themes with a command line: 1, 2 and 3 switch tabs, and s starts the next workout in the rotation.
  useEffect(() => {
    if (!theme.traits.commandLine || activeWorkoutType) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isShortcutFree(event)) return;
      const tab = NAV_TABS[Number(event.key) - 1];
      if (tab) setActiveTab(tab.id);
      else if (event.key === 's' && isFirstSyncDone) handleStartWorkout(nextSplit(sessions));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const refreshData = () => {
    setSessions(StorageService.getSessions());
    setExercises(StorageService.getExerciseDefinitions());
    setSyncStatus(StorageService.getSyncStatus());
  };

  // Shows the local copy at once, then whatever the server sync changes.
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(refreshData);
    refreshData();
    const waitLimit = new Promise(resolve => setTimeout(resolve, FIRST_SYNC_WAIT_MS));
    void Promise.race([StorageService.init(), waitLimit]).then(() => setIsFirstSyncDone(true));
    return unsubscribe;
  }, []);

  const discardDraft = () => {
    clearDraft();
    setDraft(null);
    setResumeFrom(null);
  };

  const handleStartWorkout = (type: SplitType) => {
    if (draft && !window.confirm(`Discard the unfinished ${draft.workoutType} workout and start a new ${type} workout?`)) {
      return;
    }
    discardDraft();
    setActiveWorkoutType(type);
  };

  const handleResumeWorkout = () => {
    if (!draft) return;
    setResumeFrom(draft);
    setActiveWorkoutType(draft.workoutType);
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Discard the unfinished workout? Its sets will not be saved.')) discardDraft();
  };

  const handleFinishWorkout = () => {
    setDraft(null);
    setResumeFrom(null);
    setActiveWorkoutType(null);
    setActiveTab('calendar');
  };

  const handleLeaveWorkout = () => {
    if (window.confirm('Leave this workout? Its sets will not be saved.')) {
      discardDraft();
      setActiveWorkoutType(null);
    }
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Delete this workout session?')) {
      StorageService.deleteSession(id);
    }
  };

  // If in an active workout, show full LiveTracker
  if (activeWorkoutType) {
    return (
      <LiveTracker
        workoutType={activeWorkoutType}
        sessions={sessions}
        exercises={exercises}
        resumeFrom={resumeFrom}
        onFinish={handleFinishWorkout}
        onCancel={handleLeaveWorkout}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-line px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-panel bg-gradient-to-tr from-accent to-accent-ink flex items-center justify-center shadow-lg shadow-accent/30">
              <Dumbbell className="w-5 h-5 text-on-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-ink tracking-tight flex items-center space-x-1">
                <span>Gymmy</span>
                <span className="w-2 h-2 rounded-pill bg-good-ink animate-pulse" />
              </h1>
              <span className="text-[11px] text-ink-muted font-medium">Fundamentals Tracker</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-control bg-surface border border-line text-[11px] text-ink-soft hover:border-edge transition"
              title={describeSyncStatus(syncStatus)}
            >
              <Database className="w-3.5 h-3.5 text-accent-ink" />
              <span className="hidden sm:inline font-medium">{syncLabel(syncStatus)}</span>
              <span className={`w-1.5 h-1.5 rounded-pill ${needsAttention(syncStatus) ? 'bg-warn-ink' : 'bg-good-ink'}`} />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-ink-muted hover:text-ink rounded-panel bg-surface border border-line hover:border-edge transition"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-28">
        {draft && <ResumeWorkoutBanner draft={draft} onResume={handleResumeWorkout} onDiscard={handleDiscardDraft} />}

        {activeTab === 'dashboard' && (
          <HomeDashboard
            sessions={sessions}
            exercises={exercises}
            logIndex={logIndex}
            onStartWorkout={handleStartWorkout}
            canStart={isFirstSyncDone}
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
          <ProgressView exercises={exercises} logIndex={logIndex} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-inset/95 backdrop-blur-md border-t border-line py-2 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {NAV_TABS.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-control transition ${
                activeTab === id ? 'text-accent-ink font-bold' : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              <Icon className="nav-icon w-5 h-5" />
              <span className="text-[11px]">
                <span className="nav-key hidden">[{index + 1}]</span>
                {label}
              </span>
            </button>
          ))}
          <span className="nav-status hidden text-[11px] text-ink-muted">
            sqlite:{syncStatus.connected ? 'ok' : 'offline'} pending:{syncStatus.pendingChanges}
          </span>
        </div>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          exercises={exercises}
          onClose={() => setIsSettingsOpen(false)}
          onRefreshData={refreshData}
          syncStatus={syncStatus}
        />
      )}
    </div>
  );
}

