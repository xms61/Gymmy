import type { ExerciseDefinition, ProgressRecommendation, WorkoutSession, SetLog } from '../types/workout.ts';

export class OverloadEngine {
  /**
   * Generates progressive overload recommendation based on historical performance
   */
  static getRecommendation(
    exercise: ExerciseDefinition,
    history: WorkoutSession[]
  ): ProgressRecommendation {
    // Find all completed sessions that contain this exercise, sorted newest first
    const relevantSessions = history
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pastExerciseLogs: { date: string; sets: SetLog[] }[] = [];
    for (const session of relevantSessions) {
      const match = session.exercises.find(e => e.exerciseId === exercise.id || e.exerciseName.toLowerCase() === exercise.name.toLowerCase());
      if (match && match.sets && match.sets.length > 0) {
        pastExerciseLogs.push({ date: session.date, sets: match.sets.filter(s => s.completed && s.repsCompleted > 0) });
      }
    }

    // Default fallback if no history exists yet
    if (pastExerciseLogs.length === 0) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'maintain',
        currentWeightKg: exercise.defaultWeightKg,
        recommendedWeightKg: exercise.defaultWeightKg,
        recommendedRepRange: `${exercise.targetRepsMin}-${exercise.targetRepsMax}`,
        reason: 'Baseline starting session. Focus on clean technique through the target rep range.',
        lastRepsSummary: 'No previous logs',
        nextStepGoal: `Complete ${exercise.targetSets} sets of ${exercise.targetRepsMin}–${exercise.targetRepsMax} reps at ${exercise.defaultWeightKg} kg.`
      };
    }

    const lastLog = pastExerciseLogs[0];
    const workingSets = lastLog.sets;
    const repsSummary = workingSets.map(s => s.repsCompleted).join(' / ');
    const lastWeight = workingSets[0]?.weightKg ?? exercise.defaultWeightKg;
    const { targetRepsMin, targetRepsMax } = exercise;

    // Weight increment standard based on equipment
    const increment = exercise.equipment === 'dumbbell' ? 2 : 2.5;

    // Condition 1: Check if all sets hit or exceed the top of the rep range
    const allHitMax = workingSets.length >= exercise.targetSets && workingSets.every(s => s.repsCompleted >= targetRepsMax);
    if (allHitMax) {
      const newWeight = lastWeight + increment;
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'increase_load',
        currentWeightKg: lastWeight,
        recommendedWeightKg: newWeight,
        recommendedRepRange: `${targetRepsMin}–${targetRepsMax}`,
        reason: `Target ceiling (${targetRepsMax} reps) reached across all ${workingSets.length} sets! Overload unlocked: +${increment} kg.`,
        lastRepsSummary: repsSummary,
        nextStepGoal: `Increase load to ${newWeight} kg and aim for at least ${targetRepsMin} reps on all sets.`
      };
    }

    // Condition 2: Set 1 hit top of range, but later sets fatigued
    const firstSetHitMax = workingSets[0]?.repsCompleted >= targetRepsMax;
    if (firstSetHitMax) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'progress_reps',
        currentWeightKg: lastWeight,
        recommendedWeightKg: lastWeight,
        recommendedRepRange: `${targetRepsMin}–${targetRepsMax}`,
        reason: `First set achieved ${workingSets[0].repsCompleted} reps, but subsequent sets dropped (${repsSummary}). Hold load to build muscular endurance.`,
        lastRepsSummary: repsSummary,
        nextStepGoal: `Maintain ${lastWeight} kg. Push later sets closer to ${targetRepsMax} reps before increasing weight.`
      };
    }

    // Condition 3: Check for stagnation or failure below targetRepsMin over consecutive sessions
    const recentSubMinCount = pastExerciseLogs.slice(0, 2).filter(log => {
      const avgReps = log.sets.reduce((sum, s) => sum + s.repsCompleted, 0) / (log.sets.length || 1);
      return avgReps < targetRepsMin;
    }).length;

    if (recentSubMinCount >= 2 && lastWeight > 15) {
      // 10% deload rounded to nearest 2.5kg
      const deloadWeight = Math.max(exercise.equipment === 'barbell' ? 20 : 5, Math.round((lastWeight * 0.9) / 2.5) * 2.5);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'deload',
        currentWeightKg: lastWeight,
        recommendedWeightKg: deloadWeight,
        recommendedRepRange: `${targetRepsMin}–${targetRepsMax}`,
        reason: `Performance has fallen below ${targetRepsMin} reps for 2 consecutive sessions. Recommended 10% deload to dissipate fatigue and reset progression.`,
        lastRepsSummary: repsSummary,
        nextStepGoal: `Reset to ${deloadWeight} kg for 1 week. Emphasize explosive power and strict form.`
      };
    }

    // Condition 4: Within rep range, normal rep double-progression
    const totalReps = workingSets.reduce((acc, s) => acc + s.repsCompleted, 0);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      status: 'progress_reps',
      currentWeightKg: lastWeight,
      recommendedWeightKg: lastWeight,
      recommendedRepRange: `${targetRepsMin}–${targetRepsMax}`,
      reason: `Solid training in target window (${repsSummary}). Double progression dictates adding reps before adding weight.`,
      lastRepsSummary: repsSummary,
      nextStepGoal: `Maintain ${lastWeight} kg. Goal: Hit at least ${totalReps + 2} total reps across all sets today.`
    };
  }

  /**
   * Estimates 1 Rep Max using Brzycki formula
   */
  static estimate1RM(weightKg: number, reps: number): number {
    if (reps <= 0) return 0;
    if (reps === 1) return weightKg;
    if (reps >= 37) return Math.round(weightKg * 1.5);
    return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
  }

  /**
   * Calculates plate configuration for an Olympic barbell (20 kg base)
   */
  static calculatePlates(targetWeightKg: number, barWeightKg = 20): { [plate: number]: number } {
    if (targetWeightKg <= barWeightKg) return {};
    let weightPerSide = (targetWeightKg - barWeightKg) / 2;
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const platesUsed: { [plate: number]: number } = {};

    for (const plate of availablePlates) {
      if (weightPerSide >= plate) {
        const count = Math.floor(weightPerSide / plate);
        platesUsed[plate] = count;
        weightPerSide -= count * plate;
      }
    }

    return platesUsed;
  }
}
