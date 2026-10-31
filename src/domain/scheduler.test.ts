import { describe, expect, it } from 'vitest';
import { GURU, nextReviewAt, nextStage, stageGroup } from './scheduler';
import type { Stage } from './types';

describe('nextStage', () => {
  it.each<[Stage, Stage]>([
    [1, 2],
    [4, 5],
    [8, 9],
  ])('moves stage %i up to %i on a correct review', (from, to) => {
    expect(nextStage(from, false)).toBe(to);
  });

  it.each<[Stage, Stage]>([
    [1, 1],
    [2, 1],
    [4, 3],
    [5, 3],
    [6, 4],
    [8, 6],
  ])('drops stage %i to %i on a wrong review', (from, to) => {
    expect(nextStage(from, true)).toBe(to);
  });

  it('never goes above burned', () => {
    expect(nextStage(9, false)).toBe(9);
  });
});

describe('nextReviewAt', () => {
  const now = Date.parse('2026-11-01T10:37:12Z');

  it.each<[Stage, string]>([
    [1, '2026-11-01T14:00:00.000Z'],
    [2, '2026-11-01T18:00:00.000Z'],
    [3, '2026-11-02T10:00:00.000Z'],
    [4, '2026-11-03T10:00:00.000Z'],
    [5, '2026-11-08T10:00:00.000Z'],
    [6, '2026-11-15T10:00:00.000Z'],
    [7, '2026-12-01T10:00:00.000Z'],
    [8, '2027-03-01T10:00:00.000Z'],
  ])('schedules stage %i for %s (rounded down to the hour)', (stage, expected) => {
    expect(new Date(nextReviewAt(stage, now)!).toISOString()).toBe(expected);
  });

  it('never schedules a burned item', () => {
    expect(nextReviewAt(9, now)).toBeNull();
  });

  it('does not schedule items still in the lesson queue', () => {
    expect(nextReviewAt(0, now)).toBeNull();
  });
});

describe('stageGroup', () => {
  it('names each stage', () => {
    expect([0, 1, 4, 5, 6, 7, 8, 9].map((s) => stageGroup(s as Stage))).toEqual([
      'lesson',
      'apprentice',
      'apprentice',
      'guru',
      'guru',
      'master',
      'enlightened',
      'burned',
    ]);
  });

  it('treats stage 5 as Guru', () => {
    expect(GURU).toBe(5);
  });
});
