import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { curriculum } from '../content/curriculum';
import { stories, storyTokens } from '../content/stories';
import { summarise } from '../domain/dashboard';
import { introDone, type OnboardingState } from '../domain/onboarding';
import { lessonAllowance, type LessonPause } from '../domain/pacing';
import { KNOWN_STAGE } from '../domain/scheduler';
import { coverage, STORY_UNLOCK, type Coverage, type Story } from '../domain/stories';
import type { Stage } from '../domain/types';
import { lessonQueue } from '../domain/unlock';
import { GipfelDb } from './db';
import { withReconnect } from './reconnect';
import { currentStreak, DEFAULT_SETTINGS, makeRepo, type Settings, type Streak } from './repo';

export const db = new GipfelDb();
const rawRepo = makeRepo(db, curriculum);

const retry = <T,>(work: () => Promise<T>) => withReconnect(db, work);

/** The repo, with every storage call given one reconnect-and-retry (see reconnect.ts). */
export const repo: typeof rawRepo = {
  getMeta: (key, fallback) => retry(() => rawRepo.getMeta(key, fallback)),
  init: (now) => retry(() => rawRepo.init(now)),
  finishLessons: (ids, now) => retry(() => rawRepo.finishLessons(ids, now)),
  recordReviews: (items, now) => retry(() => rawRepo.recordReviews(items, now)),
  markStoryRead: (id) => retry(() => rawRepo.markStoryRead(id)),
  completeIntro: (now) => retry(() => rawRepo.completeIntro(now)),
  resetIntro: () => retry(() => rawRepo.resetIntro()),
  markHintSeen: (id) => retry(() => rawRepo.markHintSeen(id)),
  resetHints: () => retry(() => rawRepo.resetHints()),
  getSettings: () => retry(() => rawRepo.getSettings()),
  saveSettings: (s) => retry(() => rawRepo.saveSettings(s)),
};

/** Current time, refreshed every 30 seconds so due counts tick over on their own. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useDashboard(now: number) {
  return useLiveQuery(async () => {
    const [rows, level, streak] = await Promise.all([
      db.progress.toArray(),
      repo.getMeta('currentLevel', 1),
      repo.getMeta<Streak | undefined>('streak', undefined),
    ]);
    return { ...summarise(rows, curriculum.items, level, now), streak: currentStreak(streak, now) };
  }, [now]);
}

/** The next lessons to start, limited by the batch size and today's allowance (see pacing.ts). */
export function loadLessonBatch(size: number, now: number): Promise<{ ids: string[]; pause: LessonPause }> {
  return retry(async () => {
    const rows = await db.progress.toArray();
    const allowance = lessonAllowance(rows, now);
    const ids = lessonQueue(curriculum.items, new Map(rows.map((r) => [r.itemId, r])))
      .slice(0, Math.min(size, allowance.available))
      .map((i) => i.id);
    return { ids, pause: allowance.pause };
  });
}

export function loadDueReviews(now: number): Promise<string[]> {
  return retry(async () => {
    const due = await db.progress.where('nextReviewAt').belowOrEqual(now).toArray();
    return due.filter((r) => r.stage >= 1 && r.stage <= 8).map((r) => r.itemId);
  });
}

/** Each item's stage right now; read once at the start of a session so labels don't shift mid-quiz. */
export function loadStages(itemIds: string[]): Promise<Map<string, Stage>> {
  return retry(async () => {
    const rows = await db.progress.bulkGet(itemIds);
    return new Map(rows.filter((r) => r !== undefined).map((r) => [r.itemId, r.stage]));
  });
}

/** Whether the first-run intro still needs showing; undefined while loading. */
export function useIntroDone(): boolean | undefined {
  return useLiveQuery(async () => introDone(await repo.getMeta<OnboardingState | undefined>('onboarding', undefined)), []);
}

/** Ids of the one-time hints already seen; undefined while loading. */
export function useHintsSeen(): string[] | undefined {
  return useLiveQuery(() => repo.getMeta<string[]>('hintsSeen', []), []);
}

export function useSettings(): Settings {
  return useLiveQuery(() => repo.getSettings(), [], DEFAULT_SETTINGS);
}

export function useSynonyms(itemId: string | undefined): string[] {
  return useLiveQuery(async () => (itemId ? (await db.overrides.get(itemId))?.synonyms ?? [] : []), [itemId], []);
}

export interface StoryStatus {
  story: Story;
  coverage: Coverage;
  /** The learner knows enough of the words (see STORY_UNLOCK). */
  ready: boolean;
  read: boolean;
}

/** Every story with how much of it the learner can read right now. */
export function useStories(): StoryStatus[] | undefined {
  return useLiveQuery(async () => {
    const [rows, read] = await Promise.all([db.progress.toArray(), repo.getMeta<string[]>('storiesRead', [])]);
    const known = new Set(rows.filter((r) => r.stage >= KNOWN_STAGE).map((r) => r.itemId));
    return stories.map((story) => {
      const c = coverage(storyTokens.get(story.id)!, (id) => known.has(id));
      return { story, coverage: c, ready: c.ratio >= STORY_UNLOCK, read: read.includes(story.id) };
    });
  }, []);
}

/** Item ids at the known stage or above, for marking words in the reader. */
export function useKnownItems(): Set<string> | undefined {
  return useLiveQuery(async () => {
    const rows = await db.progress.where('stage').aboveOrEqual(KNOWN_STAGE).toArray();
    return new Set(rows.map((r) => r.itemId));
  }, []);
}
