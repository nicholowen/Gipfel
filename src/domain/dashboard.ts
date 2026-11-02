import { lessonAllowance, type LessonPause } from './pacing';
import { KNOWN_STAGE, stageGroup, type StageGroup } from './scheduler';
import type { ContentItem, ItemProgress } from './types';
import { LEVEL_UP_SHARE } from './unlock';

export interface Summary {
  /** Lessons that can be started now, after the daily allowance and early-stage limit. */
  lessonsAvailable: number;
  /** Why no lessons can be started now, or null when some can. */
  lessonPause: LessonPause;
  reviewsDue: number;
  nextReviewAt: number | null;
  /** 24 hourly buckets starting at the current hour: items that become due in that hour. */
  forecast: { hourStart: number; count: number }[];
  groups: Record<Exclude<StageGroup, 'lesson'>, number>;
  /** Items at each of stages 1–4, which together make up the first group. */
  earlySteps: [number, number, number, number];
  level: { number: number; total: number; known: number; needed: number };
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

  const groups = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const earlySteps: [number, number, number, number] = [0, 0, 0, 0];
  for (const r of rows) {
    const g = stageGroup(r.stage);
    if (g !== 'lesson') groups[g] += 1;
    if (r.stage >= 1 && r.stage <= 4) earlySteps[r.stage - 1] += 1;
  }
  const allowance = lessonAllowance(rows, now);

  const levelItems = items.filter((i) => i.level === level);
  const stageById = new Map(rows.map((r) => [r.itemId, r.stage]));
  const known = levelItems.filter((i) => (stageById.get(i.id) ?? 0) >= KNOWN_STAGE).length;

  return {
    lessonsAvailable: allowance.available,
    lessonPause: allowance.pause,
    reviewsDue: inReview.filter((r) => r.nextReviewAt! <= now).length,
    nextReviewAt: upcoming.length > 0 ? Math.min(...upcoming) : null,
    forecast,
    groups,
    earlySteps,
    level: { number: level, total: levelItems.length, known, needed: Math.ceil(levelItems.length * LEVEL_UP_SHARE) },
  };
}
