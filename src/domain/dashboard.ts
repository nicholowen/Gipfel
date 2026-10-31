import { GURU, stageGroup, type StageGroup } from './scheduler';
import type { ContentItem, ItemProgress } from './types';
import { LEVEL_UP_SHARE } from './unlock';

export const APPRENTICE_WARNING = 100;

export interface Summary {
  lessonsAvailable: number;
  reviewsDue: number;
  nextReviewAt: number | null;
  /** 24 hourly buckets starting at the current hour: items that become due in that hour. */
  forecast: { hourStart: number; count: number }[];
  groups: Record<Exclude<StageGroup, 'lesson'>, number>;
  level: { number: number; total: number; atGuru: number; needed: number };
  apprenticeWarning: boolean;
}

const HOUR = 3600_000;

export function summarise(rows: ItemProgress[], items: readonly ContentItem[], level: number, now: number): Summary {
  const inReview = rows.filter((r) => r.nextReviewAt !== null);
  const upcoming = inReview.map((r) => r.nextReviewAt!).filter((t) => t > now);

  const thisHour = Math.floor(now / HOUR) * HOUR;
  const forecast = Array.from({ length: 24 }, (_, i) => {
    const hourStart = thisHour + i * HOUR;
    const count = upcoming.filter((t) => t >= Math.max(hourStart, now + 1) && t < hourStart + HOUR).length;
    return { hourStart, count };
  });

  const groups = { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 };
  for (const r of rows) {
    const g = stageGroup(r.stage);
    if (g !== 'lesson') groups[g] += 1;
  }

  const levelItems = items.filter((i) => i.level === level);
  const stageById = new Map(rows.map((r) => [r.itemId, r.stage]));
  const atGuru = levelItems.filter((i) => (stageById.get(i.id) ?? 0) >= GURU).length;

  return {
    lessonsAvailable: rows.filter((r) => r.stage === 0).length,
    reviewsDue: inReview.filter((r) => r.nextReviewAt! <= now).length,
    nextReviewAt: upcoming.length > 0 ? Math.min(...upcoming) : null,
    forecast,
    groups,
    level: { number: level, total: levelItems.length, atGuru, needed: Math.ceil(levelItems.length * LEVEL_UP_SHARE) },
    apprenticeWarning: groups.apprentice > APPRENTICE_WARNING,
  };
}
