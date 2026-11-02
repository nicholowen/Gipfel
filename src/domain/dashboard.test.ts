import { describe, expect, it } from 'vitest';
import { summarise } from './dashboard';
import type { ContentItem, ItemProgress, Stage } from './types';

const HOUR = 3600_000;
const now = Date.parse('2026-11-01T09:30:00Z');

const item = (id: string, level = 1): ContentItem => ({
  id, level, order: 1, kind: 'other', german: id, meanings: [id], prerequisites: [], example: { de: 'x', en: 'x' },
});
const row = (itemId: string, stage: Stage, nextReviewAt: number | null): ItemProgress => ({
  itemId, stage, unlockedAt: 0, nextReviewAt, correctCount: 0, wrongCount: 0,
});

const items = ['a', 'b', 'c', 'd', 'e'].map((id) => item(id));
const rows = [
  row('a', 0, null),
  row('b', 1, now - HOUR),
  row('c', 2, now + 2 * HOUR),
  row('d', 5, now + 30 * HOUR),
  row('e', 9, null),
];

describe('summarise', () => {
  const s = summarise(rows, items, 1, now);

  it('counts lessons and due reviews', () => {
    expect(s.lessonsAvailable).toBe(1);
    expect(s.reviewsDue).toBe(1);
  });

  it('finds the next review in the future', () => {
    expect(s.nextReviewAt).toBe(now + 2 * HOUR);
  });

  it('buckets the next 24 hours', () => {
    expect(s.forecast).toHaveLength(24);
    expect(s.forecast.reduce((n, b) => n + b.count, 0)).toBe(1);
    expect(s.forecast[2].count).toBe(1);
  });

  it('counts stage groups', () => {
    expect(s.groups).toEqual({ 1: 2, 2: 1, 3: 0, 4: 0, 5: 1 });
  });

  it('reports level progress against the 90% target', () => {
    expect(s.level).toEqual({ number: 1, total: 5, known: 2, needed: 5 });
  });
});
