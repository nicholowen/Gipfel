import { KNOWN_STAGE } from './scheduler';
import type { ContentItem, ItemProgress } from './types';

export const LEVEL_UP_SHARE = 0.9;

type ProgressById = ReadonlyMap<string, ItemProgress>;

const known = (progress: ProgressById, id: string) => (progress.get(id)?.stage ?? 0) >= KNOWN_STAGE;

/**
 * Ids of items that should now move from locked into the lesson queue: everything whose
 * prerequisites are known, in any level. Levels are chapters, not locks; the daily
 * allowance in pacing.ts decides how fast the queue is worked through.
 */
export function itemsToUnlock(items: readonly ContentItem[], progress: ProgressById): string[] {
  return byCurriculumOrder(items)
    .filter((i) => !progress.has(i.id))
    .filter((i) => i.prerequisites.every((p) => known(progress, p)))
    .map((i) => i.id);
}

/** A level is complete (a milestone, not a gate) once 90% of its items reach the known stage. */
export function canLevelUp(items: readonly ContentItem[], progress: ProgressById, level: number): boolean {
  const levelItems = items.filter((i) => i.level === level);
  if (levelItems.length === 0) return false;
  const solid = levelItems.filter((i) => known(progress, i.id)).length;
  return solid / levelItems.length >= LEVEL_UP_SHARE;
}

export function lessonQueue(items: readonly ContentItem[], progress: ProgressById): ContentItem[] {
  return byCurriculumOrder(items).filter((i) => progress.get(i.id)?.stage === 0);
}

function byCurriculumOrder(items: readonly ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => a.level - b.level || a.order - b.order);
}
