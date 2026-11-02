import { FINAL_STAGE, nextReviewAt, nextStage } from '../domain/scheduler';
import type { CompletedItem } from '../domain/review-session';
import type { Curriculum, ItemProgress } from '../domain/types';
import { localDay } from '../domain/pacing';
import { canLevelUp, itemsToUnlock } from '../domain/unlock';
import type { GipfelDb } from './db';

export interface Streak {
  count: number;
  /** Local calendar day, YYYY-MM-DD. */
  lastDay: string;
}

export interface Settings {
  lessonBatchSize: number;
  autoplayAudio: boolean;
}

export const DEFAULT_SETTINGS: Settings = { lessonBatchSize: 5, autoplayAudio: true };

export { localDay };

function previousDay(ms: number): string {
  const d = new Date(ms);
  d.setDate(d.getDate() - 1);
  return localDay(d.getTime());
}

/** The streak as it stands today: it only survives if the last activity was today or yesterday. */
export function currentStreak(streak: Streak | undefined, now: number): number {
  if (!streak) return 0;
  return streak.lastDay === localDay(now) || streak.lastDay === previousDay(now) ? streak.count : 0;
}

export function makeRepo(db: GipfelDb, curriculum: Curriculum) {
  const maxLevel = Math.max(...curriculum.levels.map((l) => l.number));

  async function getMeta<T>(key: string, fallback: T): Promise<T> {
    const row = await db.meta.get(key);
    return row === undefined ? fallback : (row.value as T);
  }

  const setMeta = (key: string, value: unknown) => db.meta.put({ key, value });

  /** Unlock whatever is now unlockable and complete levels as far as progress allows. */
  async function syncUnlocks(now: number): Promise<void> {
    let level = await getMeta('currentLevel', 1);
    for (;;) {
      const rows = await db.progress.toArray();
      const progress = new Map(rows.map((r) => [r.itemId, r]));
      const ids = itemsToUnlock(curriculum.items, progress);
      if (ids.length > 0) {
        await db.progress.bulkAdd(
          ids.map((itemId): ItemProgress => ({ itemId, stage: 0, unlockedAt: now, nextReviewAt: null, correctCount: 0, wrongCount: 0 })),
        );
        continue;
      }
      if (level < maxLevel && canLevelUp(curriculum.items, progress, level)) {
        level += 1;
        await setMeta('currentLevel', level);
        continue;
      }
      return;
    }
  }

  async function recordActivity(now: number): Promise<void> {
    const streak = await getMeta<Streak | undefined>('streak', undefined);
    const today = localDay(now);
    if (streak?.lastDay === today) return;
    const count = streak?.lastDay === previousDay(now) ? streak.count + 1 : 1;
    await setMeta('streak', { count, lastDay: today } satisfies Streak);
  }

  const tables = () => [db.progress, db.reviews, db.meta];

  return {
    getMeta,

    async init(now: number): Promise<void> {
      await db.transaction('rw', tables(), async () => {
        if ((await db.meta.get('currentLevel')) === undefined) await setMeta('currentLevel', 1);
        await setMeta('contentVersion', curriculum.contentVersion);
        await syncUnlocks(now);
      });
    },

    /** Lessons passed: items enter stage 1. */
    async finishLessons(itemIds: string[], now: number): Promise<void> {
      await db.transaction('rw', tables(), async () => {
        for (const itemId of itemIds) {
          await db.progress.update(itemId, { stage: 1, startedAt: now, nextReviewAt: nextReviewAt(1, now) });
        }
        await recordActivity(now);
      });
    },

    /** Save finished review items. Returns the level before and after, to celebrate a level-up. */
    async recordReviews(items: CompletedItem[], now: number): Promise<{ levelBefore: number; levelAfter: number }> {
      return db.transaction('rw', tables(), async () => {
        const levelBefore = await getMeta('currentLevel', 1);
        for (const result of items) {
          const p = await db.progress.get(result.itemId);
          if (!p || p.stage === 0 || p.stage === FINAL_STAGE) continue;
          const to = nextStage(p.stage, result.wasWrong);
          await db.progress.put({
            ...p,
            stage: to,
            nextReviewAt: nextReviewAt(to, now),
            finishedAt: to === FINAL_STAGE ? now : p.finishedAt,
            correctCount: p.correctCount + (result.wasWrong ? 0 : 1),
            wrongCount: p.wrongCount + (result.wasWrong ? 1 : 0),
          });
          await db.reviews.add({
            itemId: result.itemId,
            at: now,
            meaningWrong: result.meaningWrong,
            germanWrong: result.germanWrong,
            fromStage: p.stage,
            toStage: to,
          });
        }
        await syncUnlocks(now);
        if (items.length > 0) await recordActivity(now);
        return { levelBefore, levelAfter: await getMeta('currentLevel', 1) };
      });
    },

    /** Remember that a story has been opened, so the home screen can stop calling it new. */
    async markStoryRead(storyId: string): Promise<void> {
      await db.transaction('rw', [db.meta], async () => {
        const read = await getMeta<string[]>('storiesRead', []);
        if (!read.includes(storyId)) await setMeta('storiesRead', [...read, storyId]);
      });
    },

    async getSettings(): Promise<Settings> {
      return { ...DEFAULT_SETTINGS, ...(await getMeta<Partial<Settings>>('settings', {})) };
    },

    async saveSettings(settings: Settings): Promise<void> {
      await setMeta('settings', settings);
    },
  };
}

export type Repo = ReturnType<typeof makeRepo>;
