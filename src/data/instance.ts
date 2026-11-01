import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { curriculum } from '../content/curriculum';
import { summarise } from '../domain/dashboard';
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

export function loadLessonBatch(size: number): Promise<string[]> {
  return retry(async () => {
    const rows = await db.progress.toArray();
    return lessonQueue(curriculum.items, new Map(rows.map((r) => [r.itemId, r])))
      .slice(0, size)
      .map((i) => i.id);
  });
}

export function loadDueReviews(now: number): Promise<string[]> {
  return retry(async () => {
    const due = await db.progress.where('nextReviewAt').belowOrEqual(now).toArray();
    return due.filter((r) => r.stage >= 1 && r.stage <= 8).map((r) => r.itemId);
  });
}

export function useSettings(): Settings {
  return useLiveQuery(() => repo.getSettings(), [], DEFAULT_SETTINGS);
}

export function useSynonyms(itemId: string | undefined): string[] {
  return useLiveQuery(async () => (itemId ? (await db.overrides.get(itemId))?.synonyms ?? [] : []), [itemId], []);
}
