import type { Stage } from './types';

export const KNOWN_STAGE: Stage = 5;
export const FINAL_STAGE: Stage = 9;

/** Hours to wait after reaching each stage (index = stage). */
const WAIT_HOURS: readonly number[] = [0, 4, 8, 24, 48, 168, 336, 720, 2880];

const HOUR_MS = 60 * 60 * 1000;

export function nextStage(stage: Stage, wasWrong: boolean): Stage {
  if (!wasWrong) return Math.min(FINAL_STAGE, stage + 1) as Stage;
  const penalty = stage >= KNOWN_STAGE ? 2 : 1;
  return Math.max(1, stage - penalty) as Stage;
}

/** When an item at `stage` is next due; null for the lesson queue and items at the final stage. */
export function nextReviewAt(stage: Stage, now: number): number | null {
  if (stage === 0 || stage === FINAL_STAGE) return null;
  const due = now + WAIT_HOURS[stage] * HOUR_MS;
  return Math.floor(due / HOUR_MS) * HOUR_MS;
}

export type StageGroup = 'lesson' | 1 | 2 | 3 | 4 | 5;

export function stageGroup(stage: Stage): StageGroup {
  if (stage === 0) return 'lesson';
  if (stage <= 4) return 1;
  if (stage <= 6) return 2;
  if (stage === 7) return 3;
  if (stage === 8) return 4;
  return 5;
}
