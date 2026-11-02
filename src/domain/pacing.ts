import type { ItemProgress } from './types';

/**
 * How new lessons are paced. German words rarely build on each other the way WaniKani's
 * radicals and kanji do, so levels can't release lessons gradually on their own. Instead
 * lessons arrive as a steady daily drip in curriculum order, flowing across level boundaries,
 * and pause while too many words sit in the early stages.
 */

/** New items a learner can start per local calendar day. */
export const DAILY_NEW_ITEMS = 5;

/** Lessons pause while this many items are in stages 1–4. */
export const EARLY_STAGE_LIMIT = 40;

export type LessonPause = 'daily' | 'busy' | 'empty' | null;

export interface LessonAllowance {
  /** Lessons that can be started right now. */
  available: number;
  /** Items unlocked and waiting, whether or not they can be started today. */
  waiting: number;
  startedToday: number;
  earlyStage: number;
  /** Why no lessons are available, or null when some are. */
  pause: LessonPause;
}

/** Local calendar day, YYYY-MM-DD. */
export function localDay(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function lessonAllowance(rows: readonly ItemProgress[], now: number): LessonAllowance {
  const today = localDay(now);
  const waiting = rows.filter((r) => r.stage === 0).length;
  const startedToday = rows.filter((r) => r.startedAt !== undefined && localDay(r.startedAt) === today).length;
  const earlyStage = rows.filter((r) => r.stage >= 1 && r.stage <= 4).length;

  const leftToday = Math.max(0, DAILY_NEW_ITEMS - startedToday);
  const room = Math.max(0, EARLY_STAGE_LIMIT - earlyStage);
  const available = Math.min(waiting, leftToday, room);

  let pause: LessonPause = null;
  if (available === 0) pause = waiting === 0 ? 'empty' : room === 0 ? 'busy' : 'daily';
  return { available, waiting, startedToday, earlyStage, pause };
}
