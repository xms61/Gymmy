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
import { askToConfirm } from './components/ui/ConfirmHost.tsx';

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

  // 1, 2 and 3 switch tabs, and s starts the next workout in the rotation.
  useEffect(() => {
    if (activeWorkoutType) return;
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

  const handleStartWorkout = async (type: SplitType) => {
    if (draft && !(await askToConfirm(`Discard the unfinished ${draft.workoutType} workout and start a new ${type} workout?`, 'Discard and start'))) {
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

  const handleDiscardDraft = async () => {
    if (await askToConfirm('Discard the unfinished workout? Its sets will not be saved.', 'Discard')) discardDraft();
  };

  const handleFinishWorkout = () => {
    setDraft(null);
    setResumeFrom(null);
    setActiveWorkoutType(null);
    setActiveTab('calendar');
  };

  const handleLeaveWorkout = async () => {
    if (await askToConfirm('Leave this workout? Its sets will not be saved.', 'Leave')) {
      discardDraft();
      setActiveWorkoutType(null);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (await askToConfirm('Delete this workout session?', 'Delete')) {
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
      <header className="sticky top-0 z-30 bg-accent text-on-accent">
        <div className="max-w-[90rem] mx-auto h-16 px-6 flex items-center gap-8">
          <h1 className="flex items-center gap-2.5 text-3xl leading-none">
            <Dumbbell className="w-7 h-7" />
            Gymmy
          </h1>

          <nav aria-label="Screens" className="flex items-stretch self-stretch">
            {NAV_TABS.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                title={`${label} (${index + 1})`}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`flex items-center gap-2 px-5 font-display text-lg font-semibold uppercase tracking-[0.06em] transition-colors ${
                  activeTab === id ? 'bg-on-accent text-accent' : 'hover:bg-on-accent/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 h-10 px-3 rounded-control font-display text-base font-semibold uppercase tracking-[0.06em] hover:bg-on-accent/10 transition-colors"
              title={describeSyncStatus(syncStatus)}
            >
              <Database className="w-4 h-4" />
              {syncLabel(syncStatus)}
              {needsAttention(syncStatus) && <span className="w-2 h-2 rounded-pill bg-on-accent" aria-label="needs attention" />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="h-10 w-10 grid place-items-center rounded-control hover:bg-on-accent/10 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
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

