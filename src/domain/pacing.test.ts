import { describe, expect, it } from 'vitest';
import { DAILY_NEW_ITEMS, EARLY_STAGE_LIMIT, lessonAllowance } from './pacing';
import type { ItemProgress, Stage } from './types';

const HOUR = 3600_000;
// Midday local time, so "earlier today" and "yesterday" are unambiguous in any time zone.
const d = new Date();
d.setHours(12, 0, 0, 0);
const now = d.getTime();

let n = 0;
const row = (stage: Stage, startedAt?: number): ItemProgress => ({
  itemId: `i${n++}`,
  stage,
  unlockedAt: 0,
  startedAt,
  nextReviewAt: null,
  correctCount: 0,
  wrongCount: 0,
});
const many = (count: number, stage: Stage, startedAt?: number) => Array.from({ length: count }, () => row(stage, startedAt));

describe('lessonAllowance', () => {
  it(`allows ${DAILY_NEW_ITEMS} new items on a fresh day`, () => {
    const a = lessonAllowance(many(30, 0), now);
    expect(a).toMatchObject({ available: DAILY_NEW_ITEMS, waiting: 30, pause: null });
  });

  it('counts items started earlier today against the daily allowance', () => {
    const a = lessonAllowance([...many(30, 0), ...many(3, 1, now - 2 * HOUR)], now);
    expect(a.available).toBe(DAILY_NEW_ITEMS - 3);
    expect(a.startedToday).toBe(3);
  });

  it('ignores items started yesterday', () => {
    const a = lessonAllowance([...many(30, 0), ...many(5, 2, now - 24 * HOUR)], now);
    expect(a.available).toBe(DAILY_NEW_ITEMS);
  });

  it('pauses for the day once the allowance is used', () => {
    const a = lessonAllowance([...many(30, 0), ...many(DAILY_NEW_ITEMS, 1, now - HOUR)], now);
    expect(a).toMatchObject({ available: 0, pause: 'daily' });
  });

  it('never offers more than are waiting', () => {
    expect(lessonAllowance(many(2, 0), now).available).toBe(2);
  });

  it('says when there is nothing left to learn', () => {
    expect(lessonAllowance(many(10, 6), now).pause).toBe('empty');
  });

  it('pauses while too many items are in the early stages', () => {
    const a = lessonAllowance([...many(30, 0), ...many(EARLY_STAGE_LIMIT, 3, now - 48 * HOUR)], now);
    expect(a).toMatchObject({ available: 0, pause: 'busy', earlyStage: EARLY_STAGE_LIMIT });
  });

  it('only offers the room left under the early-stage limit', () => {
    const a = lessonAllowance([...many(30, 0), ...many(EARLY_STAGE_LIMIT - 2, 4, now - 48 * HOUR)], now);
    expect(a.available).toBe(2);
  });

  it('does not count the known stage and above as early', () => {
    const a = lessonAllowance([...many(30, 0), ...many(100, 5, now - 96 * HOUR)], now);
    expect(a).toMatchObject({ available: DAILY_NEW_ITEMS, earlyStage: 0 });
  });
});
