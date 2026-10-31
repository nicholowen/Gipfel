import type { Stage } from './types';

export const GURU: Stage = 5;
export const BURNED: Stage = 9;

/** Hours to wait after reaching each stage (index = stage). */
const WAIT_HOURS = [0, 4, 8, 24, 48, 168, 336, 720, 2880] as const;

const HOUR_MS = 60 * 60 * 1000;

export function nextStage(stage: Stage, wasWrong: boolean): Stage {
  if (!wasWrong) return Math.min(BURNED, stage + 1) as Stage;
  const penalty = stage >= GURU ? 2 : 1;
  return Math.max(1, stage - penalty) as Stage;
}

/** When an item at `stage` is next due; null for the lesson queue and burned items. */
export function nextReviewAt(stage: Stage, now: number): number | null {
  if (stage === 0 || stage === BURNED) return null;
  const due = now + WAIT_HOURS[stage] * HOUR_MS;
  return Math.floor(due / HOUR_MS) * HOUR_MS;
}

export type StageGroup = 'lesson' | 'apprentice' | 'guru' | 'master' | 'enlightened' | 'burned';

export function stageGroup(stage: Stage): StageGroup {
  if (stage === 0) return 'lesson';
  if (stage <= 4) return 'apprentice';
  if (stage <= 6) return 'guru';
  if (stage === 7) return 'master';
  if (stage === 8) return 'enlightened';
  return 'burned';
}
