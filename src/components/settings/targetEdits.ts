import type { ExerciseDefinition } from '../../types/workout.ts';

// The fields Settings edits. Edits are tracked per exercise id, so the stored list can change or reorder
// under an open Settings screen (a sync, another tab) without the table going stale.
export const TARGET_FIELD_NAMES = ['targetSets', 'targetRepsMin', 'targetRepsMax'] as const;
export type TargetField = (typeof TARGET_FIELD_NAMES)[number];

// The table after the stored targets moved from `previous` to `next`: a field the user changed keeps their
// value, and every other field takes the new stored one. Without this, saving would write the old values
// back over the newer ones.
export function rebaseTargetEdits(
  previous: ExerciseDefinition[],
  next: ExerciseDefinition[],
  edited: ExerciseDefinition[]
): ExerciseDefinition[] {
  return next.map(stored => {
    const before = previous.find(ex => ex.id === stored.id);
    const mine = edited.find(ex => ex.id === stored.id);
    if (!before || !mine) return stored;
    const rebased = { ...stored };
    for (const field of TARGET_FIELD_NAMES) {
      if (mine[field] !== before[field]) rebased[field] = mine[field];
    }
    return rebased;
  });
}

export function hasUnsavedTargets(edited: ExerciseDefinition[], stored: ExerciseDefinition[]): boolean {
  return edited.some(ex => {
    const saved = stored.find(candidate => candidate.id === ex.id);
    return !saved || TARGET_FIELD_NAMES.some(field => ex[field] !== saved[field]);
  });
}
