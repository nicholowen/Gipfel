import { GURU } from './scheduler';
import type { ContentItem, ItemProgress } from './types';

export const LEVEL_UP_SHARE = 0.9;

type ProgressById = ReadonlyMap<string, ItemProgress>;

const atGuru = (progress: ProgressById, id: string) => (progress.get(id)?.stage ?? 0) >= GURU;

/** Ids of items that should now move from locked into the lesson queue. */
export function itemsToUnlock(items: readonly ContentItem[], progress: ProgressById, currentLevel: number): string[] {
  return byCurriculumOrder(items)
    .filter((i) => i.level <= currentLevel && !progress.has(i.id))
    .filter((i) => i.prerequisites.every((p) => atGuru(progress, p)))
    .map((i) => i.id);
}

export function canLevelUp(items: readonly ContentItem[], progress: ProgressById, level: number): boolean {
  const levelItems = items.filter((i) => i.level === level);
  if (levelItems.length === 0) return false;
  const solid = levelItems.filter((i) => atGuru(progress, i.id)).length;
  return solid / levelItems.length >= LEVEL_UP_SHARE;
}

export function lessonQueue(items: readonly ContentItem[], progress: ProgressById): ContentItem[] {
  return byCurriculumOrder(items).filter((i) => progress.get(i.id)?.stage === 0);
}

function byCurriculumOrder(items: readonly ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => a.level - b.level || a.order - b.order);
}
