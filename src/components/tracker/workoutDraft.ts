// Keeps the workout in progress in localStorage, so a reload or a closed tab can resume it.
import type { WorkoutDraft } from '../../types/workout.ts';
import { parseWorkoutDraft } from '../../validation.ts';

const DRAFT_KEY = 'gymmy_workout_draft_v1';

export function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const parsed = parseWorkoutDraft(JSON.parse(raw));
    if (parsed.ok) return parsed.value;
    console.warn('[WorkoutDraft] Ignoring an unreadable workout draft:', parsed.error);
  } catch (err) {
    console.warn('[WorkoutDraft] Ignoring an unreadable workout draft:', err);
  }
  return null;
}

export function saveDraft(draft: WorkoutDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('[WorkoutDraft] Could not save the workout in progress:', err);
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error('[WorkoutDraft] Could not clear the workout draft:', err);
  }
}
