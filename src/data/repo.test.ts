import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ContentItem, Curriculum } from '../domain/types';
import { GipfelDb } from './db';
import { currentStreak, makeRepo, type Repo } from './repo';

const item = (id: string, level: number, order: number, prerequisites: string[] = []): ContentItem => ({
  id,
  level,
  order,
  kind: 'noun',
  german: id,
  article: 'der',
  plural: null,
  meanings: [id],
  prerequisites,
  example: { de: 'x', en: 'x' },
});

const curriculum: Curriculum = {
  contentVersion: 1,
  levels: [
    { number: 1, title: 'One' },
    { number: 2, title: 'Two' },
  ],
  items: [item('n-a', 1, 1), item('n-b', 1, 2), item('n-ab', 1, 3, ['n-a', 'n-b']), item('n-c', 2, 1)],
};

const HOUR = 3600_000;
const t0 = Date.parse('2026-11-01T09:00:00Z');

let db: GipfelDb;
let repo: Repo;

beforeEach(async () => {
  db = new GipfelDb(`test-${Math.random()}`);
  repo = makeRepo(db, curriculum);
  await repo.init(t0);
});

afterEach(async () => {
  await db.delete();
});

const stageOf = async (id: string) => (await db.progress.get(id))?.stage;
const pass = (itemId: string) => ({ itemId, wasWrong: false, meaningWrong: 0, germanWrong: 0 });

describe('repo', () => {
  it('starts at level 1 with every unlockable item, in any level, in the lesson queue', async () => {
    expect(await repo.getMeta('currentLevel', 0)).toBe(1);
    expect((await db.progress.toArray()).map((p) => [p.itemId, p.stage])).toEqual([
      ['n-a', 0],
      ['n-b', 0],
      ['n-c', 0],
    ]);
  });

  it('moves finished lessons to stage 1, due 4 hours later', async () => {
    await repo.finishLessons(['n-a'], t0);
    const p = await db.progress.get('n-a');
    expect(p?.stage).toBe(1);
    expect(p?.nextReviewAt).toBe(t0 + 4 * HOUR);
  });

  it('records reviews, logs them, and unlocks a compound when its parts reach the known stage (5)', async () => {
    await repo.finishLessons(['n-a', 'n-b'], t0);
    for (let i = 0; i < 4; i++) await repo.recordReviews([pass('n-a'), pass('n-b')], t0 + i);
    expect(await stageOf('n-a')).toBe(5);
    expect(await stageOf('n-ab')).toBe(0);
    expect(await db.reviews.count()).toBe(8);
  });

  it('drops a stage on a wrong review', async () => {
    await repo.finishLessons(['n-a'], t0);
    await repo.recordReviews([pass('n-a')], t0);
    await repo.recordReviews([{ itemId: 'n-a', wasWrong: true, meaningWrong: 1, germanWrong: 0 }], t0);
    expect(await stageOf('n-a')).toBe(1);
  });

  it('completes a level once 90% of it is at the known stage', async () => {
    await repo.finishLessons(['n-a', 'n-b'], t0);
    for (let i = 0; i < 4; i++) await repo.recordReviews([pass('n-a'), pass('n-b')], t0);
    await repo.finishLessons(['n-ab'], t0);
    let result = { levelBefore: 0, levelAfter: 0 };
    for (let i = 0; i < 4; i++) result = await repo.recordReviews([pass('n-ab')], t0);
    expect(result).toEqual({ levelBefore: 1, levelAfter: 2 });
    expect(await stageOf('n-c')).toBe(0);
  });

  it('counts a streak of consecutive days', async () => {
    await repo.finishLessons(['n-a'], t0);
    await repo.recordReviews([pass('n-a')], t0 + 24 * HOUR);
    const streak = await repo.getMeta<{ count: number; lastDay: string } | undefined>('streak', undefined);
    expect(streak?.count).toBe(2);
    expect(currentStreak(streak, t0 + 48 * HOUR)).toBe(2);
    expect(currentStreak(streak, t0 + 72 * HOUR)).toBe(0);
  });
});
